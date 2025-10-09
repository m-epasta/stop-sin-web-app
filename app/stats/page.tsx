"use client";

import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
// Remove this import if it's importing hardcoded values
// import { VALID_API_KEYS } from '../api/stats/route'; 
import { getUserSignature } from "../lib/getDesktopName";
import "./stats.css";

export const StatsPage = () => {
    const [apiKey, setApiKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [placeholder, setPlaceholder] = useState("Enter your API key");
    const [error, setError] = useState<string | null>(null);
    const [apiData, setApiData] = useState<any>(null);

    // Memoized API keys from environment variables
    const VALID_API_KEYS = useMemo(() => [
        process.env.NEXT_PUBLIC_API_KEY_MONTHLY_USERS,
        process.env.NEXT_PUBLIC_API_KEY_DAILY_USERS,
        process.env.NEXT_PUBLIC_API_KEY_COUNTRY_AVG
    ].filter(Boolean), []);

    const validation = useMemo(() => {
        if (apiKey.trim() === "") {
            return { isValid: null, message: "Enter your API key." };
        } else if (VALID_API_KEYS.includes(apiKey)) {
            return { isValid: true, message: "✓ Valid API key" };
        } else {
            return { isValid: false, message: "✗ Invalid API key" };
        }
    }, [apiKey, VALID_API_KEYS]); // Add VALID_API_KEYS to dependencies

    // Rest of your component remains the same...
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
        setError(null);
        setApiData(null);
    };


    const submitButton = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!apiKey.trim() || validation.isValid !== true) {
            alert("Please enter and validate your API key first.");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setApiData(null);
            
            const userSignature = getUserSignature(); // Get the unique signature

            const response = await fetch('/api/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                    'X-User-Signature': userSignature // Add signature to headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            setApiData(data);
            
        } catch (error: any) {
            console.error('API Error:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1 id="title">AntiSin Analytics</h1>
                <p className="subtitle">Comprehensive data insights for your spiritual journey</p>
            </header>
            
            <div className="modern-grid">
                <div className="modern-card">
                    <div className="card-icon">📊</div>
                    <h3>Daily Activity</h3>
                    <p>Monitor your daily spiritual progress and engagement metrics with detailed analytics and insights.</p>
                </div>
                <div className="modern-card">
                    <div className="card-icon">📈</div>
                    <h3>Progress Analytics</h3>
                    <p>Track your growth over time with comprehensive progress reports and trend analysis.</p>
                </div>
                <div className="modern-card">
                    <div className="card-icon">👥</div>
                    <h3>Full Transparency</h3>
                    <p>Complete visibility into your data with 100% transparency and privacy-focused analytics.</p>
                </div>
            </div>
            
            <div className="api-section">
                <h2 className="section-title">API Access</h2>
                <div className="modern-grid">
                    <div className="modern-card">
                        <div className="card-icon">👤</div>
                        <h3>Monthly Users</h3>
                        <p>Key: <code>{process.env.NEXT_PUBLIC_API_KEY_MONTHLY_USERS}</code></p>
                    </div>
                    <div className="modern-card">
                        <div className="card-icon">📅</div>
                        <h3>Daily Users</h3>
                        <p>Key: <code>{process.env.NEXT_PUBLIC_API_KEY_DAILY_USERS}</code></p>
                    </div>
                    <div className="modern-card">
                        <div className="card-icon">🌍</div>
                        <h3>Global Analytics</h3>
                        <p>Key: <code>{process.env.NEXT_PUBLIC_API_KEY_COUNTRY_AVG}</code></p>
                    </div>
                </div>
                
                <div className="modern-input-container">
                    <div className="input-group">
                        <input 
                            type="text" 
                            placeholder={placeholder}
                            className={`API-input ${
                                validation.isValid === false ? 'invalid' : ''} ${
                                validation.isValid === true ? 'valid' : ''} ${
                                isLoading ? 'loading' : ''}`
                            }
                            value={apiKey}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                        <button 
                            className="API-button" 
                            onClick={submitButton}
                            disabled={isLoading || validation.isValid !== true}
                        >
                            {isLoading ? "Submitting..." : "Get Insights"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="error-message">
                    Error: {error}
                </div>
            )}

            {/* API Data Display */}
            {apiData && (
                <div className="results-section">
                    <h2 className="section-title">Analytics Results</h2>
                    <div className="data-display">
                        <pre>{JSON.stringify(apiData, null, 2)}</pre>
                        {apiData.rateLimit && (
                            <div className="rate-limit-info">
                                <p>Remaining requests: {apiData.rateLimit.remaining}</p>
                                <p>Reset time: {new Date(apiData.rateLimit.resetTime).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsPage;
