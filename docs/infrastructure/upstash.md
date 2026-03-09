# Upstash Redis (Rate Limiting)

## Overview
Upstash Redis provides serverless Redis for rate limiting authentication endpoints in the Serenity Spa booking application. This prevents brute-force attacks on login, register, magic-link, and password reset endpoints. Upstash is used because it requires no infrastructure management and provides a generous free tier.

## Environment variables
| Variable | Required | Purpose | Where to get it |
|----------|----------|---------|-----------------|
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST API endpoint | Upstash Dashboard → Database → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis authentication token | Upstash Dashboard → Database → REST Token |

**Security notes:**
- Both variables are secret (never expose to client)
- REST token provides full database access
- No Redis password needed (uses token auth)

## Rate limit configuration

| Setting | Value | Meaning |
|---------|-------|---------|
| Algorithm | Sliding window | Allows bursts, smooths over time |
| Requests | 10 | Maximum requests per window |
| Window | 15 minutes | Time window for rate limiting |
| Analytics | true | Tracks metrics in Upstash dashboard |

**Implementation details:**
```typescript
// lib/infra/upstash/ratelimit.ts
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        AUTH_RATE_LIMIT_REQUESTS,  // 10
        AUTH_RATE_LIMIT_WINDOW     // "15 m"
      ),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;
```

**Sliding window behavior:**
- Counts requests in rolling 15-minute window
- Older requests fall off as window slides
- More user-friendly than fixed windows
- Allows natural request patterns

## Protected endpoints

All authentication endpoints are rate limited:

| Endpoint | Rate limit | Purpose |
|----------|------------|---------|
| `POST /api/auth/login` | 10/15min | Prevent login brute force |
| `POST /api/auth/register` | 10/15min | Prevent spam registration |
| `POST /api/auth/magic-link` | 10/15min | Prevent email bombing |
| `POST /api/auth/reset-password` | 10/15min | Prevent password reset abuse |

**Rate limit implementation pattern:**
```typescript
// In each protected API route
const ip = request.ip || "unknown";
const identifier = `login:${ip}`;  // endpoint:ip format
const { blocked } = await checkRateLimit(identifier, authRatelimit);

if (blocked) {
  return NextResponse.json(
    { error: "Too many requests", code: "RATE_LIMITED" },
    { status: 429 }
  );
}
```

## Graceful degradation

### Development-friendly behavior:
```typescript
// lib/infra/upstash/ratelimit.ts
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null,
): Promise<{ blocked: boolean; headers: Record<string, string> }> {
  if (!limiter) {
    // Rate limiting disabled (dev/no redis)
    return { blocked: false, headers: {} }
  }
  // ... normal rate limiting logic
}
```

**Behavior without Redis:**
- `checkRateLimit()` always returns `blocked: false`
- No rate limiting headers returned
- Application works normally in development
- Production requires Redis for security

**Why this approach:**
- No Redis dependency blocks development
- Local development doesn't need external services
- CI/CD can run without Redis setup
- Rate limiting is production-only security feature

## Identifier pattern

### Key format:
`"endpoint:ip_address"`

### Examples:
- `"login:192.168.1.100"`
- `"register:10.0.0.5"`
- `"magic-link:172.16.0.1"`
- `"reset-password:127.0.0.1"`

### IP address extraction:
```typescript
// In API routes
const ip = request.ip || "unknown";

// Fallback for environments without IP
// (e.g., some serverless platforms)
```

### Endpoint-specific prefixes:
```typescript
// Different endpoints use different prefixes
const loginIdentifier = `login:${ip}`;
const registerIdentifier = `register:${ip}`;
const magicLinkIdentifier = `magic-link:${ip}`;
const resetIdentifier = `reset-password:${ip}`;
```

**Why endpoint-specific:**
- User might legitimately login multiple times
- But shouldn't spam registration endpoint
- Separate limits per endpoint type

## How to set up Upstash

