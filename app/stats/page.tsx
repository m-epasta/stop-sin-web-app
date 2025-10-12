"use client";

import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
import { getUserSignature } from "../lib/getDesktopName";
import { createTranslatedReportAction } from '../actions/translate';
import "./stats.css";

export default function StatsPage() {
    const [apiKey, setApiKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [placeholder, setPlaceholder] = useState("Enter your API key");
    const [error, setError] = useState<string | null>(null);
    const [apiData, setApiData] = useState<any>(null);
    const [sentenceFormat, setSentenceFormat] = useState<string>("");

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
    }, [apiKey, VALID_API_KEYS]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
        setError(null);
        setApiData(null);
        setSentenceFormat("");
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
            setSentenceFormat("");
            
            const userSignature = getUserSignature();

            const response = await fetch('/api/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                    'X-User-Signature': userSignature
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            console.log('📦 Raw API data:', data);
            
            // Enhanced data sanitization with proper fallbacks
            const sanitizedData = {
                ...data,
                // Sanitize main data properties
                data: {
                    users: data.data?.users ?? 0,
                    average: data.data?.average ?? 0,
                    activeSessions: data.data?.activeSessions ?? 0,
                    growth: data.data?.growth ?? '0%',
                    period: data.data?.period ?? 'Not specified',
                    date: data.data?.date ?? new Date().toISOString().split('T')[0],
                    message: data.data?.message ?? '',
                    // Safely handle topCountries array
                    topCountries: (data.data?.topCountries ?? []).map((country: any) => ({
                        country: country.country ?? 'Unknown',
                        users: country.users ?? 0
                    }))
                },
                // Sanitize rateLimit to prevent NaN and display issues
                rateLimit: {
                    remaining: Math.max(0, data.rateLimit?.remaining ?? 9),
                    limit: Math.max(1, data.rateLimit?.limit ?? 10), // Ensure at least 1
                    resetTime: data.rateLimit?.resetTime ?? new Date(Date.now() + 3600000).toISOString() // 1 hour from now
                },
                // Sanitize other common fields
                success: data.success ?? true,
                message: data.message ?? '',
                accessType: data.accessType ?? 'general'
            };
            
            console.log('🧹 Sanitized API data:', sanitizedData);
            
            // Store the sanitized data instead of raw data
            setApiData(sanitizedData);
            
            // Convert to sentence format using sanitized data
            const sentences = await createTranslatedReportAction(sanitizedData, 'en', 'natural');
            setSentenceFormat(sentences);
            
        } catch (error: any) {
            console.error('API Error:', error);
            setError(error.message);
            
            // Set fallback data on error for better UX
            const fallbackData = {
                success: false,
                message: 'Using cached or fallback data',
                data: {
                    users: 0,
                    average: 0,
                    activeSessions: 0,
                    growth: '0%',
                    period: 'Fallback Data',
                    date: new Date().toISOString().split('T')[0],
                    topCountries: []
                },
                rateLimit: {
                    remaining: 0,
                    limit: 1000,
                    resetTime: new Date().toISOString()
                }
            };
            setApiData(fallbackData);
        } finally {
            setIsLoading(false);
        }
    };

    // Safe date parsing function
    const safeDateParse = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
        } catch {
            return 'Invalid Date';
        }
    };
    const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
        'US': '🇺🇸',
        'UK': '🇬🇧',
        'CA': '🇨🇦',
        'FR': '🇫🇷',
        'DE': '🇩🇪',
        'JP': '🇯🇵',
        'AU': '🇦🇺',
        'BR': '🇧🇷',
        'IN': '🇮🇳',
        'CN': '🇨🇳'
    };
    return flags[country] || '🌐';
    };

    const getUsageColor = (remaining: number, limit: number) => {
        // Add safety checks for invalid values
        if (!limit || limit === 0 || isNaN(limit) || isNaN(remaining)) {
            return '#6b7280'; // gray for undefined/invalid
        }
        
        const percentage = (remaining / limit) * 100;
        if (percentage > 30) return '#10b981'; // green
        if (percentage > 10) return '#f59e0b'; // amber
        return '#ef4444'; // red
    };
    return (
    <div className="app-container">
        {/* Enhanced Header with Theme Integration */}
        <header className="theme-header">
        <div className="header-content">
            <div className="logo-container">
            <div className="logo-icon">📊</div>
            <div className="logo-text">
                <h1 id="title">AntiSin Analytics</h1>
                <p className="subtitle">Comprehensive data insights for your spiritual journey</p>
            </div>
            </div>
            <div className="theme-badge">
            <span className="badge-icon">✨</span>
            Premium Insights
            </div>
        </div>
        <div className="header-graphic">
            <div className="graphic-circle circle-1"></div>
            <div className="graphic-circle circle-2"></div>
            <div className="graphic-circle circle-3"></div>
        </div>
        </header>

        {/* Feature Cards with Enhanced Theme */}
        <section className="features-section">
        <div className="section-header centered">
            <h2 className="section-title">Powerful Analytics Features</h2>
            <p className="section-subtitle">Transform your data into actionable spiritual insights</p>
        </div>
        
        <div className="features-grid">
            <div className="feature-card theme-card">
            <div className="feature-icon">
                <div className="icon-wrapper">
                <span>📊</span>
                <div className="icon-glow"></div>
                </div>
            </div>
            <div className="feature-content">
                <h3>Daily Spiritual Activity</h3>
                <p>Monitor your daily progress with detailed engagement metrics and personalized insights.</p>
                <div className="feature-badge">Real-time</div>
            </div>
            </div>

            <div className="feature-card theme-card">
            <div className="feature-icon">
                <div className="icon-wrapper">
                <span>📈</span>
                <div className="icon-glow"></div>
                </div>
            </div>
            <div className="feature-content">
                <h3>Progress Analytics</h3>
                <p>Track your spiritual growth over time with comprehensive reports and trend analysis.</p>
                <div className="feature-badge">Trending</div>
            </div>
            </div>

            <div className="feature-card theme-card">
            <div className="feature-icon">
                <div className="icon-wrapper">
                <span>👁️</span>
                <div className="icon-glow"></div>
                </div>
            </div>
            <div className="feature-content">
                <h3>Full Transparency</h3>
                <p>Complete visibility into your data with 100% transparency and privacy-focused analytics.</p>
                <div className="feature-badge">Secure</div>
            </div>
            </div>
        </div>
        </section>

        {/* API Access Section with Enhanced Theme */}
        <section className="api-section theme-section">
        <div className="section-header">
            <h2 className="section-title">Access Your Analytics</h2>
            <p className="section-subtitle">Choose your data access level with secure API keys</p>
        </div>
        
        <div className="api-cards-grid">
            <div className="api-card theme-card">
            <div className="api-card-header">
                <div className="api-icon">
                <span>👤</span>
                </div>
                <div className="api-badge">Basic</div>
            </div>
            <h3>Monthly Users</h3>
            <p>Access monthly user analytics and growth metrics</p>
            <div className="api-key-display">
                <code className="theme-code">{process.env.NEXT_PUBLIC_API_KEY_MONTHLY_USERS}</code>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(process.env.NEXT_PUBLIC_API_KEY_MONTHLY_USERS || '')}>
                📋
                </button>
            </div>
            </div>

            <div className="api-card theme-card">
            <div className="api-card-header">
                <div className="api-icon">
                <span>📅</span>
                </div>
                <div className="api-badge">Pro</div>
            </div>
            <h3>Daily Users</h3>
            <p>Detailed daily activity and engagement metrics</p>
            <div className="api-key-display">
                <code className="theme-code">{process.env.NEXT_PUBLIC_API_KEY_DAILY_USERS}</code>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(process.env.NEXT_PUBLIC_API_KEY_DAILY_USERS || '')}>
                📋
                </button>
            </div>
            </div>

            <div className="api-card theme-card">
            <div className="api-card-header">
                <div className="api-icon">
                <span>🌍</span>
                </div>
                <div className="api-badge">Enterprise</div>
            </div>
            <h3>Global Analytics</h3>
            <p>Worldwide metrics and geographic distribution</p>
            <div className="api-key-display">
                <code className="theme-code">{process.env.NEXT_PUBLIC_API_KEY_COUNTRY_AVG}</code>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText(process.env.NEXT_PUBLIC_API_KEY_COUNTRY_AVG || '')}>
                📋
                </button>
            </div>
            </div>
        </div>

        {/* Enhanced Input Section */}
        <div className="input-section theme-card">
            <div className="input-header">
            <h3>Enter Your API Key</h3>
            <div className="validation-status">
                {validation.isValid === true && (
                <span className="status-valid">✓ Key Validated</span>
                )}
                {validation.isValid === false && (
                <span className="status-invalid">✗ Invalid Key</span>
                )}
            </div>
            </div>
            
            <div className="input-container">
            <div className="input-wrapper">
                <input 
                type="text" 
                placeholder="Paste your API key here..."
                className={`theme-input ${validation.isValid === false ? 'invalid' : ''} ${validation.isValid === true ? 'valid' : ''}`}
                value={apiKey}
                onChange={handleInputChange}
                disabled={isLoading}
                />
                {isLoading && (
                <div className="input-loading">
                    <div className="loading-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    </div>
                </div>
                )}
            </div>
            
            <button 
                className={`theme-button primary ${isLoading ? 'loading' : ''}`}
                onClick={submitButton}
                disabled={isLoading || validation.isValid !== true}
            >
                {isLoading ? (
                <>
                    <span className="btn-spinner"></span>
                    Analyzing Data...
                </>
                ) : (
                <>
                    <span className="btn-icon">🔍</span>
                    Get Insights
                </>
                )}
            </button>
            </div>
            
            {validation.message && (
            <div className={`validation-message ${validation.isValid === true ? 'valid' : validation.isValid === false ? 'invalid' : 'neutral'}`}>
                {validation.message}
            </div>
            )}
        </div>
        </section>

    {/* Enhanced Data Visualization */}
    {apiData && (
    <section className="dashboard-section">
        <div className="section-header">
        <h2 className="section-title">Analytics Dashboard</h2>
        <div className="dashboard-actions">
            <button className="theme-button secondary">
            <span>📥</span>
            Export Report
            </button>
            <button className="theme-button secondary">
            <span>🔄</span>
            Refresh Data
            </button>
        </div>
        </div>

        {/* Executive Summary */}
        {sentenceFormat && (
        <div className="executive-summary theme-card">
            <div className="summary-header">
            <div className="summary-icon">📋</div>
            <div>
                <h3>Executive Summary</h3>
                <p>Key insights from your analytics data</p>
            </div>
            </div>
            <div className="summary-content">
            <div className="summary-text">
                {sentenceFormat.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
                ))}
            </div>
            </div>
        </div>
        )}

        {/* Key Metrics Dashboard */}
        <div className="metrics-dashboard">
        {apiData.data && (
            <>
            {/* Main KPI Cards */}
            <div className="kpi-grid">
                {apiData.data.users !== undefined && (
                <div className="kpi-card theme-card highlight">
                    <div className="kpi-header">
                    <div className="kpi-icon">👥</div>
                    <div className="kpi-trend positive">+12%</div>
                    </div>
                    <div className="kpi-content">
                    <div className="kpi-value">
                        {/* Safe number display */}
                        {apiData.data.users?.toLocaleString() ?? '0'}
                    </div>
                    <div className="kpi-label">Total Users</div>
                    <div className="kpi-description">Active spiritual community members</div>
                    </div>
                </div>
                )}
                
                {apiData.data.average !== undefined && (
                <div className="kpi-card theme-card">
                    <div className="kpi-header">
                    <div className="kpi-icon">📊</div>
                    <div className="kpi-trend neutral">±0%</div>
                    </div>
                    <div className="kpi-content">
                    <div className="kpi-value">
                        {/* Safe number display */}
                        {apiData.data.average ?? '0'}
                    </div>
                    <div className="kpi-label">Daily Average</div>
                    <div className="kpi-description">Average users per day</div>
                    </div>
                </div>
                )}
                
                {apiData.data.activeSessions !== undefined && (
                <div className="kpi-card theme-card">
                    <div className="kpi-header">
                    <div className="kpi-icon">🔄</div>
                    <div className="kpi-trend positive">+5%</div>
                    </div>
                    <div className="kpi-content">
                    <div className="kpi-value">
                        {/* Safe number display */}
                        {apiData.data.activeSessions?.toLocaleString() ?? '0'}
                    </div>
                    <div className="kpi-label">Active Sessions</div>
                    <div className="kpi-description">Current live interactions</div>
                    </div>
                </div>
                )}
                
                {apiData.data.growth && (
                <div className="kpi-card theme-card">
                    <div className="kpi-header">
                    <div className="kpi-icon">📈</div>
                    <div className="kpi-trend positive">
                        {/* Safe growth display */}
                        +{apiData.data.growth ?? '0'}
                    </div>
                    </div>
                    <div className="kpi-content">
                    <div className="kpi-value">
                        {apiData.data.growth ?? '0'}
                    </div>
                    <div className="kpi-label">Growth Rate</div>
                    <div className="kpi-description">Monthly growth percentage</div>
                    </div>
                </div>
                )}
            </div>

            {/* Geographic Distribution */}
            {apiData.data.topCountries && apiData.data.topCountries.length > 0 && (
                <div className="geo-section theme-card">
                <div className="geo-header">
                    <div className="geo-icon">🌍</div>
                    <div>
                    <h3>Global Distribution</h3>
                    <p>User distribution across countries</p>
                    </div>
                </div>
                <div className="countries-grid">
                    {apiData.data.topCountries.map((country: any, index: number) => (
                    <div key={index} className="country-item">
                        <div className="country-rank">#{index + 1}</div>
                        <div className="country-flag">
                        {getCountryFlag(country.country)}
                        </div>
                        <div className="country-info">
                        <div className="country-name">{country.country}</div>
                        <div className="country-users">
                            {/* Safe country users display */}
                            {(country.users?.toLocaleString() ?? '0')} users
                        </div>
                        </div>
                        <div className="country-percentage">
                        {/* Safe percentage calculation */}
                        {apiData.data.users && country.users ? 
                            Math.round((country.users / apiData.data.users) * 100) 
                            : 0
                        }%
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Additional Insights */}
            <div className="insights-grid">
                {apiData.data.period && (
                <div className="insight-card theme-card">
                    <div className="insight-icon">📅</div>
                    <div className="insight-content">
                    <div className="insight-label">Analysis Period</div>
                    <div className="insight-value">{apiData.data.period}</div>
                    </div>
                </div>
                )}
                
                {apiData.data.date && (
                <div className="insight-card theme-card">
                    <div className="insight-icon">🕒</div>
                    <div className="insight-content">
                    <div className="insight-label">Report Date</div>
                    <div className="insight-value">{apiData.data.date}</div>
                    </div>
                </div>
                )}
                
                {apiData.accessType && (
                <div className="insight-card theme-card">
                    <div className="insight-icon">🔍</div>
                    <div className="insight-content">
                    <div className="insight-label">Data Scope</div>
                    <div className="insight-value">
                        {apiData.accessType.replace('_', ' ').toUpperCase()}
                    </div>
                    </div>
                </div>
                )}
            </div>
            </>
        )}

    {/* API Usage Widget */}
    {apiData.rateLimit && (
        <div className="usage-widget theme-card">
            <div className="widget-header">
                <div className="widget-icon">⚡</div>
                <div>
                    <h3>API Usage</h3>
                    <p>Your current rate limit status</p>
                </div>
            </div>
            
            <div className="usage-content">
                <div className="usage-meter">
                    <div className="meter-header">
                        <span>Requests</span>
                        <span>
                            {/* Safe rate limit display with better formatting */}
                            {apiData.rateLimit.remaining ?? 'N/A'} / {apiData.rateLimit.limit ? apiData.rateLimit.limit.toLocaleString() : 'N/A'} remaining
                        </span>
                    </div>
                    <div className="meter-track">
                        <div 
                            className="meter-progress"
                            style={{
                                // Safe width calculation
                                width: `${apiData.rateLimit.limit && apiData.rateLimit.limit > 0 ? 
                                    Math.max(0, Math.min(100, ((apiData.rateLimit.limit - (apiData.rateLimit.remaining ?? 0)) / apiData.rateLimit.limit) * 100)) 
                                    : 0
                                }%`,
                                backgroundColor: getUsageColor(apiData.rateLimit.remaining ?? 0, apiData.rateLimit.limit ?? 0)
                            }}
                        ></div>
                    </div>
                </div>
                
                <div className="usage-details">
                    <div className="usage-item">
                        <span className="usage-label">Limit:</span>
                        <span className="usage-value">
                            {apiData.rateLimit.limit ? apiData.rateLimit.limit.toLocaleString() : 'Unlimited'}
                        </span>
                    </div>
                    <div className="usage-item">
                        <span className="usage-label">Used:</span>
                        <span className="usage-value">
                            {/* Safe calculation - prevent negative numbers */}
                            {Math.max(0, (apiData.rateLimit.limit ?? 0) - (apiData.rateLimit.remaining ?? 0)).toLocaleString()}
                        </span>
                    </div>
                    <div className="usage-item">
                        <span className="usage-label">Reset:</span>
                        <span className="usage-value">
                            {safeDateParse(apiData.rateLimit.resetTime)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )}
        </div>

        {/* Developer Tools Section */}
        <div className="developer-section">
        <div className="section-header">
            <h3>Developer Tools</h3>
            <p>Advanced options for technical users</p>
        </div>
        
        <div className="dev-tools theme-card">
            <div className="tools-header">
            <div className="tools-icon">🔧</div>
            <div className="tools-content">
                <h4>Raw API Response</h4>
                <p>Access the complete unprocessed data for debugging and integration</p>
            </div>
            <button 
                className="theme-button secondary small"
                onClick={() => {
                const rawDataElement = document.querySelector('.raw-data-content');
                if (rawDataElement) {
                    rawDataElement.classList.toggle('expanded');
                }
                }}
            >
                <span>👁️</span>
                Toggle View
            </button>
            </div>
            
            <div className="raw-data-content">
            <pre className="theme-code-block">{JSON.stringify(apiData, null, 2)}</pre>
            </div>
        </div>
        </div>
    </section>
    )}

        {/* Enhanced Error State */}
        {error && (
        <div className="error-state theme-card">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
            <h3>Unable to Load Analytics</h3>
            <p>{error}</p>
            </div>
            <button className="theme-button secondary" onClick={() => setError(null)}>
            <span>🔄</span>
            Try Again
            </button>
        </div>
        )}

        {/* Footer */}
        <footer className="theme-footer">
        <div className="footer-content">
            <div className="footer-brand">
            <div className="footer-logo">📊</div>
            <div className="footer-text">
                <strong>AntiSin Analytics</strong>
                <span>Spiritual insights through data</span>
            </div>
            </div>
            <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">API Reference</a>
            <a href="#" className="footer-link">Support</a>
            </div>
        </div>
        </footer>
    </div>
    );
};
