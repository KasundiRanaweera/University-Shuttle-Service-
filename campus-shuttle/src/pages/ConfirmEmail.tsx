
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ConfirmEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const rateLimit = location.state && location.state.rateLimit;

  // If the user lands here with a confirmation hash, redirect to home after confirming
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('confirmation_hash')) {
      // Optionally, you could show a loading spinner or success message here
      setTimeout(() => {
        window.location.href = 'https://campus-shutle.web.app/';
      }, 2000); // 2 seconds delay for user feedback
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8f6ff 0%, #e9e0f7 100%)' }}>
      <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 8px 32px rgba(132,23,186,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <i className={rateLimit ? "fas fa-exclamation-triangle" : "fas fa-envelope-open-text"} style={{ fontSize: 54, color: rateLimit ? '#e74c3c' : '#8417ba', marginBottom: 18 }}></i>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 700, marginBottom: 10 }}>
          {rateLimit ? 'Email Limit Reached' : 'Confirm Your Email'}
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#444', marginBottom: 18 }}>
          {rateLimit ? (
            <>
              You have requested too many confirmation emails in a short period.<br/>
              Please wait a while before trying again.<br/><br/>
              <span style={{ color: '#e74c3c', fontWeight: 500 }}>This is a temporary limit to prevent abuse.</span>
            </>
          ) : (
            <>
              We just sent a confirmation email to your address.<br/>
              Please check your inbox (and spam folder) and click the link to activate your account.<br/><br/>
              <span style={{ color: '#8417ba', fontWeight: 500 }}>You can log in after confirming your email.</span>
            </>
          )}
        </p>
        <Link to="/" style={{ display: 'inline-block', marginTop: 10, color: rateLimit ? '#e74c3c' : '#8417ba', fontWeight: 600, textDecoration: 'underline' }}>Back to Home</Link>
      </div>
    </div>
  );
};

export default ConfirmEmail;
