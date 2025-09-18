// Simple rate limiting implementation
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  requests: number[];
  lastReset: number;
}

class RateLimiter {
  private clients = new Map<string, RateLimitInfo>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup old entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  isAllowed(clientId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let clientInfo = this.clients.get(clientId);
    
    if (!clientInfo) {
      clientInfo = {
        requests: [],
        lastReset: now,
      };
      this.clients.set(clientId, clientInfo);
    }

    // Remove requests outside the current window
    clientInfo.requests = clientInfo.requests.filter(time => time > windowStart);
    
    const currentRequests = clientInfo.requests.length;
    const allowed = currentRequests < this.config.maxRequests;
    
    if (allowed) {
      clientInfo.requests.push(now);
    }

    const remaining = Math.max(0, this.config.maxRequests - clientInfo.requests.length);
    const resetTime = windowStart + this.config.windowMs;

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  reset(clientId: string): void {
    this.clients.delete(clientId);
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.config.windowMs * 2; // Keep data for 2 windows
    
    for (const [clientId, info] of this.clients.entries()) {
      if (info.lastReset < cutoff) {
        this.clients.delete(clientId);
      }
    }
  }

  getStats(): { totalClients: number; activeClients: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let activeClients = 0;
    
    for (const [_, info] of this.clients.entries()) {
      const activeRequests = info.requests.filter(time => time > windowStart);
      if (activeRequests.length > 0) {
        activeClients++;
      }
    }

    return {
      totalClients: this.clients.size,
      activeClients,
    };
  }
}

// Rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limiter: 100 requests per minute
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),

  // Generation rate limiter: 5 requests per minute (more restrictive)
  generation: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),

  // Chat rate limiter: 30 requests per minute
  chat: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  }),

  // Export rate limiter: 10 requests per minute
  export: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),
};

// Utility function to get client ID from request
export function getClientId(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return clientIp;
}

// Rate limit middleware
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (request: Request) => {
    const clientId = getClientId(request);
    const result = limiter.isAllowed(clientId);
    
    const headers = new Headers({
      'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    });

    return {
      allowed: result.allowed,
      headers,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  };
}