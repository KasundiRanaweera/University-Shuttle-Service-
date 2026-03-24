import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginView, setLoginView] = useState<'select' | 'driver' | 'student'>('select');
  const [signupView, setSignupView] = useState<'select' | 'driver' | 'student'>('select');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'student' | 'driver' | null>(null);
  const [brandRef, brandVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1, delay: 0 });
  const [linksRef, linksVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1, delay: 200 });
  const [servicesRef, servicesVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1, delay: 400 });
  const [contactRef, contactVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1, delay: 600 });

  useEffect(() => {
    const studentLoggedIn = localStorage.getItem('studentLoggedIn');
    if (studentLoggedIn === 'true') {
      setIsLoggedIn(true);
      setUserType('student');
    }
  }, [location.pathname]);

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLoginModal(true);
  };

  const closeModal = () => {
    setShowLoginModal(false);
    setLoginView('select');
  };

  const handleDriverLoginClick = () => {
    setLoginView('driver');
  };

  const handleStudentLoginClick = () => {
    setLoginView('student');
  };

  const handleBackToSelect = () => {
    setLoginView('select');
  };

  const handleDriverSignupClick = () => {
    setSignupView('driver');
  };

  const handleStudentSignupClick = () => {
    setSignupView('student');
  };

  const handleBackToSignupSelect = () => {
    setSignupView('select');
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setSignupView('select');
  };

  const switchToSignup = () => {
    setShowLoginModal(false);
    setLoginView('select');
    setTimeout(() => setShowSignupModal(true), 100);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setSignupView('select');
    setTimeout(() => setShowLoginModal(true), 100);
  };

  return (
    <>
      <footer className="footer">
      <div className="footer-main">
        <div className="footer-container">
          {/* Brand Column */}
          <div ref={brandRef} className={`footer-section footer-brand fade-up ${brandVisible ? 'visible' : ''}`}>
            <div className="footer-logo">
              <i className="fas fa-bus"></i>
              <span>Campus Shuttle</span>
            </div>
            <p className="footer-tagline">
              Making campus transportation easy and efficient
            </p>
            <p className="brand-description">
              Your trusted partner for safe, reliable, and comfortable transportation across campus.
            </p>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://wa.me/8475550123" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-icon">
                <i className="fab fa-whatsapp"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div ref={linksRef} className={`footer-section fade-up ${linksVisible ? 'visible' : ''}`}>
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              {(isLoggedIn && userType === 'student') && (location.pathname === '/student-dashboard' || location.pathname === '/contact' || location.pathname === '/shuttle-booking') ? (
                <>
                  <li><Link to="/student-dashboard"><i className="fas fa-chevron-right"></i> Ride</Link></li>
                  <li><Link to="/contact"><i className="fas fa-chevron-right"></i> Contact</Link></li>
                  <li><Link to="/messages"><i className="fas fa-chevron-right"></i> Message</Link></li>
                  <li><Link to="/student-dashboard"><i className="fas fa-chevron-right"></i> Profile</Link></li>
                </>
              ) : (
                <>
                  <li><a href="#home"><i className="fas fa-chevron-right"></i> Home</a></li>
                  <li><a href="#about"><i className="fas fa-chevron-right"></i> About</a></li>
                  <li><a href="#contact"><i className="fas fa-chevron-right"></i> Contact</a></li>
                  <li><Link to="/download"><i className="fas fa-chevron-right"></i> Download</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Services Column */}
          <div ref={servicesRef} className={`footer-section fade-up ${servicesVisible ? 'visible' : ''}`}>
            <h3 className="footer-title">Our Services</h3>
            <ul className="footer-links">
              <li><Link to="/services"><i className="fas fa-chevron-right"></i> Campus Routes</Link></li>
              <li><Link to="/services"><i className="fas fa-chevron-right"></i> Accessibility Support</Link></li>
              <li><Link to="/services"><i className="fas fa-chevron-right"></i> Safety Features</Link></li>
            </ul>
          </div>

          {/* Contact Info Column */}
          <div ref={contactRef} className={`footer-section fade-up ${contactVisible ? 'visible' : ''}`}>
            <h3 className="footer-title">Get In Touch</h3>
            <ul className="footer-contact">
              <li>
                <div className="contact-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="contact-text">
                  <strong>Location</strong>
                  <span>No. 12, Greenway Road<br />Peradeniya, Kandy, Sri Lanka</span>
                </div>
              </li>
              <li>
                <div className="contact-icon">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <div className="contact-text">
                  <strong>Phone</strong>
                  <span>(847) 555-0123</span>
                </div>
              </li>
              <li>
                <div className="contact-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="contact-text">
                  <strong>Email</strong>
                  <span>campusshuttle@mail.com</span>
                </div>
              </li>
              <li>
                <div className="contact-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="contact-text">
                  <strong>Available</strong>
                  <span>24/7 Service</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright">
            &copy; {new Date().getFullYear()} Campus Shuttle. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="separator">|</span>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>


    {/* Signup Modal */}
    {showSignupModal && (
      <div className="login-modal-overlay" onClick={closeSignupModal}>
        <div className="login-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeSignupModal}>
            <i className="fas fa-times"></i>
          </button>
          
          {signupView === 'select' && (
            <>
              <h2 className="modal-title">Choose Signup Type</h2>
              <p className="modal-subtitle">Select your account type to register</p>

              <div className="login-options signup-options">
                <div className="login-option">
                  <div className="login-option-icon rider-icon">
                    <i className="fas fa-id-card"></i>
                  </div>
                  <h3>Driver Signup</h3>
                  <p>Register as a driver and start earning</p>
                  <button className="option-btn rider-btn" onClick={handleDriverSignupClick}>
                    Driver
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>

                <div className="login-option">
                  <div className="login-option-icon student-icon">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <h3>Student Signup</h3>
                  <p>Register as a student to book rides</p>
                  <button className="option-btn student-btn" onClick={handleStudentSignupClick}>
                    Student
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </>
          )}

          {signupView === 'driver' && (
            <>
              <button className="back-btn" onClick={handleBackToSignupSelect}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <h2 className="modal-title">Driver Signup</h2>
              <p className="modal-subtitle">Create your driver account</p>

              <form className="login-form signup-form-extended">
                {/* Personal Details Section */}
                <div className="form-section">
                  <h3 className="section-heading">
                    <i className="fas fa-user-circle"></i> Personal Details
                  </h3>
                  <div className="form-group">
                    <label htmlFor="footer-driver-signup-name">
                      <i className="fas fa-user"></i> Full Name
                    </label>
                    <input
                      type="text"
                      id="footer-driver-signup-name"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-signup-username">
                      <i className="fas fa-user-circle"></i> Username
                    </label>
                    <input
                      type="text"
                      id="footer-driver-signup-username"
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-signup-phone">
                      <i className="fas fa-phone"></i> Phone Number
                    </label>
                    <input
                      type="tel"
                      id="footer-driver-signup-phone"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-signup-email">
                      <i className="fas fa-envelope"></i> Email Address
                    </label>
                    <input
                      type="email"
                      id="footer-driver-signup-email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-signup-password">
                      <i className="fas fa-lock"></i> Password
                    </label>
                    <input
                      type="password"
                      id="footer-driver-signup-password"
                      placeholder="Create a password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-signup-confirm-password">
                      <i className="fas fa-lock"></i> Confirm Password
                    </label>
                    <input
                      type="password"
                      id="footer-driver-signup-confirm-password"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                {/* License and Documents Section */}
                <div className="form-section">
                  <h3 className="section-heading">
                    <i className="fas fa-id-card"></i> License & Documents
                  </h3>
                  <div className="form-group">
                    <label htmlFor="footer-driver-license-number">
                      <i className="fas fa-id-badge"></i> Driver's License Number
                    </label>
                    <input
                      type="text"
                      id="footer-driver-license-number"
                      placeholder="Enter your license number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-license-upload">
                      <i className="fas fa-upload"></i> Upload License
                    </label>
                    <input
                      type="file"
                      id="footer-driver-license-upload"
                      accept="image/*,.pdf"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-vehicle-doc-upload">
                      <i className="fas fa-upload"></i> Upload Vehicle Document
                    </label>
                    <input
                      type="file"
                      id="footer-driver-vehicle-doc-upload"
                      accept="image/*,.pdf"
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Details Section */}
                <div className="form-section">
                  <h3 className="section-heading">
                    <i className="fas fa-car"></i> Vehicle Details
                  </h3>
                  <div className="form-group">
                    <label htmlFor="footer-driver-vehicle-type">
                      <i className="fas fa-shuttle-van"></i> Vehicle Type
                    </label>
                    <select id="footer-driver-vehicle-type" required>
                      <option value="">Select vehicle type</option>
                      <option value="bus">Bus</option>
                      <option value="minibus">Minibus</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-vehicle-number">
                      <i className="fas fa-hashtag"></i> Vehicle Number
                    </label>
                    <input
                      type="text"
                      id="footer-driver-vehicle-number"
                      placeholder="Enter vehicle registration number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-driver-seats">
                      <i className="fas fa-chair"></i> Number of Seats
                    </label>
                    <input
                      type="number"
                      id="footer-driver-seats"
                      placeholder="Enter number of seats"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  Create Driver Account
                  <i className="fas fa-user-plus"></i>
                </button>

                <p className="form-footer">
                  Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchToLogin(); }}>Login</a>
                </p>
              </form>
            </>
          )}

          {signupView === 'student' && (
            <>
              <button className="back-btn" onClick={handleBackToSignupSelect}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <h2 className="modal-title">Student Signup</h2>
              <p className="modal-subtitle">Create your student account</p>

              <form className="login-form signup-form-extended">
                {/* Student Details Section */}
                <div className="form-section">
                  <h3 className="section-heading">
                    <i className="fas fa-user-graduate"></i>
                    Student Details
                  </h3>

                  <div className="form-group">
                    <label htmlFor="footer-student-username">
                      <i className="fas fa-user-circle"></i> Username
                    </label>
                    <input
                      type="text"
                      id="footer-student-username"
                      placeholder="Choose a username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-student-fullname">
                      <i className="fas fa-user"></i> Full Name
                    </label>
                    <input
                      type="text"
                      id="footer-student-fullname"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-student-email">
                      <i className="fas fa-envelope"></i> Email Address
                    </label>
                    <input
                      type="email"
                      id="footer-student-email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-student-mobile">
                      <i className="fas fa-phone"></i> Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="footer-student-mobile"
                      placeholder="Enter your mobile number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-student-university">
                      <i className="fas fa-university"></i> University
                    </label>
                    <input
                      type="text"
                      id="footer-student-university"
                      placeholder="Enter your university name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-student-address">
                      <i className="fas fa-home"></i> Home Address
                    </label>
                    <input
                      type="text"
                      id="footer-student-address"
                      placeholder="Enter your home address"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-student-password">
                      <i className="fas fa-lock"></i> Password
                    </label>
                    <input
                      type="password"
                      id="footer-student-password"
                      placeholder="Create a password"
                      required
                    />
                  </div>
                </div>

                {/* Parent/Guardian Information Section */}
                <div className="form-section">
                  <h3 className="section-heading">
                    <i className="fas fa-user-friends"></i>
                    Parent/Guardian Information
                  </h3>

                  <div className="form-group">
                    <label htmlFor="footer-guardian-name">
                      <i className="fas fa-user"></i> Parent/Guardian Name
                    </label>
                    <input
                      type="text"
                      id="footer-guardian-name"
                      placeholder="Enter parent/guardian name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-guardian-email">
                      <i className="fas fa-envelope"></i> Email Address
                    </label>
                    <input
                      type="email"
                      id="footer-guardian-email"
                      placeholder="Enter parent/guardian email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="footer-guardian-mobile">
                      <i className="fas fa-phone"></i> Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="footer-guardian-mobile"
                      placeholder="Enter parent/guardian mobile"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  Create Student Account
                  <i className="fas fa-user-plus"></i>
                </button>

                <p className="form-footer">
                  Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchToLogin(); }}>Login</a>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
};

export default Footer;