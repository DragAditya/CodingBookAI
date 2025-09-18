import { NextRequest, NextResponse } from 'next/server';
import { getQuestionCount } from '@/lib/database';
import { validateGeminiApiKey } from '@/lib/gemini';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    ai: 'healthy' | 'unhealthy';
  };
  metrics?: {
    totalQuestions: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'healthy',
      ai: 'healthy',
    },
  };

  try {
    // Check database health
    try {
      const questionCount = getQuestionCount();
      healthStatus.metrics = {
        totalQuestions: questionCount,
        memoryUsage: process.memoryUsage(),
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'unhealthy';
    }

    // Check AI service health (optional, might be slow)
    const checkAI = request.nextUrl.searchParams.get('check_ai') === 'true';
    if (checkAI) {
      try {
        const isAiHealthy = await validateGeminiApiKey();
        if (!isAiHealthy) {
          healthStatus.services.ai = 'unhealthy';
          healthStatus.status = 'unhealthy';
        }
      } catch (error) {
        console.error('AI service health check failed:', error);
        healthStatus.services.ai = 'unhealthy';
        healthStatus.status = 'unhealthy';
      }
    }

    const responseTime = Date.now() - startTime;
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

// Simple health check endpoint for load balancers
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Quick database check
    getQuestionCount();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}