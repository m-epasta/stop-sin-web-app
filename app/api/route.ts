import { NextRequest, NextResponse } from 'next/server';
import { StatsPage, VALID_API_KEYS } from "../stats/page";

const actual_API_keys: string[] = VALID_API_KEYS;


export async function GET(request: NextRequest) {
    var authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    try {
        if (authHeader){
            
        }
    }
    
}

function analyzeAuth(request: NextRequest) {
    var authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
}