### Step 1: Create Upstash account
1. Visit [upstash.com](https://upstash.com)
2. Sign up for free account
3. No credit card required for free tier

### Step 2: Create Redis database
1. In Upstash Dashboard, click "Create Database"
2. Choose region closest to your users
3. Select free tier (sufficient for rate limiting)
4. Click "Create"

### Step 3: Get credentials
1. Open your database in Upstash Dashboard
2. Click "Connect" → "REST"
3. Copy **REST URL** and **REST Token**
4. Add to your `.env.local` file

### Step 4: Configure application
```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-secret-token
```

### Step 5: Verify setup
```bash
# Restart development server
pnpm dev

# Try login endpoint multiple times
# Should get 429 after 10 attempts in 15 minutes
```

## Monitoring

### Upstash Dashboard features:
- **Request metrics** - See rate limiting activity
- **Key analytics** - Monitor Redis key usage
- **Performance metrics** - Latency and throughput
- **Error tracking** - Failed operations

### Key metrics to monitor:
1. **Rate limit hits** - How often users are blocked
2. **Redis operations** - Total rate limit checks
3. **Latency** - Should be < 100ms globally
4. **Memory usage** - Rate limiting uses minimal memory

### Analytics configuration:
```typescript
// analytics: true enables detailed tracking
new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  analytics: true,  // ← Enables dashboard analytics
  prefix: "ratelimit:auth",
});
```

### Dashboard views:
1. **Overview** - Total requests, success rate
2. **Commands** - Rate limit check operations
3. **Keys** - Active rate limit keys
4. **Slow queries** - Should be none for rate limiting

## Rate limiting response

### HTTP 429 response:
```typescript
if (blocked) {
  return NextResponse.json(
    { 
      error: "Too many requests", 
      code: "RATE_LIMITED" 
    },
    { 
      status: 429,
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "0", 
        "X-RateLimit-Reset": "1704067200000"
      }
    }
  );
}
```

### Response headers:
| Header | Value | Meaning |
|--------|-------|---------|
| `X-RateLimit-Limit` | "10" | Max requests per window |
| `X-RateLimit-Remaining` | "3" | Requests remaining |
| `X-RateLimit-Reset` | timestamp | Window reset time (Unix ms) |

### Client handling:
```typescript
// Client can check headers to show countdown
const remaining = response.headers.get('X-RateLimit-Remaining');
const resetTime = response.headers.get('X-RateLimit-Reset');

if (remaining === '0') {
  const waitMinutes = Math.ceil((resetTime - Date.now()) / 60000);
  showMessage(`Rate limited. Try again in ${waitMinutes} minutes.`);
}
```

## Extending rate limiting

### Adding rate limiting to new endpoint:

#### 1. Import rate limiting helper
```typescript
import { checkRateLimit, authRatelimit } from "@/lib/infra/upstash/ratelimit";
```

#### 2. Add to API route
```typescript
export async function POST(request: NextRequest) {
  // Get IP address
  const ip = request.ip || "unknown";
  
  // Create identifier
  const identifier = `my-endpoint:${ip}`;
  
  // Check rate limit
  const { blocked } = await checkRateLimit(identifier, authRatelimit);
  
  // Return 429 if blocked
  if (blocked) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }
  
  // Continue with normal endpoint logic
  // ...
}
```

#### 3. Consider custom limits
```typescript
// For different limits per endpoint
export const contactRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 per hour
      analytics: true,
      prefix: "ratelimit:contact",
    })
  : null;

// Use in contact endpoint
const { blocked } = await checkRateLimit(`contact:${ip}`, contactRatelimit);
```

### Rate limiting strategies:

#### 1. Per-user rate limiting:
```typescript
// Instead of IP, use user ID
const identifier = `booking:${userId}`;
```

#### 2. Per-resource rate limiting:
```typescript
// Limit actions on specific resources
const identifier = `upload:${userId}:${bucket}`;
```

#### 3. Tiered rate limiting:
```typescript
// Different limits for different user types
const limit = user.role === 'admin' ? 100 : 10;
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(limit, "15 m"),
});
```

## Production considerations

### Redis connection:
- **Global edge network** - Upstash has low latency worldwide
- **Automatic failover** - Built-in redundancy
- **Persistent storage** - Data survives restarts
- **SSL/TLS** - Encrypted connections

### Security:
- **Token-based auth** - No passwords in connection strings
- **Network isolation** - Redis not exposed to internet
- **Least privilege** - Use separate tokens per environment
- **Token rotation** - Regenerate tokens if compromised

### Performance:
- **Sub-millisecond latency** - Rate checks are fast
- **Connection pooling** - Managed by Upstash client
- **Automatic scaling** - No capacity planning needed
- **Memory efficient** - Sliding window uses minimal memory

### Monitoring alerts:
- **High 429 rate** - May indicate abuse or system issues
- **Redis latency spikes** - Could affect user experience
- **Memory usage** - Monitor for memory leaks
- **Error rates** - Failed rate limit checks

## Troubleshooting

### Common issues:

#### 1. Rate limiting not working
**Symptoms:** No 429 responses, unlimited requests
**Causes:** Missing Redis configuration
**Solutions:** 
```bash
# Check environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Verify in logs
# Should see "Rate limiting disabled" if Redis missing
```

#### 2. All requests blocked
**Symptoms:** Immediate 429 on first request
**Causes:** Redis connectivity issues
**Solutions:**
- Check REST URL and token are correct
- Verify database is active in Upstash
- Check network connectivity

#### 3. High latency
**Symptoms:** Slow API responses
**Causes:** Redis region far from users
**Solutions:**
- Choose closer Redis region
- Consider edge caching
- Monitor Upstash status page

#### 4. Memory usage growing
**Symptoms:** Increasing Redis memory
**Causes:** Rate limit keys not expiring
**Solutions:**
- Sliding window should auto-expire
- Check for key leaks in dashboard
- Restart Redis if needed

### Debugging tools:
```typescript
// Add logging for rate limit checks
logger.info("Rate limit check", {
  identifier,
  blocked,
  remaining: response.headers.get('X-RateLimit-Remaining'),
  reset: response.headers.get('X-RateLimit-Reset'),
});
```

### Testing rate limiting:
```typescript
// Test script to verify rate limiting
async function testRateLimit() {
  const ip = "test-ip";
  let blockedCount = 0;
  
  for (let i = 0; i < 15; i++) {
    const { blocked } = await checkRateLimit(`login:${ip}`, authRatelimit);
    if (blocked) blockedCount++;
    console.log(`Request ${i + 1}: blocked=${blocked}`);
  }
  
  console.log(`Total blocked: ${blockedCount}`); // Should be 5
}
```
