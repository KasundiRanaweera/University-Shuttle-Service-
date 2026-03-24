import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
  // State for signup success modal
  // Remove modal state, use navigation instead
// Firebase imports removed
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function LandingPage() {
  // Password validation state
  const [studentPasswordError, setStudentPasswordError] = useState('');
  const [driverPasswordError, setDriverPasswordError] = useState('');
  
  // Student login state
  const [studentLogin, setStudentLogin] = useState({
    username: '',
    password: ''
  });
  const [studentLoginError, setStudentLoginError] = useState('');
  const [isStudentLoggingIn, setIsStudentLoggingIn] = useState(false);
  
  // Driver login state
  const [driverLogin, setDriverLogin] = useState({
    username: '',
    password: ''
  });
  const [driverLoginError, setDriverLoginError] = useState('');
  const [isDriverLoggingIn, setIsDriverLoggingIn] = useState(false);
  
  const [driverSignupErrors, setDriverSignupErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginView, setLoginView] = useState<'select' | 'driver' | 'student' | 'admin'>('select');
  const [signupView, setSignupView] = useState<'select' | 'driver' | 'student' | 'admin'>('select');
  // State for student signup form
  const [studentSignup, setStudentSignup] = useState({
    username: '',
    fullName: '',
    email: '',
    mobile: '',
    university: '',
    address: '',
    password: '',
    guardianName: '',
    guardianEmail: '',
    guardianMobile: ''
  });

  // Password visibility toggle for student signup
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // State for driver signup form
  const [driverSignup, setDriverSignup] = useState<{
    fullName: string;
    username: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    licenseNumber: string;
    vehicleType: string;
    vehicleNumber: string;
    seats: string;
    licenseFile: File | null;
    vehicleDocFile: File | null;
  }>({
    fullName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    vehicleType: '',
    vehicleNumber: '',
    seats: '',
    licenseFile: null,
    vehicleDocFile: null,
  });

  const handleDriverSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    if (type === 'file' && 'files' in target) {
      setDriverSignup({ ...driverSignup, [name]: (target.files && target.files[0]) ? target.files[0] : null });
    } else {
      setDriverSignup({ ...driverSignup, [name]: value });
    }
  };

  const handleDriverSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!driverSignup.fullName) errors.fullName = 'Full name is required.';
    if (!driverSignup.username) errors.username = 'Username is required.';
    if (!driverSignup.phone) errors.phone = 'Phone number is required.';
    if (!driverSignup.email) errors.email = 'Email is required.';
    if (!driverSignup.password) errors.password = 'Password is required.';
    if (!driverSignup.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    if (driverSignup.password !== driverSignup.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!driverSignup.licenseNumber) errors.licenseNumber = 'License number is required.';
    if (!driverSignup.vehicleType) errors.vehicleType = 'Vehicle type is required.';
    if (!driverSignup.vehicleNumber) errors.vehicleNumber = 'Vehicle number is required.';
    if (!driverSignup.seats) errors.seats = 'Number of seats is required.';
    if (!driverSignup.licenseFile) errors.licenseFile = 'License file is required.';
    if (!driverSignup.vehicleDocFile) errors.vehicleDocFile = 'Vehicle document is required.';
    setDriverSignupErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // 1. Insert into users table first
    const passwordHash = await bcrypt.hash(driverSignup.password, 10);
    const { data: userInsert, error: userInsertError } = await supabase
      .from('users')
      .insert([
        {
          full_name: driverSignup.fullName,
          username: driverSignup.username,
          email: driverSignup.email,
          phone_no: driverSignup.phone,
          role: 'DRIVER',
          status: 'INACTIVE',
          is_active: false,
          password_hash: passwordHash
        }
      ])
      .select();

    if (userInsertError) {
      setDriverSignupErrors({ general: 'Error creating user: ' + userInsertError.message });
      return;
    }

    const userId = userInsert && userInsert[0] && userInsert[0].user_id;
    if (!userId) {
      setDriverSignupErrors({ general: 'User creation failed.' });
      return;
    }

    // 2. Upload license and vehicle documents to Supabase Storage
    let licenseUrl = '';
    let vehicleDocUrl = '';
    // Upload license file
    if (driverSignup.licenseFile) {
      const uploadResult = await supabase.storage
        .from('documents')
        .upload(`licenses/${userId}_${driverSignup.licenseFile.name}`, driverSignup.licenseFile);
      const licenseUpload = uploadResult.data;
      const licenseUploadError = uploadResult.error;
      console.log('License upload result:', uploadResult);
      if (licenseUploadError || !licenseUpload || !licenseUpload.path) {
        setDriverSignupErrors({ general: 'Error uploading license file: ' + (licenseUploadError?.message || 'No file path returned') });
        return;
      }
      const licensePath = licenseUpload.path;
      licenseUrl = supabase.storage.from('documents').getPublicUrl(licensePath).data.publicUrl;
      if (!licenseUrl) {
        // Fallback: construct public URL manually
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
        licenseUrl = `${supabaseUrl}/storage/v1/object/public/documents/${licensePath}`;
        // Optionally, check if licenseUrl is accessible
      }
    } else {
      setDriverSignupErrors({ general: 'License file is required.' });
      return;
    }
    // Upload vehicle document file
    if (driverSignup.vehicleDocFile) {
      const uploadResult = await supabase.storage
        .from('documents')
        .upload(`vehicles/${userId}_${driverSignup.vehicleDocFile.name}`, driverSignup.vehicleDocFile);
      const vehicleUpload = uploadResult.data;
      const vehicleUploadError = uploadResult.error;
      console.log('Vehicle document upload result:', uploadResult);
      if (vehicleUploadError || !vehicleUpload || !vehicleUpload.path) {
        setDriverSignupErrors({ general: 'Error uploading vehicle document: ' + (vehicleUploadError?.message || 'No file path returned') });
        return;
      }
      const vehiclePath = vehicleUpload.path;
      vehicleDocUrl = supabase.storage.from('documents').getPublicUrl(vehiclePath).data.publicUrl;
      if (!vehicleDocUrl) {
        // Fallback: construct public URL manually
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
        vehicleDocUrl = `${supabaseUrl}/storage/v1/object/public/documents/${vehiclePath}`;
        // Optionally, check if vehicleDocUrl is accessible
      }
    } else {
      setDriverSignupErrors({ general: 'Vehicle document file is required.' });
      return;
    }

    // 3. Insert into driver table with URLs
    const { error: driverInsertError } = await supabase
      .from('driver')
      .insert([
        {
          user_id: userId,
          license_no: driverSignup.licenseNumber,
          license_document: licenseUrl,
          vehicle_document: vehicleDocUrl,
          vehicle_type: driverSignup.vehicleType,
          vehicle_number: driverSignup.vehicleNumber,
          number_of_seats: parseInt(driverSignup.seats, 10),
          driver_profile_photo: null
        }
      ]);

    if (driverInsertError) {
      setDriverSignupErrors({ general: 'Error creating driver: ' + driverInsertError.message });
      return;
    }

    // Register with Supabase Auth and send confirmation email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: driverSignup.email,
      password: driverSignup.password,
      options: {
        data: {
          full_name: driverSignup.fullName,
          username: driverSignup.username,
          phone: driverSignup.phone,
          role: 'DRIVER'
        }
      }
    });
    if (authError) {
      if (authError.message && authError.message.toLowerCase().includes('rate limit')) {
        navigate('/confirm-email', { state: { rateLimit: true } });
      } else {
        setDriverSignupErrors({ general: 'Driver registration failed: ' + authError.message });
      }
      return;
    }

    navigate('/confirm-email');
    setDriverSignup({
      fullName: '',
      username: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      licenseNumber: '',
      vehicleType: '',
      vehicleNumber: '',
      seats: '',
      licenseFile: null,
      vehicleDocFile: null,
    });
    setDriverSignupErrors({});
    closeSignupModal();
  };

  const handleStudentSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudentSignup({ ...studentSignup, [name]: value });
  };

  const handleStudentSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentSignup.password.length < 6) {
      setStudentPasswordError('Password should be at least 6 characters.');
      return;
    }


    // 1. Hash the password and insert into users table (custom table, not Supabase Auth)
    const passwordHash = await bcrypt.hash(studentSignup.password, 10);
    const { data: userInsert, error: userInsertError } = await supabase
      .from('users')
      .insert([
        {
          full_name: studentSignup.fullName,
          username: studentSignup.username,
          email: studentSignup.email,
          phone_no: studentSignup.mobile,
          role: 'STUDENT',
          status: 'INACTIVE',
          is_active: false,
          password_hash: passwordHash
        }
      ])
      .select();

    if (userInsertError) {
      setStudentPasswordError('Error creating user: ' + userInsertError.message);
      return;
    }

    const userId = userInsert && userInsert[0] && userInsert[0].user_id;
    if (!userId) {
      setStudentPasswordError('User creation failed.');
      return;
    }

    // 2. Insert into student table
    const { error: studentInsertError } = await supabase
      .from('student')
      .insert([
        {
          user_id: userId,
          university: studentSignup.university,
          home_address: studentSignup.address,
          parent_name: studentSignup.guardianName,
          parent_phone_no: studentSignup.guardianMobile,
          parent_email: studentSignup.guardianEmail
        }
      ]);

    if (studentInsertError) {
      setStudentPasswordError('Error creating student profile: ' + studentInsertError.message);
      return;
    }

    // 3. Register with Supabase Auth (for email confirmation)
    const { data, error: authError } = await supabase.auth.signUp({
      email: studentSignup.email,
      password: studentSignup.password,
      options: {
        data: {
          username: studentSignup.username,
          full_name: studentSignup.fullName,
          phone: studentSignup.mobile,
          role: 'STUDENT'
        }
      }
    });
    if (authError) {
      if (authError.message && authError.message.toLowerCase().includes('rate limit')) {
        navigate('/confirm-email', { state: { rateLimit: true } });
      } else {
        alert('Student registration failed: ' + authError.message);
      }
      return;
    }
    navigate('/confirm-email');
    setStudentSignup({
      username: '',
      fullName: '',
      email: '',
      mobile: '',
      university: '',
      address: '',
      password: '',
      guardianName: '',
      guardianEmail: '',
      guardianMobile: ''
    });
    closeSignupModal();
    // After confirmation, user should log in and complete profile (add university, guardian info, etc.)
  };
  const [headingRef1, heading1Visible] = useScrollAnimation<HTMLHeadingElement>({ threshold: 0.2 });
  const [headingRef2, heading2Visible] = useScrollAnimation<HTMLHeadingElement>({ threshold: 0.2, delay: 300 });
  const [headingRef3, heading3Visible] = useScrollAnimation<HTMLHeadingElement>({ threshold: 0.2, delay: 600 });
  const [taglineRef, taglineVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2, delay: 900 });
  const [loginRef, loginVisible] = useScrollAnimation<HTMLButtonElement>({ threshold: 0.2, delay: 1200 });
  const [signupRef, signupVisible] = useScrollAnimation<HTMLButtonElement>({ threshold: 0.2, delay: 1500 });

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLoginModal(true);
  };

  const handleSignupClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignupModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginView('select');
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setSignupView('select');
  };

  const handleDriverLoginClick = () => {
    setLoginView('driver');
  };

  const handleStudentLoginClick = () => {
    setLoginView('student');
  };

  const handleAdminLoginClick = () => {
    setLoginView('admin');
  };

  const handleDriverSignupClick = () => {
    setSignupView('driver');
  };

  const handleStudentSignupClick = () => {
    setSignupView('student');
  };

  // Handle student login input change
  const handleStudentLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudentLogin({ ...studentLogin, [name]: value });
    setStudentLoginError(''); // Clear error on input change
  };

  // Handle student login submission
  const handleStudentLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentLoginError('');
    setIsStudentLoggingIn(true);

    try {
      // 1. Find user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', studentLogin.username)
        .eq('role', 'STUDENT')
        .single();

      if (userError || !userData) {
        setStudentLoginError('Invalid username or password');
        setIsStudentLoggingIn(false);
        return;
      }

      // 2. Verify password first
      const isPasswordValid = await bcrypt.compare(studentLogin.password, userData.password_hash);
      if (!isPasswordValid) {
        setStudentLoginError('Invalid username or password');
        setIsStudentLoggingIn(false);
        return;
      }

      // 3. Check if account is active, if not try to verify via Supabase Auth
      if (userData.status !== 'ACTIVE' || !userData.is_active) {
        // Try to sign in via Supabase Auth to check if email is confirmed
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: studentLogin.password
        });

        if (authError) {
          // Check if error is about email confirmation
          if (authError.message.toLowerCase().includes('email not confirmed')) {
            setStudentLoginError('Your account is not yet activated. Please check your email for confirmation.');
          } else {
            setStudentLoginError('Your account is not yet activated. Please check your email for confirmation.');
          }
          setIsStudentLoggingIn(false);
          return;
        }

        // Email is confirmed in Supabase Auth, update the custom users table
        if (authData?.user?.email_confirmed_at) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ status: 'ACTIVE', is_active: true })
            .eq('user_id', userData.user_id);

          if (updateError) {
            console.error('Error updating user status:', updateError);
          }
          // Sign out from Supabase Auth (we're using custom session management)
          await supabase.auth.signOut();
        } else {
          setStudentLoginError('Your account is not yet activated. Please check your email for confirmation.');
          setIsStudentLoggingIn(false);
          return;
        }
      }

      // 4. Get student profile data
      const { data: studentData, error: studentError } = await supabase
        .from('student')
        .select('*')
        .eq('user_id', userData.user_id)
        .single();

      // 5. Store user session in localStorage
      const userSession = {
        userId: userData.user_id,
        username: userData.username,
        fullName: userData.full_name,
        email: userData.email,
        phone: userData.phone_no,
        role: userData.role,
        student: studentData || null
      };
      localStorage.setItem('userSession', JSON.stringify(userSession));
      localStorage.setItem('studentLoggedIn', 'true');

      // 6. Close modal and navigate to dashboard
      closeLoginModal();
      setStudentLogin({ username: '', password: '' });
      navigate('/student-dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setStudentLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsStudentLoggingIn(false);
    }
  };

  // Handle driver login input change
  const handleDriverLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDriverLogin({ ...driverLogin, [name]: value });
    setDriverLoginError(''); // Clear error on input change
  };

  // Handle driver login submission
  const handleDriverLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverLoginError('');
    setIsDriverLoggingIn(true);

    try {
      // 1. Find user by username with DRIVER role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', driverLogin.username)
        .eq('role', 'DRIVER')
        .single();

      if (userError || !userData) {
        setDriverLoginError('Invalid username or password');
        setIsDriverLoggingIn(false);
        return;
      }

      // 2. Check if account is active
      if (userData.status !== 'ACTIVE' || !userData.is_active) {
        setDriverLoginError('Your account is not yet activated. Please wait for admin approval.');
        setIsDriverLoggingIn(false);
        return;
      }

      // 3. Verify password
      const isPasswordValid = await bcrypt.compare(driverLogin.password, userData.password_hash);
      if (!isPasswordValid) {
        setDriverLoginError('Invalid username or password');
        setIsDriverLoggingIn(false);
        return;
      }

      // 4. Get driver profile data
      const { data: driverData, error: driverError } = await supabase
        .from('driver')
        .select('*')
        .eq('user_id', userData.user_id)
        .single();

      // Debug: Log data from database
      console.log('User data from database:', userData);
      console.log('Driver data from database:', driverData);
      console.log('Driver error:', driverError);

      // 5. Store driver session in localStorage (matching DriverDashboard expected structure)
      // Personal info comes from users table, driver-specific info from driver table
      const driverSession = {
        user: {
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          phone_no: userData.phone_no,
          full_name: userData.full_name,
          role: userData.role
        },
        driver: driverData ? {
          user_id: driverData.user_id,
          license_no: driverData.license_no,
          license_document: driverData.license_document,
          vehicle_document: driverData.vehicle_document,
          vehicle_type: driverData.vehicle_type,
          vehicle_number: driverData.vehicle_number,
          number_of_seats: driverData.number_of_seats,
          driver_profile_photo: driverData.driver_profile_photo
        } : null
      };
      
      console.log('Driver session being saved:', driverSession);
      
      localStorage.setItem('driverSession', JSON.stringify(driverSession));
      localStorage.setItem('driverLoggedIn', 'true');

      // 6. Close modal and navigate to dashboard
      closeLoginModal();
      setDriverLogin({ username: '', password: '' });
      navigate('/driver-dashboard');

    } catch (error) {
      console.error('Driver login error:', error);
      setDriverLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsDriverLoggingIn(false);
    }
  };

  const handleBackToSelect = () => {
    setLoginView('select');
  };

  const handleBackToSignupSelect = () => {
    setSignupView('select');
  };

  return (
    <>
      <section id="home" className="landing-page">
        <div className="landing-bg-image"></div>
        <div className="content">
          <div className="left-side">
            <h2 
              ref={headingRef1} 
              className={`header-university fade-right ${heading1Visible ? 'visible' : ''}`}
            >
              University
            </h2>
            <h2 
              ref={headingRef2} 
              className={`header-shuttle fade-right ${heading2Visible ? 'visible' : ''}`}
            >
              Shuttle
            </h2>
            <h2 
              ref={headingRef3} 
              className={`header-service fade-right ${heading3Visible ? 'visible' : ''}`}
            >
              Service
            </h2>
            <div 
              ref={taglineRef} 
              className={`header-tagline fade-up ${taglineVisible ? 'visible' : ''}`}
            >
              Ride smart. Track live. Stay connected on campus.
            </div>
            <div className="buttons-container">
              <button 
                ref={loginRef}
                onClick={handleLoginClick}
                className={`login-btn-main fade-up ${loginVisible ? 'visible' : ''}`}
              >
                LOGIN
              </button>
              <button 
                ref={signupRef}
                onClick={handleSignupClick}
                className={`signup-btn-main fade-up ${signupVisible ? 'visible' : ''}`}
              >
                SIGNUP
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={closeLoginModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeLoginModal}>
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
                    <button className="option-btn rider-btn" onClick={handleDriverLoginClick}>
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
                    <button className="option-btn student-btn" onClick={handleStudentLoginClick}>
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
                    <button className="option-btn admin-btn" onClick={handleAdminLoginClick}>
                      Admin
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </>
            )}

            {loginView === 'driver' && (
              <>
                <button className="back-btn" onClick={handleBackToSelect}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="modal-title">Driver Login</h2>
                <p className="modal-subtitle">Welcome back! Please enter your details</p>

                <form className="login-form" onSubmit={handleDriverLoginSubmit}>
                  {driverLoginError && (
                    <div className="error-message" style={{ 
                      color: '#dc3545', 
                      background: 'rgba(220, 53, 69, 0.1)', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '8px', 
                      marginBottom: '1rem',
                      fontSize: '0.95rem',
                      textAlign: 'center'
                    }}>
                      <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
                      {driverLoginError}
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="driver-username">
                      <i className="fas fa-user-circle"></i>
                      Username
                    </label>
                    <input
                      type="text"
                      id="driver-username"
                      name="username"
                      value={driverLogin.username}
                      onChange={handleDriverLoginChange}
                      placeholder="Enter your username"
                      required
                      disabled={isDriverLoggingIn}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="driver-password">
                      <i className="fas fa-lock"></i> Password
                    </label>
                    <input
                      type="password"
                      id="driver-password"
                      name="password"
                      value={driverLogin.password}
                      onChange={handleDriverLoginChange}
                      placeholder="Enter your password"
                      required
                      disabled={isDriverLoggingIn}
                    />
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="forgot-password">Forgot Password?</a>
                  </div>

                  <button type="submit" className="submit-btn" disabled={isDriverLoggingIn}>
                    {isDriverLoggingIn ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login as Driver
                        <i className="fas fa-sign-in-alt"></i>
                      </>
                    )}
                  </button>

                  <p className="form-footer">
                    Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); closeLoginModal(); handleSignupClick(e); }}>Sign up</a>
                  </p>
                </form>
              </>
            )}

            {loginView === 'student' && (
              <>
                <button className="back-btn" onClick={handleBackToSelect}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="modal-title">Student Login</h2>
                <p className="modal-subtitle">Welcome back! Please enter your details</p>

                <form className="login-form" onSubmit={handleStudentLoginSubmit}>
                  {studentLoginError && (
                    <div className="error-message" style={{ 
                      color: '#dc3545', 
                      background: 'rgba(220, 53, 69, 0.1)', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '8px', 
                      marginBottom: '1rem',
                      fontSize: '0.95rem',
                      textAlign: 'center'
                    }}>
                      <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
                      {studentLoginError}
                    </div>
                  )}
                  <div className="form-group">
                                        <label htmlFor="student-username">
                      <i className="fas fa-user-circle"></i>
                      Username
                    </label>
                    <input
                      type="text"
                      id="student-username"
                      name="username"
                      value={studentLogin.username}
                      onChange={handleStudentLoginChange}
                      placeholder="Enter your username"
                      required
                      disabled={isStudentLoggingIn}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-password">
                      <i className="fas fa-lock"></i> Password
                    </label>
                    <input
                      type="password"
                      id="student-password"
                      name="password"
                      value={studentLogin.password}
                      onChange={handleStudentLoginChange}
                      placeholder="Enter your password"
                      required
                      disabled={isStudentLoggingIn}
                    />
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="forgot-password">Forgot Password?</a>
                  </div>

                  <button type="submit" className="submit-btn" disabled={isStudentLoggingIn}>
                    {isStudentLoggingIn ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login as Student
                        <i className="fas fa-sign-in-alt"></i>
                      </>
                    )}
                  </button>

                  <p className="form-footer">
                    Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); closeLoginModal(); handleSignupClick(e); }}>Sign up</a>
                  </p>
                </form>
              </>
            )}

            {loginView === 'admin' && (
              <>
                <button className="back-btn" onClick={handleBackToSelect}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="modal-title">Admin Login</h2>
                <p className="modal-subtitle">Welcome back! Please enter your details</p>

                <form className="login-form" onSubmit={(e) => {
                  e.preventDefault();
                  closeLoginModal();
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
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-password">
                      <i className="fas fa-lock"></i> Password
                    </label>
                    <input
                      type="password"
                      id="admin-password"
                      placeholder="Enter your password"
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
                    Login as Admin
                    <i className="fas fa-sign-in-alt"></i>
                  </button>
                </form>
              </>
            )}
          </div>
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

                <form className="login-form signup-form-extended" onSubmit={handleDriverSignupSubmit}>
                  {/* Personal Details Section */}
                  <div className="form-section">
                    <h3 className="section-heading">
                      <i className="fas fa-user-circle"></i> Personal Details
                    </h3>
                    <div className="form-group">
                      <label htmlFor="driver-signup-name">
                        <i className="fas fa-user"></i> Full Name
                      </label>
                      <input
                        type="text"
                        id="driver-signup-name"
                        name="fullName"
                        value={driverSignup.fullName}
                        onChange={handleDriverSignupChange}
                        placeholder="Enter your full name"
                        required
                      />
                      {driverSignupErrors.fullName && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.fullName}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-signup-username">
                        <i className="fas fa-user-circle"></i> Username
                      </label>
                      <input
                        type="text"
                        id="driver-signup-username"
                        name="username"
                        value={driverSignup.username}
                        onChange={handleDriverSignupChange}
                        placeholder="Enter your username"
                        required
                      />
                      {driverSignupErrors.username && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.username}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-signup-phone">
                        <i className="fas fa-phone"></i> Phone Number
                      </label>
                      <input
                        type="tel"
                        id="driver-signup-phone"
                        name="phone"
                        value={driverSignup.phone}
                        onChange={handleDriverSignupChange}
                        placeholder="Enter your phone number"
                        required
                      />
                      {driverSignupErrors.phone && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.phone}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-signup-email">
                        <i className="fas fa-envelope"></i> Email Address
                      </label>
                      <input
                        type="email"
                        id="driver-signup-email"
                        name="email"
                        value={driverSignup.email}
                        onChange={handleDriverSignupChange}
                        placeholder="Enter your email"
                        required
                      />
                      {driverSignupErrors.email && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.email}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-signup-password">
                        <i className="fas fa-lock"></i> Password
                      </label>
                      <input
                        type="password"
                        id="driver-signup-password"
                        name="password"
                        value={driverSignup.password}
                        onChange={handleDriverSignupChange}
                        placeholder="Create a password"
                        required
                      />
                      {driverSignupErrors.password && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.password}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-signup-confirm-password">
                        <i className="fas fa-lock"></i> Confirm Password
                      </label>
                      <input
                        type="password"
                        id="driver-signup-confirm-password"
                        name="confirmPassword"
                        value={driverSignup.confirmPassword}
                        onChange={handleDriverSignupChange}
                        placeholder="Confirm your password"
                        required
                      />
                      {driverSignupErrors.confirmPassword && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.confirmPassword}</div>
                      )}
                    </div>
                  </div>

                  {/* License and Documents Section */}
                  <div className="form-section">
                    <h3 className="section-heading">
                      <i className="fas fa-id-card"></i> License & Documents
                    </h3>
                    <div className="form-group">
                      <label htmlFor="driver-license-number">
                        <i className="fas fa-id-badge"></i> Driver's License Number
                      </label>
                      <input
                        type="text"
                        id="driver-license-number"
                        name="licenseNumber"
                        value={driverSignup.licenseNumber}
                        onChange={handleDriverSignupChange}
                        placeholder="Enter your license number"
                        required
                      />
                      {driverSignupErrors.licenseNumber && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.licenseNumber}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-license-upload">
                        <i className="fas fa-upload"></i> Upload License
                      </label>
                      <input
                        type="file"
                        id="driver-license-upload"
                        name="licenseFile"
                        accept="image/*,.pdf"
                        onChange={handleDriverSignupChange}
                        required
                      />
                      {driverSignupErrors.licenseFile && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.licenseFile}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-vehicle-doc-upload">
                        <i className="fas fa-upload"></i> Upload Vehicle Document
                      </label>
                      <input
                        type="file"
                        id="driver-vehicle-doc-upload"
                        name="vehicleDocFile"
                        accept="image/*,.pdf"
                        onChange={handleDriverSignupChange}
                        required
                      />
                      {driverSignupErrors.vehicleDocFile && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.vehicleDocFile}</div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Details Section */}
                  <div className="form-section">
                    <h3 className="section-heading">
                      <i className="fas fa-car"></i> Vehicle Details
                    </h3>
                    <div className="form-group">
                      <label htmlFor="driver-vehicle-type">
                        <i className="fas fa-shuttle-van"></i> Vehicle Type
                      </label>
                      <select id="driver-vehicle-type" name="vehicleType" value={driverSignup.vehicleType} onChange={handleDriverSignupChange} required>
                        <option value="">Select vehicle type</option>
                        <option value="Bus">Bus</option>
                        <option value="Minibus">Minibus</option>
                      </select>
                      {driverSignupErrors.vehicleType && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.vehicleType}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-vehicle-number">
                        <i className="fas fa-hashtag"></i> Vehicle Number
                      </label>
                      <input
                        type="text"
                        id="driver-vehicle-number"
                        name="vehicleNumber"
                        value={driverSignup.vehicleNumber}
                        onChange={handleDriverSignupChange}
                        placeholder="Enter vehicle registration number"
                        required
                      />
                      {driverSignupErrors.vehicleNumber && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.vehicleNumber}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="driver-seats">
                        <i className="fas fa-chair"></i> Number of Seats
                      </label>
                      <input
                        type="number"
                        id="driver-seats"
                        name="seats"
                        value={driverSignup.seats}
                        onChange={handleDriverSignupChange}
                        placeholder="Enter number of seats"
                        min="1"
                        max="50"
                        required
                      />
                      {driverSignupErrors.seats && (
                        <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{driverSignupErrors.seats}</div>
                      )}
                                      {driverSignupErrors.general && (
                                        <div style={{ color: 'red', fontSize: '0.95rem', marginBottom: 8 }}>{driverSignupErrors.general}</div>
                                      )}
                    </div>
                  </div>

                  <button type="submit" className="submit-btn">
                    Create Driver Account
                    <i className="fas fa-user-plus"></i>
                  </button>

                  <p className="form-footer">
                    Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); closeSignupModal(); handleLoginClick(e); }}>Login</a>
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

                <form className="login-form signup-form-extended" onSubmit={handleStudentSignupSubmit}>
                  <div className="form-group">
                    <label htmlFor="username">
                      <i className="fas fa-user-circle"></i> Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={studentSignup.username}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fullName">
                      <i className="fas fa-user"></i> Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={studentSignup.fullName}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <i className="fas fa-envelope"></i> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={studentSignup.email}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mobile">
                      <i className="fas fa-phone"></i> Mobile
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      value={studentSignup.mobile}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter your mobile number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="university">
                      <i className="fas fa-university"></i> University
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={studentSignup.university}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter your university"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">
                      <i className="fas fa-home"></i> Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={studentSignup.address}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter your address"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">
                      <i className="fas fa-lock"></i> Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        name="password"
                        value={studentSignup.password}
                        onChange={handleStudentSignupChange}
                        placeholder="Create a password"
                        required
                        style={{ paddingRight: 36 }}
                      />
                      <span
                        onClick={() => setShowStudentPassword((v) => !v)}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          color: '#888',
                          fontSize: 18
                        }}
                        title={showStudentPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={showStudentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                      </span>
                    </div>
                    {studentPasswordError && (
                      <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>{studentPasswordError}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="guardianName">
                      <i className="fas fa-user"></i> Guardian Name
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      value={studentSignup.guardianName}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter guardian's name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="guardianEmail">
                      <i className="fas fa-envelope"></i> Guardian Email
                    </label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={studentSignup.guardianEmail}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter guardian's email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="guardianMobile">
                      <i className="fas fa-phone"></i> Guardian Mobile
                    </label>
                    <input
                      type="text"
                      name="guardianMobile"
                      value={studentSignup.guardianMobile}
                      onChange={handleStudentSignupChange}
                      placeholder="Enter guardian's mobile number"
                      required
                    />
                  </div>

                  <button type="submit" className="submit-btn">
                    Register as Student
                    <i className="fas fa-user-plus"></i>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}