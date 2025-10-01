"use client";

import React, { useEffect } from "react";
import "./main.css";
import { useRouter } from "next/navigation";

const MainApp = () => {
    const router = useRouter();
    
    useEffect(() => {
        // Smooth scroll for anchor links
        const handleSmoothScroll = (e: MouseEvent) => {
            const target = e.target as HTMLAnchorElement;
            if (target.hash) {
                e.preventDefault();
                const scrollTarget = document.querySelector(target.hash);
                if (scrollTarget) {
                    scrollTarget.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        };

        // Add event listeners to all anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', handleSmoothScroll as EventListener);
        });

        return () => {
            anchorLinks.forEach(link => {
                link.removeEventListener('click', handleSmoothScroll as EventListener);
            });
        };
    }, []);

    const redirectToStats = (): void => {
         router.push('/stats');
    };

    return(
        <div className="app-container">
            <header>
                <h1 id="title">✝Welcome to AntiSin - The first app to help you be a better Christian on Internet✝</h1>
                <p className="subtitle">Transform your life on internet with the best assistant for free</p>
            </header>

            <div id="desc-div">
                <ul id="desc-list">
                    <li id="desc-item1" className="feature-card">
                        <h3>📈 Track Your Progress & Patterns</h3>
                        <p>In a digital world where boundaries are blurred, our mission is to provide clarity and protection. We help you cultivate discernment by gently guiding you away from harmful content and toward what is good and uplifting. This is supported by your Daily Awareness Tracking—a feature that allows you to reflect on your digital habits, see your progress, and strengthen your resolve. It&apos;s not just about blocking the wrong path; it&apos;s about actively helping you walk the right one, building a life online that aligns with your values and spiritual well-being.</p>
                        <span className="feature-badge">Digital Discernment</span>
                    </li>
                    <li id="desc-item2" className="feature-card">
                        <h3>📈 Progress Analytics</h3>
                        <p>Your Personal Dashboard is your window into your daily spiritual walk. Every piece of data retrieved is thoughtfully displayed here, not as a simple statistic, but as a mirror reflecting your habits and rhythms. We believe that awareness is the first step toward growth. That&apos;s why our software is designed to be more than just a tracker; it&apos;s a faithful companion. By highlighting your patterns—both your strengths and areas for prayerful focus—it provides a clear, honest foundation for reflection. In partnership with these insights, you are empowered to make mindful, intentional choices that gradually shape your days, deepen your discipline, and ultimately lead you toward a more consistent, purposeful, and faithful life in Christ.</p>
                        <span className="feature-badge">Spiritual Mirror</span>
                    </li>
                    <li id="desc-item3" className="feature-card">
                        <h3>👥 100% transparency</h3>
                        <p>Our data practices are fully transparent and accessible. We are committed to your privacy and do not retrieve any personally identifiable information. The data we collect is strictly aggregated and anonymous, focusing on metrics like daily active users and application performance. This information is used to create public statistics and to provide you with insights to help you achieve your own objectives.</p>
                        <span className="feature-badge">Privacy-First</span>
                    </li>
                </ul>
            </div>

            <div className="app-showcase">
                <div className="app-screenshot">
                    <div className="iphone-12-mockup">
                        <div className="iphone-notch"></div>
                        <div className="iphone-screen">
                            <div className="app-home-screen">
                                <div className="app-logo">
                                    <div className="logo-icon">✝</div>
                                </div>
                                <h2 className="app-title">Anti Sin App</h2>
                                <div className="app-stats">
                                    <div className="stat">
                                        <span className="stat-number">24</span>
                                        <span className="stat-label">Days Clean</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-number">85%</span>
                                        <span className="stat-label">Progress</span>
                                    </div>
                                </div>
                                <button className="app-button">Track Today</button>
                            </div>
                        </div>
                        <div className="iphone-home-bar"></div>
                    </div>
                </div>
                <div className="app-description">
                    <h2>Experience AntiSin on iOS or Android</h2>
                    <p>Anti Sin app is designed to be accessible and readable.It&apos;s used to improve your life and reinforce your faith.</p>
                    <p>With features like daily tracking, data from social media etc... We help you top improve with our unique algorhytms, retrieved data, data reports and even more!</p>
                    <div className="download-buttons">
                        <button className="download-btn">
                            <span className="btn-icon">📱</span>
                            Download on App Store
                        </button>
                        <button className="download-btn secondary">
                            <span className="btn-icon">🤖</span>
                            Get it on Google Play
                        </button>
                    </div>
                </div>
            </div>

            {/* New Detailed Description Section */}
            <div className="detailed-features">
                <h2>Why AntiSin?</h2>
                <div className="features-grid">
                    <div className="feature-detail">
                        <div className="feature-icon">🎯</div>
                        <h3>Goal-Oriented Approach</h3>
                        <p>Set specific, measurable goals for your spiritual growth. Our SMART goal system helps you create achievable targets that keep you motivated and focused on continuous improvement.</p>
                    </div>
                    <div className="feature-detail">
                        <div className="feature-icon">🔔</div>
                        <h3>Smart Reminders</h3>
                        <p>Receive intelligent notifications that help you stay on track without feeling overwhelmed. Our adaptive reminder system learns your patterns and suggests optimal times for reflection.</p>
                    </div>
                    <div className="feature-detail">
                        <div className="feature-icon">📚</div>
                        <h3>Educational Resources</h3>
                        <p>Access a growing library of articles, guided meditations, and expert advice on personal development, mindfulness, and spiritual growth.</p>
                    </div>
                    <div className="feature-detail">
                        <div className="feature-icon">🔒</div>
                        <h3>Complete Privacy</h3>
                        <p>Your journey is personal. We use end-to-end encryption and never share your data with third parties. Your spiritual growth remains confidential and secure.</p>
                    </div>
                </div>
            </div>

            {/* Final CTA Section */}
            <div className="final-cta">
                <h2>Start Your Journey Today</h2>
                <p>Join thousands of users who have transformed their lives through mindful habit tracking. Download now and take the first step towards a more virtuous life.</p>
                <div className="cta-buttons">
                    <button className="cta-btn primary" onClick={redirectToStats}>Learn More</button>
                </div>
            </div>

            <footer>
                <p>© 2024 AntiSin App. Committed to helping you achieve personal growth and spiritual development. Your journey to virtue starts here.</p>
            </footer>
        </div>
    )
}

export default MainApp;