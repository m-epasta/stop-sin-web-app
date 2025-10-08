import { NextRequest, NextResponse } from 'next/server';

export const VALID_API_KEYS = [
  "aks_7f8e3b2c1d9a4f6e5c8b0a9d7e6f5c4b",
  "aks_a1b2c3d4e5f67890abcdef1234567890",
  "aks_9876543210fedcba0123456789abcdef"
];

const [monthlyUsers, dailyUsers, avgUserPerCountry] = VALID_API_KEYS;

// Rate limit storage
const rateLimitMap = new Map<string, Date[]>();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    // Check rate limit
    const rateLimitResult = checkRateLimit(token);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }

    // Validate API key and return data
    return analyzeAuth(token, rateLimitResult);
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

function analyzeAuth(token: string, rateLimitResult: { allowed: boolean; remaining: number; resetTime: Date }) {
  let accessType = '';
  
  if (token === monthlyUsers) {
    accessType = 'monthly';
  } else if (token === dailyUsers) {
    accessType = 'daily';
  } else if (token === avgUserPerCountry) {
    accessType = 'country_avg';
  } else {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  const data = runData(token, accessType);

  const responseData = { 
    success: true,
    message: "Authorization successful",
    accessType: accessType,
    data: data,
    rateLimit: {
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime
    }
  };

  return NextResponse.json(responseData);
}

function runData(token: string, accessType: string) {
  switch(accessType) {
    case 'monthly':
      return { 
        message: "Monthly user data", 
        users: 1500,
        growth: "+12% from last month",
        period: "January 2024"
      };
    case 'daily':
      return { 
        message: "Daily user data", 
        users: 50,
        activeSessions: 127,
        date: new Date().toISOString().split('T')[0]
      };
    case 'country_avg':
      return { 
        message: "Average users per country", 
        average: 75,
        topCountries: [
          { country: "United States", users: 320 },
          { country: "Brazil", users: 285 },
          { country: "Philippines", users: 198 }
        ]
      };
    default:
      return { message: "Unknown data type" };
  }
}

// Rate limiting functions
function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; resetTime: Date } {
  const rateLimitConfig = getRateLimitConfig();
  const now = new Date();
  const windowStart = new Date(now.getTime() - rateLimitConfig.windowMs);
  
  const timestamps = rateLimitMap.get(apiKey) || [];
  const recentRequests = timestamps.filter(time => time > windowStart);
  const allowed = recentRequests.length < rateLimitConfig.limit;
  
  if (allowed) {
    recentRequests.push(now);
    rateLimitMap.set(apiKey, recentRequests);
  }
  
  cleanupOldEntries();
  
  return {
    allowed,
    remaining: Math.max(0, rateLimitConfig.limit - recentRequests.length),
    resetTime: new Date(now.getTime() + rateLimitConfig.windowMs)
  };
}

function getRateLimitConfig(): { limit: number; windowMs: number } {
  const envLimit = process.env.RATE_LIMIT;
  
  if (!envLimit) {
    console.warn('RATE_LIMIT not set, using default limit of 100 requests per minute');
    return { limit: 100, windowMs: 60000 };
  }
  
  const parsedLimit = parseInt(envLimit, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    console.warn(`Invalid RATE_LIMIT: "${envLimit}", using default`);
    return { limit: 100, windowMs: 60000 };
  }
  
  return { limit: parsedLimit, windowMs: 60000 };
}

function cleanupOldEntries() {
  const now = new Date();
  const cleanupThreshold = new Date(now.getTime() - 2 * 60000);
  
  for (const [apiKey, timestamps] of rateLimitMap.entries()) {
    const recentTimestamps = timestamps.filter(time => time > cleanupThreshold);
    if (recentTimestamps.length === 0) {
      rateLimitMap.delete(apiKey);
    } else {
      rateLimitMap.set(apiKey, recentTimestamps);
    }
  }
}
