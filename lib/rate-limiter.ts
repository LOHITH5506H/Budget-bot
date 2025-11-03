/**
 * Rate Limiting Utility for API Calls
 * Helps prevent 429 rate limiting errors from external APIs
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  retryAfter?: number
}

interface RateLimitState {
  requests: number[]
  lastReset: number
}

class RateLimiter {
  private states = new Map<string, RateLimitState>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now()
    const state = this.states.get(key) || { requests: [], lastReset: now }

    // Clean up old requests outside the window
    state.requests = state.requests.filter(timestamp => 
      now - timestamp < this.config.windowMs
    )

    // Check if we've exceeded the limit
    if (state.requests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...state.requests)
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000)
      
      return { 
        allowed: false, 
        retryAfter: this.config.retryAfter || retryAfter 
      }
    }

    // Add current request
    state.requests.push(now)
    this.states.set(key, state)

    return { allowed: true }
  }

  async executeWithLimit<T>(
    key: string,
    fn: () => Promise<T>,
    options?: { maxRetries?: number; retryDelay?: number }
  ): Promise<T> {
    const maxRetries = options?.maxRetries || 3
    const retryDelay = options?.retryDelay || 1000

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const limitCheck = await this.checkLimit(key)
      
      if (!limitCheck.allowed) {
        if (attempt === maxRetries) {
          throw new Error(`Rate limit exceeded after ${maxRetries} retries`)
        }
        
        const delay = limitCheck.retryAfter ? limitCheck.retryAfter * 1000 : retryDelay
        await this.delay(delay)
        continue
      }

      try {
        return await fn()
      } catch (error: any) {
        // If it's a rate limit error, retry
        if (error.status === 429 || error.message?.includes('rate limit')) {
          if (attempt === maxRetries) {
            throw error
          }
          await this.delay(retryDelay * Math.pow(2, attempt)) // Exponential backoff
          continue
        }
        
        // For other errors, throw immediately
        throw error
      }
    }

    throw new Error('Max retries exceeded')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  reset(key: string): void {
    this.states.delete(key)
  }

  getStats(key: string): { requests: number; window: number } | null {
    const state = this.states.get(key)
    if (!state) return null

    const now = Date.now()
    const validRequests = state.requests.filter(timestamp => 
      now - timestamp < this.config.windowMs
    )

    return {
      requests: validRequests.length,
      window: this.config.windowMs
    }
  }
}

// Pre-configured rate limiters for common APIs
export const rateLimiters = {
  // Gemini API - Conservative limits to avoid 429 errors
  gemini: new RateLimiter({
    maxRequests: 10, // 10 requests per minute
    windowMs: 60 * 1000, // 1 minute
    retryAfter: 60 // Wait 60 seconds on rate limit
  }),

  // SendPulse API
  sendpulse: new RateLimiter({
    maxRequests: 30, // 30 requests per minute
    windowMs: 60 * 1000,
    retryAfter: 30
  }),

  // Logo.dev API
  logodev: new RateLimiter({
    maxRequests: 100, // 100 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    retryAfter: 60
  }),

  // Supabase - Higher limits for internal API
  supabase: new RateLimiter({
    maxRequests: 100, // 100 requests per minute
    windowMs: 60 * 1000,
    retryAfter: 10
  }),

  // General API calls
  general: new RateLimiter({
    maxRequests: 50, // 50 requests per minute
    windowMs: 60 * 1000,
    retryAfter: 30
  })
}

// Utility functions for common use cases
export async function withGeminiRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return rateLimiters.gemini.executeWithLimit('gemini-api', fn, {
    maxRetries: 3,
    retryDelay: 2000
  })
}

export async function withSendPulseRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return rateLimiters.sendpulse.executeWithLimit('sendpulse-api', fn)
}

export async function withSupabaseRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return rateLimiters.supabase.executeWithLimit('supabase-api', fn)
}

// Rate limiting middleware for Next.js API routes
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (request: Request, key?: string): Promise<Response | null> => {
    const clientKey = key || getClientKey(request)
    const limitCheck = await limiter.checkLimit(clientKey)
    
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: limitCheck.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': limitCheck.retryAfter?.toString() || '60'
          }
        }
      )
    }
    
    return null // Allow request to proceed
  }
}

// Get client key for rate limiting (IP or user ID)
function getClientKey(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIP || cfConnectingIP || 'unknown'
  
  return `ip:${ip}`
}

export default RateLimiter