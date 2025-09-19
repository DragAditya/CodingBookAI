import { NextRequest, NextResponse } from 'next/server';
import { getQuestion } from '@/lib/database';
import { generateChatResponse } from '@/lib/gemini';
import { ApiResponse, ValidationError, GeminiError, DatabaseError } from '@/lib/types';
import { validateChatRequest } from '@/lib/validation';
import { getErrorMessage } from '@/lib/utils';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ response: string }>>> {
  try {
    const body = await request.json();
    const validatedRequest = validateChatRequest(body);
    
    const { questionId, message, chatHistory } = validatedRequest;

    // Get the question context
    const question = getQuestion(questionId);
    if (!question) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Question not found' 
        },
        { status: 404 }
      );
    }

    // Validate message content
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message cannot be empty' 
        },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message cannot exceed 1000 characters' 
        },
        { status: 400 }
      );
    }

    // Limit chat history to prevent token overflow
    const limitedHistory = chatHistory.slice(-10);

    // Generate AI response
    const aiResponse = await generateChatResponse(question, trimmedMessage, limitedHistory);

    if (!aiResponse || aiResponse.trim().length === 0) {
      throw new GeminiError('Empty response from AI service');
    }

    return NextResponse.json({
      success: true,
      data: { response: aiResponse.trim() },
      message: 'Chat response generated successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/chat:', error);

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
          error: 'AI service is temporarily unavailable. Please try again in a moment.' 
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
        error: 'Failed to generate response. Please try again.' 
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