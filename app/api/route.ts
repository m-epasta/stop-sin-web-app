import { NextRequest, NextResponse } from 'next/server';
import { StatsPage, VALID_API_KEYS } from "../stats/page";
import { makeErroringSearchParamsForUseCache } from 'next/dist/server/request/search-params';

const actual_API_keys: string[] = VALID_API_KEYS;
const [monthlyUsers, dailyUsers, avgUserPerCountry] = actual_API_keys



export async function GET(request: NextRequest) {
    var authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    try {
        if (authHeader){
            analyzeAuth(request);
        } else {
            return NextResponse.json(
                { error: "failed to retrieve headers' authentification" },
                { status: 404 }
            );
        }
    } catch(error: any) {
        return NextResponse.json(
            { error: `error ${error?.status}` },
            { status: error?.status || undefined }
        )
    }
    
}

function analyzeAuth(request: NextRequest) {
    var authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const localAPIkeys: string[] = actual_API_keys;
    let isAuthValided: boolean | null = false;
    try {
        switch (true) {
            case (authHeader === monthlyUsers):
                // retrieve monthly users
                isAuthValided = true;
                break;
            case (authHeader === dailyUsers):
                // retrieve daily users
                isAuthValided = true;
                break;
            case (authHeader === avgUserPerCountry):
                // retrieve avgUserPerCountry
                isAuthValided = true;
                break;
            default:
                isAuthValided = false;
    }
    } catch(error: any) {
        return NextResponse.json(
            { error: `error: ${error?.message || error}, ${error?.status || 500}` },
            { status: error.status || 500 }
        )
    } finally {
        if (!isAuthValided) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid API key" }/*error there*/, 
                { status: 401 }
            )
        }

        return NextResponse.json(
            { succes: "Authorization succesful" },
            { status: 200 }
        )

    }
}
