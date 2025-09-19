import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionMetadata } from '@/lib/gemini';
import { saveQuestion } from '@/lib/database';
import { Question, ApiResponse, GenerationStatus, ValidationError, GeminiError, DatabaseError } from '@/lib/types';
import { validateGenerateRequest, validateAndSanitizeTitle } from '@/lib/validation';
import { generateId, getErrorMessage, sleep } from '@/lib/utils';

const MAX_CONCURRENT_GENERATIONS = 3;
const GENERATION_DELAY = 1000; // 1 second between generations

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<GenerationStatus>>> {
  try {
    const body = await request.json();
    const validatedRequest = validateGenerateRequest(body);
    
    if (validatedRequest.titles.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one question title is required' 
        },
        { status: 400 }
      );
    }

    if (validatedRequest.titles.length > 20) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Maximum 20 questions can be generated at once' 
        },
        { status: 400 }
      );
    }

    const generationStatus: GenerationStatus = {
      total: validatedRequest.titles.length,
      completed: 0,
      failed: 0,
      errors: []
    };

    const generatedQuestions: Question[] = [];

    // Process titles in batches to avoid overwhelming the API
    const batches = [];
    for (let i = 0; i < validatedRequest.titles.length; i += MAX_CONCURRENT_GENERATIONS) {
      batches.push(validatedRequest.titles.slice(i, i + MAX_CONCURRENT_GENERATIONS));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (title, batchIndex) => {
        try {
          // Validate and sanitize title
          const sanitizedTitle = validateAndSanitizeTitle(title);
          
          // Add delay between requests to respect rate limits
          if (batchIndex > 0) {
            await sleep(GENERATION_DELAY);
          }

          const metadata = await generateQuestionMetadata(sanitizedTitle);
          
          const question: Question = {
            id: generateId(),
            ...metadata,
            title: sanitizedTitle, // Use sanitized title
            created_at: new Date().toISOString(),
          };

          // Validate generated question before saving
          if (!question.title || !question.description || !question.solution_python) {
            throw new Error('Generated question is incomplete');
          }

          saveQuestion(question);
          generatedQuestions.push(question);
          generationStatus.completed++;
          
          return { success: true, question };
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error(`Error generating question for "${title}":`, errorMessage);
          
          generationStatus.failed++;
          generationStatus.errors.push(`Failed to generate "${title}": ${errorMessage}`);
          
          return { success: false, error: errorMessage, title };
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
      
      // Add delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await sleep(GENERATION_DELAY * 2);
      }
    }

    // Determine response status based on results
    if (generationStatus.completed === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate any questions',
          data: generationStatus
        },
        { status: 500 }
      );
    }

    const isPartialSuccess = generationStatus.failed > 0;
    const statusCode = isPartialSuccess ? 207 : 200; // 207 Multi-Status for partial success

    return NextResponse.json(
      { 
        success: !isPartialSuccess,
        data: generationStatus,
        message: `Successfully generated ${generationStatus.completed} out of ${generationStatus.total} questions${
          isPartialSuccess ? ` (${generationStatus.failed} failed)` : ''
        }`
      },
      { status: statusCode }
    );

  } catch (error) {
    console.error('Error in POST /api/generate:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
      );
    }

    if (error instanceof GeminiError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service temporarily unavailable. Please try again later.' 
        },
        { status: 503 }
      );
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database operation failed' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Rate limiting check
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}