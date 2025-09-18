import { NextRequest, NextResponse } from 'next/server';
import { getQuestionStats } from '@/lib/database';
import { cache } from '@/lib/cache';

interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  questions: {
    total: number;
    byDifficulty: Record<string, number>;
  };
  cache: {
    size: number;
    keys: string[];
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const stats = getQuestionStats();
    const cacheStats = cache.getStats();

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      questions: stats,
      cache: cacheStats,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Metrics collection failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

// Only allow GET requests
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}