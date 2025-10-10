import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../lib/logger';
import  { translateJSONWrapper } from '../../lib/textProcessor';

export const dynamic = 'force-dynamic';
export const VALID_API_KEYS = [
  process.env.NEXT_PUBLIC_API_KEY_MONTHLY_USERS,
  process.env.NEXT_PUBLIC_API_KEY_DAILY_USERS,
  process.env.NEXT_PUBLIC_API_KEY_COUNTRY_AVG
];
export let jsondata: any;

const totalKeys = VALID_API_KEYS.length;
const missingIndices = VALID_API_KEYS
  .map((key, index) => !key || key.trim() === '' ? index : -1)
  .filter(index => index !== -1); 

const retrievedCount = totalKeys - missingIndices.length;

if (missingIndices.length > 0) {
    logger.warn(`[${retrievedCount}/${totalKeys}] retrieved, [${missingIndices.length}/${totalKeys}] not found at indices: [${missingIndices.join(', ')}]`);
} else {
    logger.info(`[${retrievedCount}/${totalKeys}] retrieved: All API keys loaded successfully`);
}

const [monthlyUsers, dailyUsers, avgUserPerCountry] = VALID_API_KEYS;

const rateLimitMap = new Map<string, Date[]>();

export async function GET(request: NextRequest) {
  try {
    const Bearer = request.headers.get('authorization');
    const userSignature = request.headers.get('X-User-Signature');
    logger.info(`Authorization: ${Bearer? true : false}, User Signature: ${userSignature? true : false}`);
    if (!Bearer) {
      logger.error('Missing authorization header');
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    if (!userSignature){
      logger.error('Missing user signature header');
      return NextResponse.json(
        { error: "User signature header required" },
        { status: 401 }
      );
    }

    // Extract token from "Bearer <token>" format
    const token = Bearer.startsWith('Bearer ') 
      ? Bearer.slice(7) 
      : Bearer;

    // Check rate limit
    const rateLimitResult = checkRateLimit(userSignature);
    logger.info(`Rate limit status: ${rateLimitResult.allowed}, remaining: ${rateLimitResult.remaining}, resetTime: ${rateLimitResult.resetTime}`);
    
    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded. User: ${userSignature}`);
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }

    return analyzeAuth(token, rateLimitResult);
    
  } catch (error: any) {
    logger.error('API Error:', error);
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
    logger.error(`Invalid API key: ${token in VALID_API_KEYS? true : false}  (${token})`);
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  } logger.info(`Access type: ${accessType}`);

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

async function runData(token: string, accessType: string) {
   jsondata = {};

  switch(accessType) {
    case 'monthly':
      jsondata = { 
        message: "Monthly user data", 
        users: 1500,
        growth: "+12% from last month",
        period: "January 2024"
      };
      
      return await translateJSONWrapper(jsondata, 'en');
      // the translation is disponible in log: check textProcessor.ts Ln 37
    case 'daily':
      jsondata = { 
        message: "Daily user data", 
        users: 50,
        activeSessions: 127,
        date: new Date().toISOString().split('T')[0]
      };
      return await translateJSONWrapper(jsondata, 'en');

    case 'country_avg':
      jsondata = { 
        message: "Average users per country", 
        average: 75,
        topCountries: [
          { country: "United States", users: 320 },
          { country: "Brazil", users: 285 },
          { country: "Philippines", users: 198 }
        ]
      };
      return await translateJSONWrapper(jsondata, 'en');
    default:
      logger.error(`Invalid access type: ${accessType}`);
      return { error: "Invalid access type" };
  }
}

// make sure to use signature key to sign the API request and make the rate limit not global
function checkRateLimit(signature: string): { allowed: boolean; remaining: number; resetTime: Date } {
  const rateLimitConfig = getRateLimitConfig();
  const now = new Date();
  const windowStart = new Date(now.getTime() - rateLimitConfig.windowMs);
  
  const timestamps = rateLimitMap.get(signature) || [];
  const recentRequests = timestamps.filter(time => time > windowStart);
  const allowed = recentRequests.length < rateLimitConfig.limit;
  
  if (allowed) {
    recentRequests.push(now);
    rateLimitMap.set(signature, recentRequests);
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
    logger.error('RATE_LIMIT not set, using default limit of 100 requests per minute');
    return { limit: 100, windowMs: 60000 };
  }
  
  const parsedLimit = parseInt(envLimit, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0) {
    logger.error(`Invalid RATE_LIMIT: "${envLimit}", using default`);
    return { limit: 100, windowMs: 60000 };
  }
  
  return { limit: parsedLimit, windowMs: 60000 };
}

function cleanupOldEntries() {
  const now = new Date();
  const cleanupThreshold = new Date(now.getTime() - 2 * 60000);
  
  for (const [signature, timestamps] of rateLimitMap.entries()) {
    const recentTimestamps = timestamps.filter(time => time > cleanupThreshold);
    if (recentTimestamps.length === 0) {
      rateLimitMap.delete(signature);
    } else {
      rateLimitMap.set(signature, recentTimestamps);
    }
  }
}
