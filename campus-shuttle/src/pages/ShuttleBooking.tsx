import React, { useState, useEffect } from 'react';
import PayPalCheckout from '../components/PayPalCheckout';
import { LOCATIONS } from '../utils/locations';
import { useLocation, useNavigate } from 'react-router-dom';
import RouteTrackingModal from '../components/RouteTrackingModal';
import { supabase } from '../supabaseClient';

interface ShuttleRoute {
  id: number;
  busNumber: string;
  duration: string;
  startLocation: string;
  startTime: string;
  endLocation: string;
  endTime: string;
  stops: number;
  availableSeats: number;
  price: string;
}

const ShuttleBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const shuttleData: ShuttleRoute = location.state?.shuttle;

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showPayPal, setShowPayPal] = useState(false);
  const [nearestBusHalt, setNearestBusHalt] = useState('');

  // Use seat count from database (shuttleData.availableSeats)
  const totalSeats = shuttleData?.availableSeats || 20;
  const seatsPerRow = 4;

  const [bookedSeats, setBookedSeats] = useState<number[]>([]);

  // Fetch real booked seats from Supabase for this shuttle and trip date
  useEffect(() => {
    const fetchBookedSeats = async () => {
      if (!shuttleData) return;
      // Use today's date for trip_date (or allow user to pick date in future)
      const tripDate = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('booking_seat')
        .select('seat_number')
        .eq('shuttle_route_id', shuttleData.id)
        .eq('trip_date', tripDate);
      if (!error && data) {
        setBookedSeats(data.map((row: any) => Number(row.seat_number)));
      } else {
        setBookedSeats([]);
      }
    };
    fetchBookedSeats();
  }, [shuttleData]);

  useEffect(() => {
    if (!shuttleData) {
      navigate('/student-dashboard');
    }
  }, [shuttleData, navigate]);

  if (!shuttleData) {
    return <div>Loading...</div>;
  }

  const handleSeatClick = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats([]);
    } else {
      setSelectedSeats([seatNumber]);
    }
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Please select a seat');
      return;
    }
    if (selectedSeats.length > 1) {
      alert('You can only book one seat.');
      return;
    }
    if (!passengerName || !passengerEmail || !passengerPhone) {
      alert('Please fill in all passenger details');
      return;
    }
    if (!nearestBusHalt) {
      alert('Please select your nearest bus halt');
      return;
    }
    // Prepare booking data, but do not save yet
    const newBookingData = {
      shuttleId: shuttleData.id,
      shuttleData,
      selectedSeats,
      passengerName,
      passengerEmail,
      passengerPhone,
      nearestBusHalt,
      totalPrice: selectedSeats.length * parseInt(shuttleData.price.replace('LKR ', '')),
      bookingDate: new Date().toISOString()
    };
    setBookingData(newBookingData);
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async (details: any) => {
    // Save booking after payment
    if (bookingData) {
      const {
        shuttleId,
        selectedSeats,
        passengerName,
        passengerEmail,
        passengerPhone,
        nearestBusHalt,
        totalPrice,
        bookingDate
      } = bookingData;
      try {
        // Get student_id from userSession in localStorage
        let studentId = null;
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
          const session = JSON.parse(userSession);
          studentId = session.user_id || session.userId || session.id;
        }
        // Insert booking and get booking_id
        const { data: bookingRows, error: bookingError } = await supabase.from('booking').insert([
          {
            booking_date_time: bookingDate,
            trip_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
            selected_seats: selectedSeats.length,
            total_amount: totalPrice,
            booking_status: 'CONFIRMED',
            passenger_name: passengerName,
            passenger_email: passengerEmail,
            passenger_phone_no: passengerPhone,
            student_id: studentId,
            shuttle_route_id: shuttleId,
            pickup_location: nearestBusHalt,
          }
        ]).select('booking_id');
        if (bookingError || !bookingRows || !bookingRows[0]?.booking_id) throw bookingError;
        const bookingId = bookingRows[0].booking_id;
        // Insert into booking_seat for each seat
        const tripDate = new Date().toISOString().slice(0, 10);
        await Promise.all(selectedSeats.map((seatNumber: number) =>
          supabase.from('booking_seat').insert([
            {
              seat_number: seatNumber,
              booking_id: bookingId,
              shuttle_route_id: shuttleId,
              trip_date: tripDate,
            }
          ])
        ));
      } catch (error: any) {
        // Log error for debugging
        if (error && typeof error === 'object') {
          console.error('Booking insert error:', error);
          if (error.message) {
            alert('Booking failed: ' + error.message);
          } else if (error.details) {
            alert('Booking failed: ' + error.details);
          } else {
            alert('Booking failed. Please try again or contact support.');
          }
        } else {
          console.error('Booking insert error:', error);
          alert('Booking failed. Please try again or contact support.');
        }
      }
      setShowPayPal(false);
      // Redirect to student dashboard after payment
      navigate('/student-dashboard');
    }
  };

  const renderSeat = (seatNumber: number) => {
    const isSelected = selectedSeats.includes(seatNumber);
    const isBooked = bookedSeats.includes(seatNumber);

    let seatClass = 'seat';
    if (isBooked) seatClass += ' booked';
    else if (isSelected) seatClass += ' selected';
    else seatClass += ' available';

    return (
      <div
        key={seatNumber}
        className={seatClass}
        onClick={() => !isBooked && handleSeatClick(seatNumber)}
      >
        {seatNumber}
      </div>
    );
  };

  const totalPrice = selectedSeats.length * parseInt(shuttleData.price.replace('LKR ', ''));

  return (
    <div className="shuttle-booking">
      <div className="booking-container">
        {/* Header */}
        <div className="booking-header">
          <button className="back-btn" onClick={() => navigate('/student-dashboard')}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
          <h1>Book Your Shuttle</h1>
        </div>

        {/* Shuttle Details */}
        <div className="shuttle-details-card">
          <div className="shuttle-info">
            <div className="bus-header">
              <i className="fas fa-bus"></i>
              <h2>{shuttleData.busNumber}</h2>
            </div>
            <div className="route-info">
              <div className="route-point">
                <div className="location">
                  <h3>{shuttleData.startLocation}</h3>
                  <p>{shuttleData.startTime}</p>
                </div>
                <div className="route-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
                <div className="location">
                  <h3>{shuttleData.endLocation}</h3>
                  <p>{shuttleData.endTime}</p>
                </div>
              </div>
              <div className="route-meta">
                <span><i className="far fa-clock"></i> {shuttleData.duration}</span>
                <span><i className="fas fa-map-pin"></i> {shuttleData.stops} stops</span>
                <span><i className="fas fa-chair"></i> {totalSeats - bookedSeats.length} seats available</span>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-content">
          {/* Seat Selection */}
          <div className="seat-selection-section">
            <h3>Select Your Seats</h3>
            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="seat selected"></div>
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <div className="seat booked"></div>
                <span>Booked</span>
              </div>
            </div>

            <div className="bus-layout">
              <div className="bus-front">
                <i className="fas fa-bus"></i>
                <span>Front</span>
              </div>
              <div className="seats-grid">
                {Array.from({ length: totalSeats }, (_, index) => {
                  const seatNumber = index + 1;
                  return renderSeat(seatNumber);
                })}
              </div>
            </div>

            <div className="selected-seats-info">
              <p>Selected Seat: {selectedSeats.length > 0 ? selectedSeats[0] : 'None'}</p>
              <p>Only one seat can be booked per student</p>
            </div>
          </div>

          {/* Passenger Details */}
          <div className="passenger-details-section">
            <h3>Passenger Details</h3>
            <div className="passenger-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nearest Bus Halt</label>
                <input
                  type="text"
                  value={nearestBusHalt}
                  onChange={e => setNearestBusHalt(e.target.value)}
                  placeholder="Enter your nearest bus halt"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="booking-summary">
          <div className="summary-details">
            <div className="summary-item">
              <span>Route:</span>
              <span>{shuttleData.startLocation} → {shuttleData.endLocation}</span>
            </div>
            <div className="summary-item">
              <span>Departure:</span>
              <span>{shuttleData.startTime}</span>
            </div>
            <div className="summary-item">
              <span>Seats Selected:</span>
              <span>{selectedSeats.length}</span>
            </div>
            <div className="summary-item">
              <span>Price per Seat:</span>
              <span>{shuttleData.price}</span>
            </div>
            <div className="summary-item total">
              <span>Total Amount:</span>
              <span>LKR {totalPrice}</span>
            </div>
          </div>

          {!showPayPal && (
            <button
              className="confirm-booking-btn"
              onClick={handleBooking}
              disabled={selectedSeats.length === 0}
            >
              Confirm Booking
            </button>
          )}
          {showPayPal && bookingData && (
            <div style={{ marginTop: 20 }}>
              {/* LKR to USD approx for sandbox */}
              <PayPalCheckout
                amount={bookingData.totalPrice / 300}
                currency="USD"
                onSuccess={handlePayPalSuccess}
                onCancel={() => setShowPayPal(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Route Tracking Modal */}
      <RouteTrackingModal
        isOpen={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false);
          navigate('/student-dashboard');
        }}
        bookingData={bookingData}
      />
    </div>
  );
};

export default ShuttleBooking;