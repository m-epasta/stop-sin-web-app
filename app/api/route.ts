import { NextRequest, NextResponse } from 'next/server';
import { VALID_API_KEYS } from "../stats/page";

// Rate limit storage (in production, use Redis instead)
const rateLimitMap = new Map<string, Date[]>();

const actual_API_keys: string[] = VALID_API_KEYS;
const [monthlyUsers, dailyUsers, avgUserPerCountry] = actual_API_keys.length === 3
? actual_API_keys
: ['', '', ''];

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    try {
        if (authHeader){
            // Check rate limit before processing the request
            const rateLimitResult = checkRateLimit(authHeader);
            
            if (!rateLimitResult.allowed) {
                return NextResponse.json(
                    { 
                        error: "Rate limit exceeded",
                        remaining: rateLimitResult.remaining,
                        resetTime: rateLimitResult.resetTime
                    },
                    { 
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': getRateLimitConfig().limit.toString(),
                            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                            'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
                        }
                    }
                );
            }
            
            return analyzeAuth(authHeader, rateLimitResult);
        } else {
            return NextResponse.json(
                { error: "Failed to retrieve authorization header" },
                { status: 401 }
            );
        }
    } catch(error: any) {
        return NextResponse.json(
            { error: `Error: ${error?.message || 'Unknown error'}` },
            { status: error?.status || 500 }
        );
    }
}

function analyzeAuth(authHeader: string, rateLimitResult: { allowed: boolean; remaining: number; resetTime: Date }) {
    try {
        if (authHeader === monthlyUsers || authHeader === dailyUsers || authHeader === avgUserPerCountry){
            let accessType = '';

            if (authHeader === monthlyUsers){
                accessType = 'monthly';
            } else if (authHeader === dailyUsers){
                accessType = 'daily';
            } else if (authHeader === avgUserPerCountry){
                accessType = 'country_avg';
            }
            
            const data = runData(authHeader, accessType);

            const responseData: any = { 
                success: "Authorization successful",
                accessType: accessType,
                data: data
            };

            // Add rate limit info to successful response
            responseData.rateLimit = {
                remaining: rateLimitResult.remaining,
                resetTime: rateLimitResult.resetTime
            };

            return NextResponse.json(
                responseData,
                { 
                    status: 200,
                    headers: {
                        'X-RateLimit-Limit': getRateLimitConfig().limit.toString(),
                        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
                    }
                } 
            );
        } else {
            return NextResponse.json(
                { error: "Unauthorized: Invalid API key" }, 
                { status: 401 }
            );
        }
    } catch(error: any) {
        return NextResponse.json(
            { error: `Error: ${error?.message || 'Unknown error'}` },
            { status: error?.status || 500 }
        );
    }
}

function runData(authHeader: string, accessType: string) {
    switch(accessType) {
        case 'monthly':
            return { message: "Monthly user data", users: 1500 }; // complete when database available
        case 'daily':
            return { message: "Daily user data", users: 50 }; // complete when database available
        case 'country_avg':
            return { message: "Average users per country", avg: 75 }; // complete when database available
        default:
            return { message: "Error while retrieving data" }; 
}
}

async function DELETE(request: NextRequest) {
    if (!process.env.ADMIN_TOKEN){
        return NextResponse.json(
            {error: 'unable to load data'},
            { status: 404}
        )
    }
    // complete it later
}

// Rate limiting functions (copied from rateLimit.ts)
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
        console.warn('RATE_LIMIT not set.');
        return { limit: 0, windowMs: 60000 };
    }
    
    const parsedLimit = parseInt(envLimit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        console.warn(`Invalid RATE_LIMIT: "${envLimit}"`);
        return { limit: 0, windowMs: 60000 };
    }
    
    return { limit: parsedLimit, windowMs: 60000 };
}

function cleanupOldEntries() {
    const now = new Date();
    const cleanupThreshold = new Date(now.getTime() - 2 * 60000); // 2 minutes ago
    
    for (const [apiKey, timestamps] of rateLimitMap.entries()) {
        const recentTimestamps = timestamps.filter(time => time > cleanupThreshold);
        if (recentTimestamps.length === 0) {
            rateLimitMap.delete(apiKey);
        } else {
            rateLimitMap.set(apiKey, recentTimestamps);
        }
    }
}