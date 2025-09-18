import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions, getQuestion } from '@/lib/database';
import { validateExportFormat } from '@/lib/validation';
import { ApiResponse, ValidationError, DatabaseError } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedRequest = validateExportFormat(body);
    
    const { format, questionIds } = validatedRequest;

    // Get questions to export
    let questions;
    if (questionIds && questionIds.length > 0) {
      // Export specific questions
      questions = questionIds
        .map(id => getQuestion(id))
        .filter(q => q !== null);
      
      if (questions.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No valid questions found for the provided IDs' 
          },
          { status: 404 }
        );
      }
    } else {
      // Export all questions
      questions = getAllQuestions();
      
      if (questions.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No questions available for export' 
          },
          { status: 404 }
        );
      }
    }

    if (format === 'markdown') {
      try {
        let markdown = '# AI Coding Book - Questions\n\n';
        markdown += `*Generated on: ${new Date().toLocaleDateString()}*\n\n`;
        markdown += `**Total Questions:** ${questions.length}\n\n`;
        markdown += '---\n\n';
        
        questions.forEach((question, index) => {
          markdown += `## ${question.id}: ${question.title}\n\n`;
          markdown += `**Difficulty:** ${question.difficulty}  \n`;
          markdown += `**Topics:** ${question.topics.join(', ')}  \n`;
          markdown += `**Created:** ${new Date(question.created_at).toLocaleDateString()}\n\n`;
          
          markdown += `### Description\n\n${question.description}\n\n`;
          
          markdown += `### Example\n\n`;
          markdown += `**Input:**\n\`\`\`\n${question.example.input}\n\`\`\`\n\n`;
          markdown += `**Output:**\n\`\`\`\n${question.example.output}\n\`\`\`\n\n`;
          markdown += `**Explanation:** ${question.example.explanation}\n\n`;
          
          markdown += `### Solution\n\n\`\`\`python\n${question.solution_python}\n\`\`\`\n\n`;
          
          markdown += `### Step-by-Step Explanation\n\n`;
          question.step_by_step_explanation.forEach((step, stepIndex) => {
            markdown += `${stepIndex + 1}. ${step}\n`;
          });
          markdown += '\n';
          
          if (question.pseudocode && question.pseudocode.length > 0) {
            markdown += `### Pseudocode\n\n\`\`\`\n${question.pseudocode.join('\n')}\n\`\`\`\n\n`;
          }
          
          if (index < questions.length - 1) {
            markdown += '---\n\n';
          }
        });
        
        const buffer = Buffer.from(markdown, 'utf-8');
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="coding-questions-${Date.now()}.md"`,
            'Content-Length': buffer.length.toString(),
          },
        });
        
      } catch (error) {
        console.error('Markdown generation error:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to generate Markdown' 
          },
          { status: 500 }
        );
      }
    } else if (format === 'pdf') {
      // For PDF generation, return the data to be processed client-side
      return NextResponse.json({
        success: true,
        data: {
          questions,
          metadata: {
            title: 'AI Coding Book - Questions',
            generatedOn: new Date().toLocaleDateString(),
            totalQuestions: questions.length,
          }
        },
        message: 'Questions data ready for PDF generation'
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid export format' 
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error in POST /api/export:', error);

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
        error: 'Export operation failed' 
      },
      { status: 500 }
    );
  }
}

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