import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/AboutUs.css';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

const featureCards: FeatureCard[] = [
  {
    icon: "fa-map-marked-alt",
    title: "Real-time Tracking",
    description: "Track your shuttle in real-time with live GPS updates and accurate arrival times.",
    delay: 200
  },
  {
    icon: "fa-bell",
    title: "Instant Alerts",
    description: "Get notifications about your ride status, delays, and schedule changes instantly.",
    delay: 400
  },
  {
    icon: "fa-mobile-alt",
    title: "Easy Booking",
    description: "Book your campus shuttle rides with just a few taps on your smartphone.",
    delay: 600
  },
  {
    icon: "fa-shield-alt",
    title: "Safe & Secure",
    description: "Enhanced security features with verified drivers and real-time monitoring.",
    delay: 800
  }
];

const AboutUs: React.FC = () => {
  const [titleRef, titleVisible] = useScrollAnimation<HTMLHeadingElement>({ threshold: 0.3 });
  const [subtitleRef, subtitleVisible] = useScrollAnimation<HTMLParagraphElement>({ threshold: 0.3, delay: 200 });
  const [descRef, descVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.3, delay: 300 });
  const [statsRef, statsVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.3, delay: 400 });
  const [featuresRef, featuresVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.3, delay: 500 });

  return (
    <section id="about" className="section">
      <div className="about-bg-overlay"></div>
      <div className="container">
        <div className="about-header">
          <h2 ref={titleRef} className={`section-title fade-down ${titleVisible ? 'visible' : ''}`}>About Us</h2>
          <div className="title-underline"></div>
          <p ref={subtitleRef} className={`section-subtitle fade-up ${subtitleVisible ? 'visible' : ''}`}>
            Making campus transportation easy and efficient
          </p>
        </div>
        
        <div className="about-content">
          {/* Main Description */}
          <div ref={descRef} className={`about-description-main fade-up ${descVisible ? 'visible' : ''}`}>
            <p>
              The Campus Shuttle Service is a modern web application built to simplify university transportation. 
              Our goal is to create a safer, faster, and more connected travel experience for students. 
              With features like real-time shuttle tracking, instant ride booking, and automated email alerts 
              for parents, we bring Uber-like convenience right to your campus.
            </p>
          </div>

          {/* Stats Row */}
          <div ref={statsRef} className={`stats-row fade-up ${statsVisible ? 'visible' : ''}`}>
            <div className="stat-item">
              <i className="fas fa-bus stat-icon"></i>
              <div className="stat-number" style={{ color: '#000000', fontWeight: 800, fontSize: '3rem' }}>50+</div>
              <div className="stat-label" style={{ color: '#000000', fontWeight: 600 }}>Active Drivers</div>
            </div>
            <div className="stat-item">
              <i className="fas fa-star stat-icon"></i>
              <div className="stat-number" style={{ color: '#000000', fontWeight: 800, fontSize: '3rem' }}>95%</div>
              <div className="stat-label" style={{ color: '#000000', fontWeight: 600 }}>Satisfaction Rate</div>
            </div>
            <div className="stat-item">
              <i className="fas fa-users stat-icon"></i>
              <div className="stat-number" style={{ color: '#000000', fontWeight: 800, fontSize: '3rem' }}>15K+</div>
              <div className="stat-label" style={{ color: '#000000', fontWeight: 600 }}>Monthly Users</div>
            </div>
          </div>

          {/* Features List */}
          <div ref={featuresRef} className={`features-section fade-up ${featuresVisible ? 'visible' : ''}`}>
            <h3 className="features-heading">What We Offer</h3>
            <div className="features-list">
              {featureCards.map((card, index) => (
                <div key={index} className="feature-item">
                  <div className="feature-icon-circle">
                    <i className={`fas ${card.icon}`}></i>
                  </div>
                  <div className="feature-text">
                    <h4>{card.title}</h4>
                    <p>{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;