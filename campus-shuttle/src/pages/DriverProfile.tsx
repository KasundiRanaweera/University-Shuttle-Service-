import React, { useState, useRef, useEffect } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DriverProfile = () => {
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState('/backgrounds/user.png');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    licenseNumber: '',
    vehicleType: 'Bus',
    vehicleNumber: '',
    seats: 0,
    emergencyContact: '',
    emergencyPhone: '',
    pickupLocation: ''
  });

  const [profileRef, profileVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });

  useEffect(() => {
    // Force visibility after a short delay to ensure component is rendered
    const timer = setTimeout(() => {
      if (profileRef.current && !profileVisible) {
        console.log('Forcing profile visibility');
        profileRef.current.classList.add('visible');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [profileVisible]);

  // Auto-dismiss save message after 4 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  useEffect(() => {
    const fetchDriverProfile = async () => {
      const sessionData = localStorage.getItem('driverSession');
      const isLoggedIn = localStorage.getItem('driverLoggedIn');
      
      console.log('DriverProfile: Checking auth...', { sessionData: !!sessionData, isLoggedIn });
      
      if (!sessionData && isLoggedIn !== 'true') {
        console.log('DriverProfile: Not logged in, redirecting to home');
        navigate('/');
        setIsLoading(false);
        return;
      }
      
      try {
        // IMMEDIATELY load cached data to show UI instantly (FAST LOAD)
        const cachedProfile = localStorage.getItem('driverProfileCache');
        if (cachedProfile) {
          try {
            const cached = JSON.parse(cachedProfile);
            setProfileData(cached.data);
            if (cached.image) {
              setProfileImage(cached.image);
            }
            setIsLoading(false); // Hide loading indicator immediately with cached data
          } catch (e) {
            console.error('Error parsing cache:', e);
          }
        }

        if (!sessionData) {
          setIsLoading(false);
          return;
        }
        const session = JSON.parse(sessionData);
        const userId = session.user.user_id;

        // Fetch from THREE tables in PARALLEL (while showing cached UI)
        const [userResult, driverResult, shuttleRouteResult] = await Promise.all([
          supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('driver')
            .select('*')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('shuttle_route')
            .select('start_location')
            .eq('driver_id', userId)
            .single()
        ]);

        const { data: userData, error: userError } = userResult;
        const { data: driverData, error: driverError } = driverResult;
        const { data: shuttleRouteData, error: shuttleRouteError } = shuttleRouteResult;

        if (userError) throw userError;
        if (driverError) throw driverError;
        // Note: shuttleRouteError is OK if there's no route yet

        // Update profile data from all tables
        const newProfileData = {
          fullName: userData?.full_name || '',
          username: userData?.username || '',
          email: userData?.email || '',
          phone: userData?.phone_no || '',
          licenseNumber: driverData?.license_no || '',
          vehicleType: driverData?.vehicle_type || 'Bus',
          vehicleNumber: driverData?.vehicle_number || '',
          seats: driverData?.number_of_seats || 0,
          emergencyContact: driverData?.emergency_contact || '',
          emergencyPhone: driverData?.emergency_phone || '',
          pickupLocation: shuttleRouteData?.start_location || ''
        };
        setProfileData(newProfileData);

        // Cache the profile data for next load
        let photoUrl = '';
        if (driverData?.driver_profile_photo) {
          setProfileImage(driverData.driver_profile_photo);
          photoUrl = driverData.driver_profile_photo;
        }
        
        localStorage.setItem('driverProfileCache', JSON.stringify({
          data: newProfileData,
          image: photoUrl,
          timestamp: Date.now()
        }));
        
        console.log('DriverProfile: Data loaded successfully');
        setIsLoading(false); // Ensure loading is hidden
      } catch (error: any) {
        console.error('Error fetching driver profile:', error?.message || error);
        // Show a user-friendly error and still allow the page to render
        setIsLoading(false); // Hide loading even on error
        setSaveMessage({
          text: 'Unable to load profile data, but you can still edit some fields.',
          type: 'error'
        });
      }
    };

    fetchDriverProfile();
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    localStorage.removeItem('driverSession');
    localStorage.removeItem('driverLoggedIn');
    localStorage.removeItem('driverProfileImage');
    localStorage.removeItem('driverProfileCache');
    navigate('/');
  };

  const handleEditField = (field: string) => {
    setEditingField(field);
  };

  const handleSaveField = async (field: string) => {
    try {
      const sessionData = localStorage.getItem('driverSession');
      if (!sessionData) {
        setSaveMessage({
          text: '⚠ Session expired. Please login again.',
          type: 'error'
        });
        return;
      }

      const session = JSON.parse(sessionData);
      const userId = session.user.user_id;

      // Validate that field is not empty
      const fieldValue = profileData[field as keyof typeof profileData];
      if (!fieldValue || fieldValue === '') {
        setSaveMessage({
          text: '⚠ Please enter a value before saving',
          type: 'error'
        });
        return;
      }

      // Determine which table to update
      let updateData: any = {};
      if (field === 'fullName') {
        updateData = { full_name: profileData.fullName };
      } else if (field === 'email') {
        updateData = { email: profileData.email };
      } else if (field === 'phone') {
        updateData = { phone_no: profileData.phone };
      } else if (field === 'username') {
        updateData = { username: profileData.username };
      } else if (field === 'pickupLocation') {
        updateData = { start_location: profileData.pickupLocation };
      }

      // Update users table for user-specific fields
      if (['fullName', 'email', 'phone', 'username'].includes(field)) {
        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('user_id', userId);
        
        if (error) {
          console.error('Users table error:', error);
          throw new Error(`Failed to update: ${error.message}`);
        }
        console.log(`✓ ${field} updated in database`);
      }

      // Update shuttle_route table for pickup location (start_location)
      if (field === 'pickupLocation') {
        const { error } = await supabase
          .from('shuttle_route')
          .update(updateData)
          .eq('driver_id', userId);
        
        if (error) {
          console.error('Shuttle_route table error:', error);
          throw new Error(`Failed to update: ${error.message}`);
        }
        console.log(`✓ ${field} updated in shuttle_route table`);
      }

      setEditingField(null);
      
      // Update cache with new profile data
      const cachedProfile = localStorage.getItem('driverProfileCache');
      if (cachedProfile) {
        try {
          const cached = JSON.parse(cachedProfile);
          cached.data = profileData;
          cached.timestamp = Date.now();
          localStorage.setItem('driverProfileCache', JSON.stringify(cached));
        } catch (e) {
          console.error('Error updating cache:', e);
        }
      }
      setSaveMessage({
        text: '✓ Changes saved successfully!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error saving field:', error);
      const errorMsg = error?.message || 'Unknown error occurred';
      setSaveMessage({
        text: `✗ ${errorMsg}`,
        type: 'error'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = () => {
    // If image fails to load, we'll show the avatar fallback
    setProfileImage('');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', paddingTop: '80px' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="driver-profile-page">
      <div className="dashboard-wrapper">
        {/* Profile Section */}
        <div ref={profileRef} className={`profile-section fade-up ${(profileVisible || !isLoading) ? 'visible' : ''}`}>
          <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="section-title">Driver Profile</h2>
            <button 
              type="button"
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>

          <div className="profile-content">
            <div className="profile-image-section">
              <div className="profile-image-container">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Driver Profile"
                    className="profile-image"
                    onClick={handleImageClick}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="profile-avatar" onClick={handleImageClick}>
                    <span className="avatar-initials">{getInitials(profileData.fullName)}</span>
                  </div>
                )}
                <div className="image-overlay" onClick={handleImageClick}>
                  <i className="fas fa-camera"></i>
                  <span>Change Photo</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              <h3 className="driver-name">{profileData.fullName}</h3>
              <p className="driver-status">Active Driver</p>
            </div>

            <div className="profile-details">
              <div className="info-section">
                <h4>Personal Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name</label>
                    {editingField === 'fullName' ? (
                      <div className="edit-field">
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                        />
                        <div className="field-actions">
                          <button type="button" className="save-field-btn" onClick={() => handleSaveField('fullName')}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button type="button" className="cancel-field-btn" onClick={handleCancelEdit}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="display-field">
                        <span>{profileData.fullName}</span>
                        <button type="button" className="edit-field-btn" onClick={() => handleEditField('fullName')}>
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>Email Address</label>
                    {editingField === 'email' ? (
                      <div className="edit-field">
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                        <div className="field-actions">
                          <button className="save-field-btn" onClick={() => handleSaveField('email')}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="cancel-field-btn" onClick={handleCancelEdit}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="display-field">
                        <span>{profileData.email}</span>
                        <button className="edit-field-btn" onClick={() => handleEditField('email')}>
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>Phone Number</label>
                    {editingField === 'phone' ? (
                      <div className="edit-field">
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                        <div className="field-actions">
                          <button className="save-field-btn" onClick={() => handleSaveField('phone')}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="cancel-field-btn" onClick={handleCancelEdit}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="display-field">
                        <span>{profileData.phone}</span>
                        <button className="edit-field-btn" onClick={() => handleEditField('phone')}>
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>Username</label>
                    {editingField === 'username' ? (
                      <div className="edit-field">
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                        />
                        <div className="field-actions">
                          <button className="save-field-btn" onClick={() => handleSaveField('username')}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="cancel-field-btn" onClick={handleCancelEdit}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="display-field">
                        <span>{profileData.username}</span>
                        <button className="edit-field-btn" onClick={() => handleEditField('username')}>
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>License & Vehicle Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Driver's License Number</label>
                    <div className="display-field readonly">
                      <span>{profileData.licenseNumber}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Vehicle Type</label>
                    <div className="display-field readonly">
                      <span>{profileData.vehicleType}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Vehicle Number</label>
                    <div className="display-field readonly">
                      <span>{profileData.vehicleNumber}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <label>Number of Seats</label>
                    <div className="display-field readonly">
                      <span>{profileData.seats} seats</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>Shuttle Route Location</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Pickup Location / Route Name</label>
                    {editingField === 'pickupLocation' ? (
                      <div className="edit-field">
                        <input
                          type="text"
                          value={profileData.pickupLocation}
                          onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                          placeholder="e.g., Rajagiriya, Nugegoda"
                        />
                        <div className="field-actions">
                          <button type="button" className="save-field-btn" onClick={() => handleSaveField('pickupLocation')}>
                            <i className="fas fa-check"></i>
                          </button>
                          <button type="button" className="cancel-field-btn" onClick={handleCancelEdit}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="display-field">
                        <span>{profileData.pickupLocation || 'Not set'}</span>
                        <button type="button" className="edit-field-btn" onClick={() => handleEditField('pickupLocation')}>
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {saveMessage && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: saveMessage.type === 'success' ? '#2e7d32' : '#c62828',
                  backgroundColor: saveMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
                  border: `1px solid ${saveMessage.type === 'success' ? '#4caf50' : '#f44336'}`,
                  animation: 'fadeIn 0.3s ease-in'
                }}>
                  {saveMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .driver-profile-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 20px;
          margin-top: 80px;
        }

        .dashboard-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-section {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin-bottom: 30px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }

        .profile-section.fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .profile-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .section-title {
          color: #2d3748;
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .profile-content {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 40px;
          align-items: start;
        }

        .profile-image-section {
          text-align: center;
        }

        .profile-image-container {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto 20px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .profile-image-container:hover {
          border-color: #8417BA;
          transform: scale(1.05);
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 3rem;
          font-weight: 700;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          color: white;
        }

        .profile-image-container:hover .image-overlay {
          opacity: 1;
        }

        .image-overlay i {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .driver-name {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 5px 0;
        }

        .driver-status {
          color: #48bb78;
          font-weight: 600;
          margin: 0;
          font-size: 0.9rem;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .info-section h4 {
          color: #2d3748;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .info-item {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .info-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .info-item label {
          display: block;
          color: #718096;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .display-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .display-field span {
          color: #2d3748;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .edit-field-btn {
          background: none;
          border: none;
          color: #718096;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 0.8rem;
        }

        .edit-field-btn:hover {
          background: #e2e8f0;
          color: #4a5568;
        }

        .edit-field {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .edit-field input,
        .edit-field select {
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .edit-field input:focus,
        .edit-field select:focus {
          outline: none;
          border-color: #8417BA;
          box-shadow: 0 0 0 3px rgba(132, 23, 186, 0.1);
        }

        .field-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .save-field-btn {
          background: #48bb78;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background-color 0.2s ease;
        }

        .save-field-btn:hover {
          background: #38a169;
        }

        .cancel-field-btn {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background-color 0.2s ease;
        }

        .cancel-field-btn:hover {
          background: #c53030;
        }

        @media (max-width: 768px) {
          .driver-profile-page {
            padding: 15px;
            margin-top: 70px;
          }

          .profile-section {
            padding: 20px;
          }

          .profile-content {
            grid-template-columns: 1fr;
            gap: 30px;
            text-align: center;
          }

          .profile-image-container {
            width: 150px;
            height: 150px;
          }

          .section-title {
            font-size: 2rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .info-item {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default DriverProfile;