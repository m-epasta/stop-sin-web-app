import { NextRequest, NextResponse } from 'next/server';
import { VALID_API_KEYS } from "../stats/page";

const actual_API_keys: string[] = VALID_API_KEYS;
const [monthlyUsers, dailyUsers, avgUserPerCountry] = actual_API_keys.length === 3
? actual_API_keys
: ['', '', ''];

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    try {
        if (authHeader){
            
            return analyzeAuth(authHeader);
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

function analyzeAuth(authHeader: string) {
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

            return NextResponse.json(
                { 
                    success: "Authorization successful",
                    accessType: accessType,
                    data: data
                },
                { status: 200 } 
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
            return { message: "Monthly user data", users: 1500 };
        case 'daily':
            return { message: "Daily user data", users: 50 };
        case 'country_avg':
            return { message: "Average users per country", avg: 75 };
        default:
            return { message: "Error while retrieving data" };
    }
}
