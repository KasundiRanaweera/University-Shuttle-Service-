
/// <reference types="styled-jsx" />

import React, { useState, useEffect } from 'react';


import { useNavigate } from 'react-router-dom';
import GoogleMapsLocationPicker from '../components/GoogleMapsLocationPicker';
import RouteInfo from '../components/RouteInfo';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { NSBM_GREEN_UNIVERSITY } from '../utils/locations';
import { supabase } from '../supabaseClient';



interface Seat {
  id: number;
  occupied: boolean;
  passengerName?: string;
  parentName?: string;
  parentPhone?: string;
  studentId?: string;
  pickupLocation?: string;
}

interface DriverSession {
  user: {
    user_id: string;
    username: string;
    email: string;
    phone_no: string;
    full_name: string;
    role: string;
  };
  driver: {
    user_id: string;
    license_no: string;
    license_document: string;
    vehicle_document: string;
    vehicle_type: string;
    vehicle_number: string;
    number_of_seats: number;
    driver_profile_photo: string | null;
  } | null;
}

const DriverDashboard = () => {
  // Google Map link state
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [linkTouched, setLinkTouched] = useState(false);
    // Fix: Add missing state for today's bookings
    const [todaysBookings, setTodaysBookings] = useState<{ student_name: string; pickup_location: string }[]>([]);
  const navigate = useNavigate();
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null);
  const [startLocation, setStartLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load driver session from localStorage and fetch start location
  useEffect(() => {
    const sessionData = localStorage.getItem('driverSession');
    const isLoggedIn = localStorage.getItem('driverLoggedIn');
    
    if (!sessionData || isLoggedIn !== 'true') {
      // Not logged in, redirect to home
      navigate('/');
      return;
    }
    
    try {
      const session = JSON.parse(sessionData) as DriverSession;
      setDriverSession(session);
      
      // Fetch start_location from shuttle_route table
      const fetchStartLocation = async () => {
        try {
          const { data, error } = await supabase
            .from('shuttle_route')
            .select('start_location')
            .eq('driver_id', session.user.user_id)
            .single();
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
          }
          
          if (data?.start_location) {
            setStartLocation(data.start_location);
          }
        } catch (error) {
          console.error('Error fetching start location:', error);
        }
      };
      
      fetchStartLocation();
    } catch (error) {
      console.error('Error parsing driver session:', error);
      navigate('/');
    }
    
    setIsLoading(false);
  }, [navigate]);
  // Mock data - in real app this would come from API/database
  const [busRoute] = useState({
    busNumber: 'BUS 101'
  });


  // Fetch today's bookings: student name and pickup location only
  useEffect(() => {
    const fetchTodaysBookings = async () => {
      try {
        const sessionData = localStorage.getItem('driverSession');
        if (!sessionData) return;
        const session = JSON.parse(sessionData);
        // Get the latest route for this driver
        const { data: routeData, error: routeError } = await supabase
          .from('shuttle_route')
          .select('shuttle_route_id')
          .eq('driver_id', session.user.user_id)
          .order('shuttle_route_id', { ascending: false })
          .limit(1)
          .single();
        if (routeError || !routeData) return;
        const today = new Date().toISOString().slice(0, 10);
        // Get bookings for today for this route
        const { data: bookings, error: bookingsError } = await supabase
          .from('booking')
          .select('student_id, pickup_location')
          .eq('shuttle_route_id', routeData.shuttle_route_id)
          .eq('trip_date', today);
        if (bookingsError || !bookings) {
          setTodaysBookings([]);
          return;
        }
        // For each booking, fetch student name from users table
        const bookingsWithNames = await Promise.all(
          bookings.map(async (b: any) => {
            let student_name = '';
            if (b.student_id) {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('full_name')
                .eq('user_id', b.student_id)
                .single();
              if (!userError && userData) {
                student_name = userData.full_name || '';
              }
            }
            return {
              student_name,
              pickup_location: b.pickup_location || '',
            };
          })
        );
        setTodaysBookings(bookingsWithNames);
      } catch (err) {
        setTodaysBookings([]);
      }
    };
    fetchTodaysBookings();
  }, []);

  // Dynamic seat logic
  const [totalSeats, setTotalSeats] = useState(0);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);

  // Fetch seat count from driver table and booked seats for this driver's shuttle
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const sessionData = localStorage.getItem('driverSession');
        if (!sessionData) return;
        const session = JSON.parse(sessionData);
        // Get seat count from driver table
        const { data: driverData, error: driverError } = await supabase
          .from('driver')
          .select('number_of_seats')
          .eq('user_id', session.user.user_id)
          .single();
        if (driverError || !driverData) return;
        setTotalSeats(driverData.number_of_seats);
        // Get the latest route for this driver
        const { data: routeData, error: routeError } = await supabase
          .from('shuttle_route')
          .select('shuttle_route_id')
          .eq('driver_id', session.user.user_id)
          .order('shuttle_route_id', { ascending: false }) // fixed: order by correct column
          .limit(1)
          .single();
        if (routeError || !routeData) return;
        // Get booked seats for today for this route from booking_seat table
        const today = new Date().toISOString().slice(0, 10);
        console.log('DriverDashboard DEBUG:', {
          routeId: routeData.shuttle_route_id,
          today
        });
        const { data: seatData, error: seatError } = await supabase
          .from('booking_seat')
          .select('seat_number')
          .eq('shuttle_route_id', routeData.shuttle_route_id)
          .eq('trip_date', today);
        console.log('DriverDashboard seatData:', seatData, 'seatError:', seatError);
        if (!seatError && seatData) {
          setBookedSeats(seatData.map((row: any) => Number(row.seat_number)));
        } else {
          setBookedSeats([]);
        }
      } catch (err) {
        console.error('Error fetching seat data:', err);
      }
    };
    fetchSeats();
  }, []);

  const occupiedSeats = bookedSeats.length;

  // Modal state
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showRiderTracking, setShowRiderTracking] = useState(false);

  // SOS and Bus Status state
  const [showSOSDropdown, setShowSOSDropdown] = useState(false);
  const [selectedEmergencyReason, setSelectedEmergencyReason] = useState<string>('');
  const [busAvailable, setBusAvailable] = useState(true);

  // Route Form state - simplified for NSBM only
  const [routeForm, setRouteForm] = useState({
    startLocation: '',
    endLocation: 'NSBM Green University',
    startLat: 0,
    startLng: 0,
    endLat: NSBM_GREEN_UNIVERSITY.lat,
    endLng: NSBM_GREEN_UNIVERSITY.lng,
    departureTime: '',
    arrivalTime: '',
  });

  // GPS Tracking hook
  const { location, isTracking, error, startTracking, stopTracking } = useLocationTracking();

  // Location tracking status message
  const [trackingMessage, setTrackingMessage] = useState('');

  // Save message state
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss save message after 4 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Auto-set driver's location as start location and NSBM as end
  useEffect(() => {
    if (isTracking && location) {
      setRouteForm(prev => ({
        ...prev,
        startLocation: 'Your Current Location',
        startLat: location.lat,
        startLng: location.lng,
      }));
      setTrackingMessage(`🟢 TRIP ACTIVE - Heading to NSBM (Accuracy: ${location.accuracy?.toFixed(1)}m)`);
    } else if (!isTracking) {
      setRouteForm(prev => ({
        ...prev,
        startLocation: '',
        startLat: 0,
        startLng: 0,
      }));
      setTrackingMessage('');
    }
  }, [isTracking, location]);

  // Show error message
  useEffect(() => {
    if (error) {
      setTrackingMessage(`⚠️ Location Error: ${error}`);
    }
  }, [error]);

  const handleToggleTracking = async () => {
    setLinkTouched(true);
    const sessionData = localStorage.getItem('driverSession');
    if (!sessionData) {
      setTrackingMessage('⚠️ Session expired. Please login again.');
      return;
    }
    const session = JSON.parse(sessionData);
    // Get the latest route for this driver
    const { data: routeData, error: routeError } = await supabase
      .from('shuttle_route')
      .select('shuttle_route_id')
      .eq('driver_id', session.user.user_id)
      .order('shuttle_route_id', { ascending: false })
      .limit(1)
      .single();
    if (routeError || !routeData) {
      setTrackingMessage('⚠️ Could not find your current route.');
      return;
    }
    const routeId = routeData.shuttle_route_id;
    if (!isTracking) {
      if (!googleMapLink.trim()) {
        setTrackingMessage('⚠️ Please enter the Google Map live location link before starting the trip.');
        return;
      }
      // Save the link to live_location
      const { error: updateError } = await supabase
        .from('shuttle_route')
        .update({ live_location: googleMapLink.trim() })
        .eq('shuttle_route_id', routeId);
      if (updateError) {
        setTrackingMessage('⚠️ Failed to save live location link.');
        return;
      }
      setTrackingMessage('📍 Starting trip...');
      startTracking();
    } else {
      // Clear the live_location link
      const { error: clearError } = await supabase
        .from('shuttle_route')
        .update({ live_location: null })
        .eq('shuttle_route_id', routeId);
      if (clearError) {
        setTrackingMessage('⚠️ Failed to clear live location link.');
        return;
      }
      stopTracking();
      setTrackingMessage('');
    }
  };

  const handleSaveTimes = async () => {
    try {
      if (!routeForm.departureTime && !routeForm.arrivalTime) {
        setSaveMessage({
          text: '⚠ Please enter at least departure or arrival time',
          type: 'error'
        });
        return;
      }

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
      const busNumber = driverSession?.driver?.vehicle_number || '';
      const totalSeats = driverSession?.driver?.number_of_seats || 0;

      // Calculate duration in minutes between departure and arrival
      let durationMinutes = 0;
      if (routeForm.departureTime && routeForm.arrivalTime) {
        const [depHour, depMin] = routeForm.departureTime.split(':').map(Number);
        const [arrHour, arrMin] = routeForm.arrivalTime.split(':').map(Number);
        const depTotalMin = depHour * 60 + depMin;
        const arrTotalMin = arrHour * 60 + arrMin;
        durationMinutes = arrTotalMin >= depTotalMin ? arrTotalMin - depTotalMin : 1440 - depTotalMin + arrTotalMin;
      }


      // Check if route exists for this bus number
      const { data: existingRoute, error: checkError } = await supabase
        .from('shuttle_route')
        .select('shuttle_route_id')
        .eq('bus_number', busNumber)
        .single();

      let routeError = null;
      if (existingRoute) {
        // Update only the times and related fields
        const { error } = await supabase
          .from('shuttle_route')
          .update({
            departure_time: routeForm.departureTime || '00:00',
            arrival_time: routeForm.arrivalTime || '00:00',
            duration_minutes: durationMinutes || 60
          })
          .eq('bus_number', busNumber);
        routeError = error;
      } else {
        // Insert new route
        const { error } = await supabase
          .from('shuttle_route')
          .insert({
            bus_number: busNumber,
            start_location: routeForm.startLocation || 'Starting Point',
            end_location: routeForm.endLocation || 'Destination',
            departure_time: routeForm.departureTime || '00:00',
            arrival_time: routeForm.arrivalTime || '00:00',
            duration_minutes: durationMinutes || 60,
            number_of_stops: 1,
            total_seats: totalSeats || 50,
            price_per_seat: 0,
            status: isTracking ? 'Available' : 'Available',
            driver_id: userId
          });
        routeError = error;
      }

      if (routeError) {
        console.error('shuttle_route table error:', routeError);
        throw new Error(`Failed to save route: ${routeError.message}`);
      }

      setSaveMessage({
        text: '✓ Times saved successfully!',
        type: 'success'
      });
      
      console.log('Route saved:', {
        busNumber: busNumber,
        driverId: userId,
        departureTime: routeForm.departureTime,
        arrivalTime: routeForm.arrivalTime,
        startLocation: routeForm.startLocation,
        endLocation: routeForm.endLocation,
        durationMinutes: durationMinutes,
        totalSeats: totalSeats
      });
    } catch (error: any) {
      console.error('Error saving times:', error);
      const errorMsg = error?.message || 'Unknown error occurred';
      setSaveMessage({
        text: `✗ Error: ${errorMsg}`,
        type: 'error'
      });
    }
  };

  // Fetch and show student/parent details for a booked seat
  const handleSeatClick = async (seat: Seat) => {
    if (!seat.occupied) {
      setSelectedSeat(seat);
      setShowSeatModal(true);
      return;
    }
    try {
      // Get today's date and latest route id
      const today = new Date().toISOString().slice(0, 10);
      const sessionData = localStorage.getItem('driverSession');
      if (!sessionData) return;
      const session = JSON.parse(sessionData);
      const { data: routeData, error: routeError } = await supabase
        .from('shuttle_route')
        .select('shuttle_route_id')
        .eq('driver_id', session.user.user_id)
        .order('shuttle_route_id', { ascending: false })
        .limit(1)
        .single();
      if (routeError || !routeData) return;
      // Find booking_seat for this seat
      const { data: seatRows, error: seatRowsError } = await supabase
        .from('booking_seat')
        .select('booking_id')
        .eq('shuttle_route_id', routeData.shuttle_route_id)
        .eq('trip_date', today)
        .eq('seat_number', seat.id)
        .limit(1);
      if (seatRowsError || !seatRows || seatRows.length === 0) {
        setSelectedSeat(seat);
        setShowSeatModal(true);
        return;
      }
      const bookingId = seatRows[0].booking_id;
      // Fetch booking and student info
      const { data: bookingData, error: bookingError } = await supabase
        .from('booking')
        .select('student_id, pickup_location')
        .eq('booking_id', bookingId)
        .single();
      let studentId = bookingData?.student_id || '';
      let pickupLocation = bookingData?.pickup_location || '';
      let studentName = '';
      let parentName = '';
      let parentPhone = '';
      if (studentId) {
        // Get parent info from student table
        const { data: studentData, error: studentError } = await supabase
          .from('student')
          .select('parent_name, parent_phone_no')
          .eq('user_id', studentId)
          .single();
        if (!studentError && studentData) {
          parentName = studentData.parent_name || '';
          parentPhone = studentData.parent_phone_no || '';
        }
        // Get student full name from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name')
          .eq('user_id', studentId)
          .single();
        if (!userError && userData) {
          studentName = userData.full_name || '';
        }
      }
      setSelectedSeat({
        ...seat,
        passengerName: studentName,
        pickupLocation,
        parentName: parentName,
        parentPhone: parentPhone,
      });
      setShowSeatModal(true);
    } catch (err) {
      setSelectedSeat(seat);
      setShowSeatModal(true);
    }
  };

  const closeSeatModal = () => {
    setShowSeatModal(false);
    setSelectedSeat(null);
  };

  const handleSOSClick = () => {
    setShowSOSDropdown(!showSOSDropdown);
  };

  const handleEmergencyReasonSelect = (reason: string) => {
    setSelectedEmergencyReason(reason);
  };

  const [sosSuccess, setSosSuccess] = useState(false);
  const handleReportEmergency = async () => {
    try {
      const sessionData = localStorage.getItem('driverSession');
      if (!sessionData) {
        alert('Session expired. Please login again.');
        return;
      }
      const session = JSON.parse(sessionData);
      // Get latest route for this driver
      const { data: routeData, error: routeError } = await supabase
        .from('shuttle_route')
        .select('shuttle_route_id')
        .eq('driver_id', session.user.user_id)
        .order('shuttle_route_id', { ascending: false })
        .limit(1)
        .single();
      if (routeError || !routeData) {
        alert('Could not find your current route.');
        return;
      }
      // Insert emergency report
      const emergencyTypeMap = {
        tire_punch: 'TIRE_PUNCH',
        engine_issue: 'ENGINE_ISSUE',
        medical: 'MEDICAL_EMERGENCY',
        accident: 'ACCIDENT',
        other: 'OTHER',
      };
      const emergencyType = emergencyTypeMap[selectedEmergencyReason as keyof typeof emergencyTypeMap] || 'OTHER';
      const locationName = startLocation || 'Unknown Location';
      const { error: insertError } = await supabase
        .from('emergency_report')
        .insert({
          emergency_type: emergencyType,
          location_name: locationName,
          description: '',
          driver_id: session.user.user_id,
          shuttle_route_id: routeData.shuttle_route_id,
        });
      if (insertError) {
        alert('Failed to report emergency: ' + insertError.message);
      } else {
        setSosSuccess(true);
        setTimeout(() => setSosSuccess(false), 2500);
      }
    } catch (err) {
      alert('An error occurred while reporting the emergency.');
    }
    setShowSOSDropdown(false);
    setSelectedEmergencyReason('');
  };

  const toggleBusStatus = () => {
    setBusAvailable(!busAvailable);
  };

  // Render seat boxes like student dashboard
  const renderSeat = (seatNumber: number) => {
    const isBooked = bookedSeats.includes(seatNumber);
    let seatClass = 'seat';
    if (isBooked) seatClass += ' booked';
    else seatClass += ' available';
    // Pass seat object to click handler
    return (
      <div
        key={seatNumber}
        className={seatClass}
        title={isBooked ? 'Booked (Red)' : 'Available (Green)'}
        style={{ cursor: 'pointer' }}
        onClick={() => handleSeatClick({ id: seatNumber, occupied: isBooked })}
      >
        {seatNumber}
      </div>
    );
  };

  return (
    <>
      <div className="driver-dashboard" style={{ background: '#f5f3ff', minHeight: '100vh', padding: 0, marginTop: '6rem' }}>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading...</p>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Driver Dashboard</h1>
          <div className="bus-info">
            <h2>Welcome, {driverSession?.user?.full_name}</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              <i className='fas fa-bus' style={{ color: '#8417BA', marginRight: 6 }}></i>
              {driverSession?.driver?.vehicle_number || busRoute.busNumber}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`bus-status-btn ${busAvailable ? 'available' : 'unavailable'}`}
            onClick={toggleBusStatus}
          >
            <i className='fas fa-circle' style={{ color: busAvailable ? '#4CAF50' : '#f44336', marginRight: 6 }}></i>
            {busAvailable ? 'Available' : 'Not Available'}
          </button>
          <div className="sos-container">
            <button
              className='sos-btn'
              onClick={handleSOSClick}
            >
              <i className='fas fa-exclamation-triangle' style={{ marginRight: 6 }}></i>SOS
            </button>
            {showSOSDropdown && (
              <div className="sos-dropdown">
                <h4>Select Emergency Type:</h4>
                <div className="emergency-options">
                  <button
                    className={`emergency-option ${selectedEmergencyReason === 'tire_punch' ? 'selected' : ''}`}
                    onClick={() => handleEmergencyReasonSelect('tire_punch')}
                  >
                    🛞 Tire Punch
                  </button>
                  <button
                    className={`emergency-option ${selectedEmergencyReason === 'engine_issue' ? 'selected' : ''}`}
                    onClick={() => handleEmergencyReasonSelect('engine_issue')}
                  >
                    ⚙️ Engine Issue
                  </button>
                  <button
                    className={`emergency-option ${selectedEmergencyReason === 'medical' ? 'selected' : ''}`}
                    onClick={() => handleEmergencyReasonSelect('medical')}
                  >
                    🚑 Medical Emergency
                  </button>
                  <button
                    className={`emergency-option ${selectedEmergencyReason === 'accident' ? 'selected' : ''}`}
                    onClick={() => handleEmergencyReasonSelect('accident')}
                  >
                    💥 Accident
                  </button>
                  <button
                    className={`emergency-option ${selectedEmergencyReason === 'other' ? 'selected' : ''}`}
                    onClick={() => handleEmergencyReasonSelect('other')}
                  >
                    ⚠️ Other Emergency
                  </button>
                </div>
                {selectedEmergencyReason && (
                  <button
                    className="report-emergency-btn"
                    onClick={handleReportEmergency}
                  >
                    📞 Report Emergency
                  </button>
                )}
              </div>
            )}
          </div>
          {sosSuccess && (
            <div style={{ color: '#4CAF50', fontWeight: 600, margin: '0.5rem 0 0.5rem 0', fontSize: '1.1rem', textAlign: 'center' }}>
              Emergency successfully reported!
            </div>
          )}
          <div className="status-badge">
            <span className='live-indicator' style={{ color: '#f44336', marginRight: 6 }}><i className='fas fa-circle'></i></span>
            LIVE TRACKING
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* New Section: Today's Bookings */}
        <div className="todays-bookings-section" style={{ marginBottom: '2rem', background: '#f9f9f9', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 style={{ marginBottom: '1rem', color: '#8417BA', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className='fas fa-calendar-check' style={{ color: '#8417BA' }}></i>
            Today's Bookings
          </h2>
          {todaysBookings.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No bookings for today.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '6px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#e3f2fd' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Student Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Pickup Location</th>
                </tr>
              </thead>
              <tbody>
                {todaysBookings.map((b, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.7rem 0.75rem' }}>{b.student_name}</td>
                    <td style={{ padding: '0.7rem 0.75rem' }}>{b.pickup_location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Left Panel - Route Management, Bus Status & Seats */}
        <div className="left-panel" style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 4px 24px 0 rgba(132,23,186,0.08)', padding: '2rem 1.5rem', margin: '0 1.5rem 2rem 0', border: '1px solid #ede7f6' }}>
          {/* Route Form Card */}
          <div className="route-form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}><i className='fas fa-route' style={{ color: '#8417BA', marginRight: 8 }}></i>Route Management</h3>
              <button
                type="button"
                className={`location-tracking-btn ${isTracking ? 'active' : ''}`}
                onClick={handleToggleTracking}
                title={isTracking ? 'Click to stop location tracking' : 'Click to start GPS tracking'}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: isTracking ? '#4CAF50' : '#E0E0E0',
                  color: isTracking ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  boxShadow: isTracking ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'
                }}
              >
                {isTracking ? <><i className='fas fa-location-arrow' style={{ color: '#4CAF50', marginRight: 6 }}></i>Tracking ON</> : <><i className='fas fa-location-arrow' style={{ color: '#888', marginRight: 6 }}></i>Turn On Location</>}
              </button>
            </div>

            {/* Tracking Status Message */}
            {trackingMessage && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                backgroundColor: error ? '#FFE0E0' : '#E8F5E9',
                color: error ? '#C33' : '#2E7D32',
                fontSize: '0.9rem',
                border: `1px solid ${error ? '#F5B6B6' : '#81C784'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {trackingMessage}
                {isTracking && location && (
                  <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    (Accuracy: {location.accuracy?.toFixed(1)}m)
                  </span>
                )}
              </div>
            )}

            {/* Trip Control Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}><i className='fas fa-clock' style={{ color: '#8417BA', marginRight: 4 }}></i>Departure Time</label>
                <input
                  type="time"
                  value={routeForm.departureTime}
                  onChange={(e) => setRouteForm(prev => ({ ...prev, departureTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #DDD',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}><i className='fas fa-clock' style={{ color: '#8417BA', marginRight: 4 }}></i>Arrival Time</label>
                <input
                  type="time"
                  value={routeForm.arrivalTime}
                  onChange={(e) => setRouteForm(prev => ({ ...prev, arrivalTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #DDD',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>


            <button
              type="button"
              onClick={handleSaveTimes}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2196F3',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
            >
              <i className='fas fa-save' style={{ marginRight: 8 }}></i>Save Times to Database
            </button>

            
  


            {saveMessage && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '500',
                color: saveMessage.type === 'success' ? '#2e7d32' : '#c62828',
                backgroundColor: saveMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
                border: `1px solid ${saveMessage.type === 'success' ? '#4caf50' : '#f44336'}`,
                animation: 'fadeIn 0.3s ease-in'
              }}>
                {saveMessage.text}
              </div>
            )}


            {/* Google Map Link Input */}
            <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
              <label htmlFor="googleMapLink" style={{ fontSize: '0.95rem', color: '#666', fontWeight: 500, display: 'block', marginBottom: '0.3rem' }}>
                <i className='fas fa-link' style={{ color: '#8417BA', marginRight: 4 }}></i>
                Google Map Live Location Link <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="googleMapLink"
                type="url"
                placeholder="Paste Google Map live location link here"
                value={googleMapLink}
                onChange={e => setGoogleMapLink(e.target.value)}
                onBlur={() => setLinkTouched(true)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '6px',
                  border: linkTouched && !googleMapLink.trim() ? '1.5px solid #f44336' : '1px solid #DDD',
                  fontSize: '0.97rem',
                  boxSizing: 'border-box',
                  marginBottom: linkTouched && !googleMapLink.trim() ? '0.2rem' : 0
                }}
                required
              />
              {linkTouched && !googleMapLink.trim() && (
                <div style={{ color: '#f44336', fontSize: '0.88rem', marginTop: '0.1rem' }}>
                  Please enter the Google Map live location link to start the trip.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="start-trip-btn"
                onClick={handleToggleTracking}
                disabled={isTracking || !googleMapLink.trim()}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isTracking || !googleMapLink.trim() ? '#E0E0E0' : '#4CAF50',
                  color: isTracking || !googleMapLink.trim() ? '#999' : 'white',
                  cursor: isTracking || !googleMapLink.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                }}
              >
                <i className='fas fa-play' style={{ marginRight: 8 }}></i>START TRIP
              </button>
              <button
                type="button"
                className="end-trip-btn"
                onClick={handleToggleTracking}
                disabled={!isTracking}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: !isTracking ? '#E0E0E0' : '#F44336',
                  color: !isTracking ? '#999' : 'white',
                  cursor: !isTracking ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                }}
              >
                <i className='fas fa-stop' style={{ marginRight: 8 }}></i>END TRIP
              </button>
            </div>

            {/* Shuttle Route Information */}
            <div className="shuttle-route-section" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.1rem', color: '#333' }}><i className='fas fa-bus-alt' style={{ color: '#8417BA', marginRight: 8 }}></i>Shuttle Route</h3>
              <div style={{
                padding: '1rem',
                backgroundColor: '#FFF3E0',
                borderRadius: '8px',
                borderLeft: '4px solid #FF9800'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-bus' style={{ color: '#8417BA', marginRight: 4 }}></i>Bus Number:</h4>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{driverSession?.driver?.vehicle_number || busRoute.busNumber}</p>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-user' style={{ color: '#8417BA', marginRight: 4 }}></i>Driver:</h4>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{driverSession?.user?.full_name || 'Not set'}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-map-marker-alt' style={{ color: '#D32F2F', marginRight: 4 }}></i>START POINT:</h4>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem', color: '#D32F2F' }}>
                      {startLocation || '📍 Not set in profile'}
                    </p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                      (Edit in Driver Profile)
                    </p>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-flag-checkered' style={{ color: '#388E3C', marginRight: 4 }}></i>DESTINATION:</h4>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem', color: '#388E3C' }}>
                      NSBM Green University
                    </p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                      {NSBM_GREEN_UNIVERSITY.lat.toFixed(4)}, {NSBM_GREEN_UNIVERSITY.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.8rem', 
                  backgroundColor: '#E8F5E9', 
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  color: '#2E7D32'
                }}>
                  <i className='fas fa-info-circle' style={{ color: '#8417BA', marginRight: 6 }}></i>
                  Students will see this shuttle available from <strong>{busRoute?.busNumber || 'your start location'}</strong> to <strong>NSBM Green University</strong>
                </div>
              </div>
            </div>

            {/* Trip Information Display */}
            {isTracking && routeForm.startLocation && routeForm.endLocation && (
              <div className="route-info-section" style={{ marginTop: '1.5rem' }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#F0F8FF',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196F3'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-map-marker-alt' style={{ color: '#8417BA', marginRight: 4 }}></i>FROM:</h4>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{routeForm.startLocation}</p>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-flag-checkered' style={{ color: '#388E3C', marginRight: 4 }}></i>TO:</h4>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{routeForm.endLocation}</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {routeForm.departureTime && (
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-clock' style={{ color: '#8417BA', marginRight: 4 }}></i>DEPART:</h4>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{routeForm.departureTime}</p>
                      </div>
                    )}
                    {routeForm.arrivalTime && (
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}><i className='fas fa-clock' style={{ color: '#8417BA', marginRight: 4 }}></i>ARRIVE:</h4>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{routeForm.arrivalTime}</p>
                      </div>
                    )}
                  </div>
                  {location && (
                    <div style={{ fontSize: '0.9rem', color: '#666', paddingTop: '0.5rem', borderTop: '1px solid #DDD' }}>
                      Current Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)} (±{location.accuracy?.toFixed(1)}m)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bus Status Card */}
          <div className="status-card" style={{ background: '#f3e8ff', borderRadius: '14px', boxShadow: '0 2px 8px 0 rgba(132,23,186,0.04)', marginBottom: '1.5rem', padding: '1.2rem', border: '1px solid #e1bee7' }}>
            <h3><i className='fas fa-info-circle' style={{ color: '#8417BA', marginRight: 8 }}></i>Bus Status</h3>
            <div className="status-info">
              <div className="status-item">
                <span className="label">Occupied Seats:</span>
                <span className="value">{occupiedSeats}/{totalSeats}</span>
              </div>
              <div className="status-item">
                <span className="label">Available Seats:</span>
                <span className="value">{totalSeats - occupiedSeats}</span>
              </div>
            </div>
          </div>

          {/* Seat Layout Card */}
          <div className="seat-card" style={{ background: '#f3e8ff', borderRadius: '14px', boxShadow: '0 2px 8px 0 rgba(132,23,186,0.04)', marginBottom: '1.5rem', padding: '1.2rem', border: '1px solid #e1bee7' }}>
            <h3><i className='fas fa-th-large' style={{ color: '#8417BA', marginRight: 8 }}></i>Seat Layout</h3>
            <div className="bus-seats">
              {/* Front of bus */}
              <div className='bus-front'><i className='fas fa-arrow-up' style={{ color: '#8417BA', marginRight: 6 }}></i>Front</div>
              <div className="seats-grid">
                {Array.from({ length: totalSeats }, (_, idx) => renderSeat(idx + 1))}
              </div>
            </div>

            {/* Seat Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="seat booked"></div>
                <span>Booked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Live Location Tracking */}
        <div className="right-panel" style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 4px 24px 0 rgba(132,23,186,0.08)', padding: '2rem 1.5rem', margin: '0 0 2rem 1.5rem', border: '1px solid #ede7f6' }}>
          <div className="route-card" style={{ background: '#f3e8ff', borderRadius: '14px', boxShadow: '0 2px 8px 0 rgba(132,23,186,0.04)', marginBottom: '1.5rem', padding: '1.2rem', border: '1px solid #e1bee7' }}>
            <h3><i className='fas fa-map-marker-alt' style={{ color: '#8417BA', marginRight: 8 }}></i>Live Location & Tracking</h3>
            
            {/* View Map Button */}
            <button
              onClick={() => {
                if (isTracking && location) {
                  const origin = `${location.lat},${location.lng}`;
                  const destination = `${NSBM_GREEN_UNIVERSITY.lat},${NSBM_GREEN_UNIVERSITY.lng}`;
                  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;
                  window.open(directionsUrl, '_blank');
                }
              }}
              disabled={!isTracking}
              style={{
                width: '100%',
                padding: '0.8rem',
                backgroundColor: isTracking ? '#FF6B35' : '#CCCCCC',
                color: isTracking ? 'white' : '#666',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: isTracking ? 'pointer' : 'not-allowed',
                fontSize: '1rem',
                marginBottom: '1rem',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (isTracking) (e.currentTarget as any).style.backgroundColor = '#E55100';
              }}
              onMouseLeave={(e) => {
                if (isTracking) (e.currentTarget as any).style.backgroundColor = '#FF6B35';
              }}
            >
              <i className='fas fa-map-marked-alt' style={{ marginRight: 8 }}></i>Open Google Maps
            </button>

            {!isTracking && (
              <div style={{ padding: '1rem', backgroundColor: '#FFF3CD', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: '#856404', fontWeight: 'bold' }}><i className='fas fa-exclamation-triangle' style={{ color: '#fbc02d', marginRight: 6 }}></i>Start Trip to open Google Maps</p>
              </div>
            )}

            {isTracking && location && (
              <div style={{ padding: '0.8rem', backgroundColor: '#E3F2FD', borderRadius: '8px' }}>
                <p style={{ margin: '0.3rem 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#1976D2' }}>
                  <i className='fas fa-map-marker-alt' style={{ color: '#8417BA', marginRight: 6 }}></i>
                  Current Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                <p style={{ margin: '0.3rem 0', fontSize: '0.9rem', color: '#333' }}>
                  <i className='fas fa-flag-checkered' style={{ color: '#388E3C', marginRight: 6 }}></i>
                  Destination: NSBM Green University
                </p>
                <p style={{ margin: '0.3rem 0', fontSize: '0.9rem', color: '#333' }}>
                  <i className='fas fa-ruler-horizontal' style={{ color: '#8417BA', marginRight: 6 }}></i>
                  Accuracy: {location.accuracy?.toFixed(1)}m
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seat Details Modal */}
      {showSeatModal && selectedSeat && (
        <div className="seat-modal-overlay" onClick={closeSeatModal}>
          <div className="seat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className='fas fa-user' style={{ color: '#8417BA', marginRight: 8 }}></i>Seat {selectedSeat.id} Details</h3>
              <button className="close-btn" onClick={closeSeatModal}>×</button>
            </div>

            <div className="modal-content">
              {selectedSeat.occupied ? (
                <div className="passenger-details">
                  <div className="detail-item">
                    <span className='label'><i className='fas fa-user-graduate' style={{ color: '#8417BA', marginRight: 4 }}></i>Student Name:</span>
                    <span className="value">{selectedSeat.passengerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className='label'><i className='fas fa-user-friends' style={{ color: '#8417BA', marginRight: 4 }}></i>Parent Name:</span>
                    <span className="value">{selectedSeat.parentName}</span>
                  </div>
                  <div className="detail-item">
                    <span className='label'><i className='fas fa-phone' style={{ color: '#8417BA', marginRight: 4 }}></i>Parent Phone:</span>
                    <span className="value">{selectedSeat.parentPhone}</span>
                  </div>
                  <div className="contact-actions">
                    {selectedSeat.parentPhone && (
                      <>
                        <button
                          className="call-btn"
                          onClick={() => window.open(`tel:${selectedSeat.parentPhone}`, '_blank')}
                        >
                          <i className='fas fa-phone-alt' style={{ marginRight: 6 }}></i>Call Parent
                        </button>
                        <button
                          className="message-btn"
                          onClick={() => window.open(`sms:${selectedSeat.parentPhone}`, '_blank')}
                        >
                          <i className='fas fa-sms' style={{ marginRight: 6 }}></i>Send Message
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-seat">
                  <div className='empty-icon'><i className='fas fa-chair' style={{ color: '#8417BA', fontSize: '2rem' }}></i></div>
                  <p>This seat is currently available</p>
                  <span className="empty-note">No passenger assigned</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .driver-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Inter', sans-serif;
          padding-top: 100px; /* Account for fixed navbar */
        }

        .dashboard-header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 10;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 15px;
          position: relative;
          z-index: 10;
        }

        .bus-status-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 25px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bus-status-btn.available {
          background: #4CAF50;
          color: white;
        }

        .bus-status-btn.available:hover {
          background: #388E3C;
          transform: translateY(-1px);
        }

        .bus-status-btn.unavailable {
          background: #f44336;
          color: white;
        }

        .bus-status-btn.unavailable:hover {
          background: #d32f2f;
          transform: translateY(-1px);
        }

        .sos-container {
          position: relative;
          z-index: 1500;
        }

        .sos-btn {
          background: #ff4444;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 25px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
          animation: pulse-sos 2s infinite;
        }

        .sos-btn:hover {
          background: #cc0000;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
        }

        @keyframes pulse-sos {
          0%, 100% { box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3); }
          50% { box-shadow: 0 4px 20px rgba(255, 68, 68, 0.5); }
        }

        .sos-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 15px;
          padding: 20px;
          min-width: 250px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 2000;
          margin-top: 10px;
        }

        .sos-dropdown h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 1rem;
          font-weight: 600;
        }

        .emergency-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 15px;
        }

        .emergency-option {
          padding: 10px 15px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .emergency-option:hover {
          border-color: var(--primary);
          background: rgba(132, 23, 186, 0.05);
        }

        .emergency-option.selected {
          border-color: var(--primary);
          background: rgba(132, 23, 186, 0.1);
          color: var(--primary);
          font-weight: 600;
        }

        .report-emergency-btn {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
        }

        .report-emergency-btn:hover {
          background: linear-gradient(135deg, #cc0000 0%, #aa0000 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
        }

        .header-content h1 {
          margin: 0 0 10px 0;
          font-size: 2.2rem;
          font-weight: 700;
        }

        .bus-info h2 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .bus-info p {
          margin: 5px 0 0 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .live-indicator {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .left-panel, .right-panel {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .status-card, .seat-card, .route-card, .route-form-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 25px;
          border-radius: 15px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .status-card h3, .seat-card h3, .route-card h3, .route-form-card h3 {
          margin: 0 0 20px 0;
          color: var(--primary);
          font-size: 1.4rem;
          font-weight: 600;
        }

        .status-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .status-item:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 500;
          color: #666;
        }

        .value {
          font-weight: 600;
          color: var(--primary);
        }

        .bus-seats {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .bus-front {
          background: #333;
          color: white;
          padding: 12px 25px;
          border-radius: 8px;
          margin-bottom: 10px;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .seats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          width: 100%;
          max-width: 220px;
        }

        .seat {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .seat.available {
          background: #4CAF50;
          color: white;
        }

        .seat.available:hover {
          background: #388E3C;
          transform: scale(1.05);
        }

        .seat.occupied {
          background: #f44336;
          color: white;
          opacity: 0.8;
        }

        .seat-legend {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 20px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .legend-item .seat {
          width: 20px;
          height: 20px;
          cursor: default;
        }

        .legend-item .seat:hover {
          transform: none;
        }

        .route-stops h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .stops-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stop-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          border-radius: 8px;
          background: #f8f9fa;
          transition: all 0.2s;
        }

        .stop-item.current {
          background: rgba(132, 23, 186, 0.1);
          border: 1px solid var(--primary);
        }

        .stop-item.completed {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid #4CAF50;
        }

        .stop-marker {
          font-size: 1.2rem;
        }

        .stop-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stop-name {
          font-weight: 600;
          color: #333;
        }

        .stop-status {
          font-size: 0.8rem;
          color: #666;
        }

        .map-placeholder {
          margin-top: 30px;
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .map-header h4 {
          margin: 0;
          color: #333;
        }

        .map-status {
          color: #666;
          font-size: 0.9rem;
          font-style: italic;
        }

        .map-content {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 10px;
          padding: 20px;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .map-visualization {
          position: relative;
          width: 100%;
          height: 120px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border: 2px solid rgba(132, 23, 186, 0.1);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .route-line {
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 4px;
          background: linear-gradient(90deg, #4CAF50 0%, var(--primary) 50%, #9E9E9E 100%);
          border-radius: 2px;
          transform: translateY(-50%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .route-line::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, 
            #4CAF50 0%, #4CAF50 30%,
            var(--primary) 30%, var(--primary) 60%,
            #9E9E9E 60%, #9E9E9E 100%);
          border-radius: 2px;
          animation: routeFlow 2s ease-in-out infinite;
        }

        @keyframes routeFlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        }

        .map-points-display {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .map-section-title {
          text-align: center;
          margin-bottom: 15px;
        }

        .map-section-title h4 {
          margin: 0;
          color: var(--primary);
          font-size: 1.1rem;
          font-weight: 700;
        }

        .map-points-row {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 20px;
          max-width: 300px;
          margin: 0 auto;
        }

        .map-point-btn {
          flex: 0 0 auto;
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 15px 10px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(132, 23, 186, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .map-point-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          border-color: var(--primary);
        }

        .point-icon {
          font-size: 1.5rem;
        }

        .point-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #333;
        }

        /* Route Form Styles */
        .route-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: flex;
          gap: 15px;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #555;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-group input,
        .form-group select {
          padding: 12px 15px;
          border: 2px solid rgba(132, 23, 186, 0.2);
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          background: white;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(132, 23, 186, 0.1);
        }

        .location-input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .location-display {
          flex: 1;
          padding: 12px 15px;
          border: 2px solid rgba(132, 23, 186, 0.2);
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          background: #f9f9f9;
          cursor: default;
          color: #333;
        }

        .location-display:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(132, 23, 186, 0.1);
        }

        .open-map-btn {
          padding: 12px 20px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .open-map-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(132, 23, 186, 0.3);
        }

        .open-map-btn:active {
          transform: translateY(0);
        }

        .route-info-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid rgba(132, 23, 186, 0.1);
          animation: fadeIn 0.4s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .update-route-btn {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }

        .update-route-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(132, 23, 186, 0.3);
        }

        .update-route-btn:active {
          transform: translateY(0);
        }

        .update-route-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: linear-gradient(135deg, #ccc 0%, #999 100%);
          transform: none;
        }

        .update-route-btn:disabled:hover {
          box-shadow: none;
          transform: none;
        }

        @media (max-width: 768px) {
          .driver-dashboard {
            padding: 15px;
            padding-top: 130px;
          }

          .dashboard-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .dashboard-header {
            flex-direction: column;
            text-align: center;
            gap: 15px;
            padding: 20px;
          }

          .header-actions {
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }

          .bus-status-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 20px;
          }

          .sos-container {
            width: 100%;
          }

          .sos-btn {
            width: 100%;
            padding: 12px 20px;
          }

          .sos-dropdown {
            position: static;
            margin-top: 10px;
            width: 100%;
            min-width: unset;
          }

          .form-row {
            flex-direction: column;
            gap: 15px;
          }

          .form-group input,
          .form-group select {
            font-size: 16px;
            padding: 12px;
          }

          .update-route-btn {
            width: 100%;
            padding: 14px;
          }

          .header-content h1 {
            font-size: 1.6rem;
          }

          .bus-info h2 {
            font-size: 1.3rem;
          }

          .status-card, .seat-card, .route-card, .route-form-card {
            padding: 20px;
          }

          .status-card h3, .seat-card h3, .route-card h3, .route-form-card h3 {
            font-size: 1.2rem;
          }

          .seats-grid {
            max-width: 200px;
          }

          .seat {
            width: 35px;
            height: 35px;
            cursor: default;
          }

          .status-badge {
            padding: 8px 14px;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .driver-dashboard {
            padding: 10px;
            padding-top: 120px;
          }

          .dashboard-header {
            padding: 15px;
            border-radius: 12px;
          }

          .header-content h1 {
            font-size: 1.3rem;
          }

          .bus-info h2 {
            font-size: 1.1rem;
          }

          .bus-info p {
            font-size: 0.9rem;
          }

          .status-card, .seat-card, .route-card, .route-form-card {
            padding: 15px;
            border-radius: 12px;
          }

          .status-card h3, .seat-card h3, .route-card h3, .route-form-card h3 {
            font-size: 1.1rem;
            margin-bottom: 15px;
          }

          .form-group label {
            font-size: 0.85rem;
          }

          .seats-grid {
            max-width: 180px;
          }

          .seat {
            width: 30px;
            height: 30px;
            font-size: 0.7rem;
          }

          .stop-item {
            padding: 10px;
            gap: 10px;
          }

          .stop-name {
            font-size: 0.9rem;
          }

          .status-badge {
            padding: 6px 12px;
            font-size: 0.75rem;
          }
        }

        /* Seat Modal Styles */
        .seat-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease-out;
        }

        .seat-modal {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 0;
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px 25px 15px 25px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .modal-header h3 {
          margin: 0;
          color: var(--primary);
          font-size: 1.4rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #333;
        }

        .modal-content {
          padding: 25px;
        }

        .passenger-details {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 15px;
          background: rgba(132, 23, 186, 0.05);
          border-radius: 10px;
          border-left: 4px solid var(--primary);
        }

        .detail-item .label {
          font-weight: 600;
          color: #555;
          font-size: 0.9rem;
        }

        .detail-item .value {
          font-weight: 500;
          color: #333;
          font-size: 1rem;
          word-break: break-word;
        }

        .contact-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .call-btn, .message-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .call-btn {
          background: #4CAF50;
          color: white;
        }

        .call-btn:hover {
          background: #388E3C;
          transform: translateY(-1px);
        }

        .message-btn {
          background: #2196F3;
          color: white;
        }

        .message-btn:hover {
          background: #1976D2;
          transform: translateY(-1px);
        }

        .empty-seat {
          text-align: center;
          padding: 30px 20px;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 15px;
          opacity: 0.6;
        }

        .empty-seat p {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          font-weight: 500;
          color: #666;
        }

        .empty-note {
          color: #999;
          font-size: 0.9rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .seat-modal {
            width: 95%;
            margin: 20px;
          }

          .modal-header, .modal-content {
            padding: 20px;
          }

          .contact-actions {
            flex-direction: column;
          }

          .call-btn, .message-btn {
            width: 100%;
          }
        }
      `}</style>
        </>
      )}
      </div>
    </>
  );
};

export default DriverDashboard;