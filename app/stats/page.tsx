"use client";

import React, { MouseEvent, useState, useEffect, useMemo, ChangeEvent } from "react";
import "./stats.css";

export const VALID_API_KEYS = [
    "aks_7f8e3b2c1d9a4f6e5c8b0a9d7e6f5c4b",
    "aks_a1b2c3d4e5f67890abcdef1234567890",
    "aks_9876543210fedcba0123456789abcdef"
];
export const StatsPage = () => {
    const [apiKey, setApiKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [placeholder, setPlaceholder] = useState("Enter your API key");



    // Memoized validation
    const validation = useMemo(() => {
        if (apiKey.trim() === "") {
            return { isValid: null, message: "Enter your API key." };
        } else if (VALID_API_KEYS.includes(apiKey)) {
            return { isValid: true, message: "✓ Valid API key" };
        } else {
            return { isValid: false, message: "✗ Invalid API key" };
        }
    }, [apiKey]);

    // Update placeholder based on validation
    useEffect(() => {
        setPlaceholder(validation.message);
    }, [validation.message]);

    // Smooth scroll for anchor links (First useEffect)
    useEffect(() => {
        const handleSmoothScroll = (e: Event) => {
            const target = e.target as HTMLAnchorElement;
            if (target.hash) {
                e.preventDefault();
                const targetElement = document.querySelector(target.hash);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        };

        // Add event listeners to all anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', handleSmoothScroll);
        });

        return () => {
            anchorLinks.forEach(link => {
                link.removeEventListener('click', handleSmoothScroll);
            });
        };
    }, []);

    // Success glow animation (Second useEffect - separate from the first one)
    useEffect(() => {
        if (validation.isValid === true) {
            const input = document.querySelector('.API-input');
            input?.classList.add('success-glow');
            const timer = setTimeout(() => {
                input?.classList.remove('success-glow');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [validation.isValid]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
    };

    const submitButton = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // Block API request if validation fails
        if (validation.isValid === false) {
            alert("Invalid API key. Please check your key and try again.");
            return;
        }

        if (!apiKey.trim()) {
            alert("Please enter a valid API key.");
            return;
        }

        if (validation.isValid !== true) {
            alert("Please validate your API key first.");
            return;
        }

        console.log(`API key entered: ${apiKey}`);
        console.log('Submitting API key...', apiKey);

        try {
            setIsLoading(true);
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Success:', data);
                alert('API key validated successfully!');
            } else {
                console.error('Server error:', response.status);
                alert('Server error, please try again.');
            }
        } catch (error) {
            console.error('Error', error);
            alert('Network error, please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="appContainer">
            <header>
                <h1 id="title">✝Welcome to AntiSin - The first app to help you be a better Christian on Internet✝</h1>
            </header>
            <h2 className="subtitle">Our official data report!</h2>
        
            <div id="desc-div">
                <ul id="desc-list">
                    <li id="desc-item1" className="feature-card">
                        <h3>Daily activity</h3>
                        <p></p>
                    </li>
                    <li id="desc-item2" className="feature-card">
                        <h3>📈 Progress Analytics</h3>
                        <p></p>
                    </li>
                    <li id="desc-item3" className="feature-card">
                        <h3>👥 100% transparency</h3>
                        <p></p>
                    </li>
                </ul>
            </div>
            <h2 className="subtitle"> Our API's keys to retrieve specific data!</h2>
            <div id="container-specified-api-keys">
                <ul id="desc-list">
                    <li id="desc-item1" className="feature-card">
                        <h3>Monthly users</h3>
                        <p>key: coming soon</p>
                    </li>
                    <li id="desc-item2" className="feature-card">
                        <h3>Daily Users</h3>
                        <p>key: coming soon</p>
                    </li>
                    <li id="desc-item3" className="feature-card">
                        <h3>average user per country</h3>
                        <p>key: coming soon</p>
                    </li>
                </ul>
            </div>
            <div className="API-input-container">
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
                    disabled={isLoading || validation.isValid === false}
                >
                    {isLoading ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
};

export default StatsPage;
