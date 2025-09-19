import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions, getQuestion, searchQuestions, getQuestionsByDifficulty } from '@/lib/database';
import { ApiResponse, ValidationError, DatabaseError } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const difficulty = searchParams.get('difficulty') as 'Easy' | 'Medium' | 'Hard' | null;
    
    // Get specific question by ID
    if (id) {
      if (typeof id !== 'string' || id.trim().length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid question ID provided' 
          },
          { status: 400 }
        );
      }

      const question = getQuestion(id.trim());
      
      if (!question) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Question not found' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: question
      });
    }

    // Search questions
    if (search) {
      if (typeof search !== 'string' || search.trim().length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid search term provided' 
          },
          { status: 400 }
        );
      }

      const questions = searchQuestions(search.trim());
      return NextResponse.json({
        success: true,
        data: questions,
        message: `Found ${questions.length} questions matching "${search}"`
      });
    }

    // Filter by difficulty
    if (difficulty) {
      if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid difficulty level. Must be Easy, Medium, or Hard' 
          },
          { status: 400 }
        );
      }

      const questions = getQuestionsByDifficulty(difficulty);
      return NextResponse.json({
        success: true,
        data: questions,
        message: `Found ${questions.length} ${difficulty} questions`
      });
    }

    // Get all questions
    const questions = getAllQuestions();
    return NextResponse.json({
      success: true,
      data: questions,
      message: `Retrieved ${questions.length} questions`
    });

  } catch (error) {
    console.error('Error in GET /api/questions:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
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

// Health check endpoint
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Simple health check - try to get question count
    getAllQuestions();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}