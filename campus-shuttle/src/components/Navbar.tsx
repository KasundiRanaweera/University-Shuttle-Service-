import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginView, setLoginView] = useState<'select' | 'driver' | 'student' | 'admin'>('select');
  const [signupView, setSignupView] = useState<'select' | 'driver' | 'student' | 'admin'>('select');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'student' | 'driver' | 'admin' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const userSession = localStorage.getItem('userSession');
    const studentLoggedIn = localStorage.getItem('studentLoggedIn');
    const driverLoggedIn = localStorage.getItem('driverLoggedIn');
    const driverSession = localStorage.getItem('driverSession');
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (driverLoggedIn === 'true' || driverSession) {
      setIsLoggedIn(true);
      setUserType('driver');
    } else if (userSession || studentLoggedIn === 'true') {
      setIsLoggedIn(true);
      setUserType('student');
    } else if (adminLoggedIn === 'true') {
      setIsLoggedIn(true);
      setUserType('admin');
    } else {
      setIsLoggedIn(false);
      setUserType(null);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleDriverLogin = () => {
    setLoginView('driver');
  };

  const handleStudentLogin = () => {
    setLoginView('student');
  };

  const handleAdminLogin = () => {
    setLoginView('admin');
  };

  const goBackToSelect = () => {
    setLoginView('select');
  };

  const handleDriverSignup = () => {
    setSignupView('driver');
  };

  const handleStudentSignup = () => {
    setSignupView('student');
  };

  const goBackToSignupSelect = () => {
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

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="nav-logo" style={{ cursor: 'default' }}>
            <i className="fas fa-bus"></i>
            <span>Campus Shuttle</span>
          </div>
          <button className="mobile-menu-icon" onClick={toggleMobileMenu}>
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            {isLoggedIn ? (
              <>
                {userType === 'student' && (
                  <>
                    <Link to="/student-dashboard" className="nav-link" onClick={closeMobileMenu}>Home</Link>
                    <Link to="/about" className="nav-link" onClick={closeMobileMenu}>About Us</Link>
                    <Link to="/contact" className="nav-link" onClick={closeMobileMenu}>Contact</Link>
                    <Link to="/student-profile" className="nav-button" onClick={closeMobileMenu}>
                      <i className="fas fa-user-circle"></i> Profile
                    </Link>
                  </>
                )}
                {userType === 'driver' && (
                  <>
                    <Link to="/driver-dashboard" className="nav-link" onClick={closeMobileMenu}>Home</Link>
                    <Link to="/about" className="nav-link" onClick={closeMobileMenu}>About Us</Link>
                    <Link to="/contact" className="nav-link" onClick={closeMobileMenu}>Contact</Link>
                    <Link to="/driver-profile" className="nav-button" onClick={closeMobileMenu}>
                      <i className="fas fa-user-circle"></i> Profile
                    </Link>
                  </>
                )}
                {userType === 'admin' && (
                  <>
                    <Link to="/admin-dashboard" className="nav-link" onClick={closeMobileMenu}>Admin Dashboard</Link>
                    <Link to="/contact" className="nav-link" onClick={closeMobileMenu}>Contact</Link>
                    <a href="#message" className="nav-link" onClick={closeMobileMenu}>Message</a>
                    <Link to="/admin-profile" className="nav-button" onClick={closeMobileMenu}>
                      <i className="fas fa-user-shield"></i> Admin Profile
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <a href="#home" className="nav-link" onClick={closeMobileMenu}>Home</a>
                <a href="#about" className="nav-link" onClick={closeMobileMenu}>About Us</a>
                <a href="#contact" className="nav-link" onClick={closeMobileMenu}>Contact</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={closeModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
            
            {loginView === 'select' && (
              <>
                <h2 className="modal-title">Choose Login Type</h2>
                <p className="modal-subtitle">Select your account type to continue</p>

                <div className="login-options">
                  <div className="login-option">
                    <div className="login-option-icon rider-icon">
                      <i className="fas fa-id-card"></i>
                    </div>
                    <h3>Driver Login</h3>
                    <p>Access driver dashboard</p>
                    <button className="option-btn rider-btn" onClick={handleDriverLogin}>
                      Driver
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>

                  <div className="login-option">
                    <div className="login-option-icon student-icon">
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <h3>Student Login</h3>
                    <p>Track shuttles and book your rides</p>
                    <button className="option-btn student-btn" onClick={handleStudentLogin}>
                      Student
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>

                  <div className="login-option">
                    <div className="login-option-icon admin-icon">
                      <i className="fas fa-cog"></i>
                    </div>
                    <h3>Admin Login</h3>
                    <p>Manage system and users only</p>
                    <button className="option-btn admin-btn" onClick={handleAdminLogin}>
                      Admin
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </>
            )}

            {loginView === 'driver' && (
              <>
                <button className="back-btn" onClick={goBackToSelect}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="modal-title">Driver Login</h2>
                <p className="modal-subtitle">Welcome back! Please enter your details</p>

                <form className="login-form" onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem('driverLoggedIn', 'true');
                  setIsLoggedIn(true);
                  setUserType('driver');
                  closeModal();
                  navigate('/driver-dashboard');
                }}>
                  <div className="form-group">
                    <label htmlFor="driver-username">
                      <i className="fas fa-user-circle"></i>
                      Username
                    </label>
                    <input 
                      type="text" 
                      id="driver-username" 
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="driver-password">
                      <i className="fas fa-lock"></i>
                      Password
                    </label>
                    <input 
                      type="password" 
                      id="driver-password" 
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="forgot-password">Forgot Password?</a>
                  </div>

                  <button type="submit" className="submit-btn">
                    <i className="fas fa-sign-in-alt"></i>
                    Login as Driver
                  </button>

                  <p className="form-footer">
                    Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchToSignup(); }}>Sign up</a>
                  </p>
                </form>
              </>
            )}

            {loginView === 'student' && (
              <>
                <button className="back-btn" onClick={goBackToSelect}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="modal-title">Student Login</h2>
                <p className="modal-subtitle">Welcome back! Please enter your details</p>

                <form className="login-form" onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem('studentLoggedIn', 'true');
                  setIsLoggedIn(true);
                  setUserType('student');
                  closeModal();
                  navigate('/student-dashboard');
                }}>
                  <div className="form-group">
                    <label htmlFor="student-username">
                      <i className="fas fa-user-circle"></i>
                      Username
                    </label>
                    <input 
                      type="text" 
                      id="student-username" 
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-password">
                      <i className="fas fa-lock"></i>
                      Password
                    </label>
                    <input 
                      type="password" 
                      id="student-password" 
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="forgot-password">Forgot Password?</a>
                  </div>

                  <button type="submit" className="submit-btn">
                    <i className="fas fa-sign-in-alt"></i>
                    Login as Student
                  </button>

                  <p className="form-footer">
                    Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchToSignup(); }}>Sign up</a>
                  </p>
                </form>
              </>
            )}

            {loginView === 'admin' && (
              <>
                <button className="back-btn" onClick={goBackToSelect}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="modal-title">Admin Login</h2>
                <p className="modal-subtitle">Welcome back! Please enter your details</p>

                <form className="login-form" onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem('adminLoggedIn', 'true');
                  setIsLoggedIn(true);
                  setUserType('admin');
                  closeModal();
                  navigate('/admin-dashboard');
                }}>
                  <div className="form-group">
                    <label htmlFor="admin-username">
                      <i className="fas fa-user-circle"></i>
                      Username
                    </label>
                    <input 
                      type="text" 
                      id="admin-username" 
                      placeholder="Enter admin username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-password">
                      <i className="fas fa-lock"></i>
                      Password
                    </label>
                    <input 
                      type="password" 
                      id="admin-password" 
                      placeholder="Enter admin password"
                      required
                    />
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                  </div>

                  <button type="submit" className="submit-btn">
                    <i className="fas fa-sign-in-alt"></i>
                    Login as Admin
                  </button>
                </form>
              </>
            )}          </div>
        </div>
      )}

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
                    <button className="option-btn rider-btn" onClick={handleDriverSignup}>
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
                    <button className="option-btn student-btn" onClick={handleStudentSignup}>
                      Student
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </>
            )}

            {signupView === 'driver' && (
              <>
                <button className="back-btn" onClick={goBackToSignupSelect}>
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
                      <label htmlFor="nav-driver-signup-name">
                        <i className="fas fa-user"></i>
                        Full Name
                      </label>
                      <input 
                        type="text" 
                        id="nav-driver-signup-name" 
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-signup-username">
                        <i className="fas fa-user-circle"></i>
                        Username
                      </label>
                      <input 
                        type="text" 
                        id="nav-driver-signup-username" 
                        placeholder="Enter your username"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-signup-phone">
                        <i className="fas fa-phone"></i>
                        Phone Number
                      </label>
                      <input 
                        type="tel" 
                        id="nav-driver-signup-phone" 
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-signup-email">
                        <i className="fas fa-envelope"></i>
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        id="nav-driver-signup-email" 
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-signup-password">
                        <i className="fas fa-lock"></i>
                        Password
                      </label>
                      <input 
                        type="password" 
                        id="nav-driver-signup-password" 
                        placeholder="Create a password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-signup-confirm-password">
                        <i className="fas fa-lock"></i>
                        Confirm Password
                      </label>
                      <input 
                        type="password" 
                        id="nav-driver-signup-confirm-password" 
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
                      <label htmlFor="nav-driver-license-number">
                        <i className="fas fa-id-badge"></i>
                        Driver's License Number
                      </label>
                      <input 
                        type="text" 
                        id="nav-driver-license-number" 
                        placeholder="Enter your license number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-license-upload">
                        <i className="fas fa-upload"></i>
                        Upload License
                      </label>
                      <input 
                        type="file" 
                        id="nav-driver-license-upload" 
                        accept="image/*,.pdf"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-vehicle-doc-upload">
                        <i className="fas fa-upload"></i>
                        Upload Vehicle Document
                      </label>
                      <input 
                        type="file" 
                        id="nav-driver-vehicle-doc-upload" 
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
                      <label htmlFor="nav-driver-vehicle-type">
                        <i className="fas fa-shuttle-van"></i>
                        Vehicle Type
                      </label>
                      <select 
                        id="nav-driver-vehicle-type"
                        required
                      >
                        <option value="">Select vehicle type</option>
                        <option value="bus">Bus</option>
                        <option value="minibus">Minibus</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-vehicle-number">
                        <i className="fas fa-hashtag"></i>
                        Vehicle Number
                      </label>
                      <input 
                        type="text" 
                        id="nav-driver-vehicle-number" 
                        placeholder="Enter vehicle registration number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-driver-seats">
                        <i className="fas fa-chair"></i>
                        Number of Seats
                      </label>
                      <input 
                        type="number" 
                        id="nav-driver-seats" 
                        placeholder="Enter number of seats"
                        min="1"
                        max="50"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn rider-submit">
                    <i className="fas fa-user-plus"></i>
                    Create Driver Account
                  </button>

                  <p className="signup-link">
                    Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchToLogin(); }}>Login</a>
                  </p>
                </form>
              </>
            )}

            {signupView === 'student' && (
              <>
                <button className="back-btn" onClick={goBackToSignupSelect}>
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
                      <label htmlFor="nav-student-username">
                        <i className="fas fa-user-circle"></i>
                        Username
                      </label>
                      <input 
                        type="text" 
                        id="nav-student-username" 
                        placeholder="Choose a username"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-student-fullname">
                        <i className="fas fa-user"></i>
                        Full Name
                      </label>
                      <input 
                        type="text" 
                        id="nav-student-fullname" 
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-student-email">
                        <i className="fas fa-envelope"></i>
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        id="nav-student-email" 
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-student-mobile">
                        <i className="fas fa-phone"></i>
                        Mobile Number
                      </label>
                      <input 
                        type="tel" 
                        id="nav-student-mobile" 
                        placeholder="Enter your mobile number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-student-university">
                        <i className="fas fa-university"></i>
                        University
                      </label>
                      <input 
                        type="text" 
                        id="nav-student-university" 
                        placeholder="Enter your university name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-student-address">
                        <i className="fas fa-home"></i>
                        Home Address
                      </label>
                      <input 
                        type="text" 
                        id="nav-student-address" 
                        placeholder="Enter your home address"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-student-password">
                        <i className="fas fa-lock"></i>
                        Password
                      </label>
                      <input 
                        type="password" 
                        id="nav-student-password" 
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
                      <label htmlFor="nav-guardian-name">
                        <i className="fas fa-user"></i>
                        Parent/Guardian Name
                      </label>
                      <input 
                        type="text" 
                        id="nav-guardian-name" 
                        placeholder="Enter parent/guardian name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-guardian-email">
                        <i className="fas fa-envelope"></i>
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        id="nav-guardian-email" 
                        placeholder="Enter parent/guardian email"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="nav-guardian-mobile">
                        <i className="fas fa-phone"></i>
                        Mobile Number
                      </label>
                      <input 
                        type="tel" 
                        id="nav-guardian-mobile" 
                        placeholder="Enter parent/guardian mobile"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn student-submit">
                    <i className="fas fa-user-plus"></i>
                    Create Student Account
                  </button>

                  <p className="signup-link">
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

export default Navbar;