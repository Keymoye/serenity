import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Gracefully handle missing env vars in dev
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Auth rate limits
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null

// Helper — returns true if request should
// be blocked
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null,
): Promise<{ blocked: boolean; headers: Record<string, string> }> {
  if (!limiter) {
    // Rate limiting disabled (dev/no redis)
    return { blocked: false, headers: {} }
  }
  const { success, limit, remaining, reset } =
    await limiter.limit(identifier)
  return {
    blocked: !success,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(reset),
    },
  }
}
