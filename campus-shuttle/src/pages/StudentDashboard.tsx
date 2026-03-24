import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import RouteMap from '../components/RouteMap';
import { supabase } from '../supabaseClient';

interface UserSession {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  student: {
    university: string;
    home_address: string;
    parent_name: string;
    parent_phone_no: string;
    parent_email: string;
  } | null;
}

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

interface ShuttleRouteRow {
  shuttle_route_id: number;
  bus_number: string;
  start_location: string;
  end_location: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  number_of_stops: number;
  total_seats: number;
  price_per_seat: number;
  status: 'Available' | 'NotAvailable';
}

interface BookedTrip {
  id: number;
  busNumber: string;
  duration: string;
  startLocation: string;
  startTime: string;
  endLocation: string;
  endTime: string;
  bookingDate: string;
  seatNumber: string;
  status: string;
  route: [number, number][];
  liveLocation?: string;
}

const formatDbTime = (timeValue: string): string => {
  const [hoursPart = '0', minutesPart = '0'] = timeValue.split(':');
  const hours24 = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (Number.isNaN(hours24) || Number.isNaN(minutes)) {
    return timeValue;
  }

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const StudentDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookedTrips, setShowBookedTrips] = useState(false);
  const [bookedTrips, setBookedTrips] = useState<BookedTrip[]>([]);
  const [isBookedTripsLoading, setIsBookedTripsLoading] = useState(false);
  const [bookedTripsError, setBookedTripsError] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<BookedTrip | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [shuttleRoutes, setShuttleRoutes] = useState<ShuttleRoute[]>([]);
  const [isRoutesLoading, setIsRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState('');
  const navigate = useNavigate();

  // Load user session on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('userSession');
    if (storedSession) {
      setUserSession(JSON.parse(storedSession));
    } else {
      // Redirect to home if not logged in
      navigate('/');
    }
  }, [navigate]);

  // Fetch real booked trips for the logged-in student
  useEffect(() => {
    const fetchBookedTrips = async () => {
      if (!userSession?.userId) return;
      setIsBookedTripsLoading(true);
      setBookedTripsError('');
      // Join booking and shuttle_route tables, include live_location
      const { data, error } = await supabase
        .from('booking')
        .select(`booking_id, trip_date, selected_seats, booking_status, shuttle_route_id, shuttle_route:shuttle_route_id(bus_number, start_location, end_location, departure_time, arrival_time, duration_minutes, number_of_stops, total_seats, price_per_seat, live_location)`) 
        .eq('student_id', userSession.userId)
        .order('trip_date', { ascending: false });
      if (error) {
        setBookedTripsError('Unable to load booked trips.');
        setBookedTrips([]);
        setIsBookedTripsLoading(false);
        return;
      }
      if (!data || data.length === 0) {
        setBookedTrips([]);
        setIsBookedTripsLoading(false);
        return;
      }
      // Map bookings to BookedTrip[]
      const mapped = data.map((b: any) => ({
        id: b.booking_id,
        busNumber: b.shuttle_route?.bus_number || 'N/A',
        duration: b.shuttle_route?.duration_minutes ? `${b.shuttle_route.duration_minutes} min` : 'N/A',
        startLocation: b.shuttle_route?.start_location || 'N/A',
        startTime: b.shuttle_route?.departure_time ? formatDbTime(b.shuttle_route.departure_time) : 'N/A',
        endLocation: b.shuttle_route?.end_location || 'N/A',
        endTime: b.shuttle_route?.arrival_time ? formatDbTime(b.shuttle_route.arrival_time) : 'N/A',
        bookingDate: b.trip_date || '',
        seatNumber: b.selected_seats || '',
        status: b.booking_status || '',
        route: [], // You can enhance this if you store route coordinates
        liveLocation: b.shuttle_route?.live_location || '',
      }));
      setBookedTrips(mapped);
      setIsBookedTripsLoading(false);
    };
    fetchBookedTrips();
  }, [userSession]);

  useEffect(() => {
    const fetchShuttleRoutes = async () => {
      setIsRoutesLoading(true);
      setRoutesError('');

      const { data, error } = await supabase
        .from('shuttle_route')
        .select('shuttle_route_id, bus_number, start_location, end_location, departure_time, arrival_time, duration_minutes, number_of_stops, total_seats, price_per_seat, status');

      console.log('Supabase fetch result - data rows:', data?.length, 'error:', error);

      if (error) {
        console.error('Supabase error:', error);
        setRoutesError('Unable to load shuttle routes. Check database connection.');
        setShuttleRoutes([]);
        setIsRoutesLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No shuttle routes found in database');
        setRoutesError('No shuttle routes available yet.');
        setShuttleRoutes([]);
        setIsRoutesLoading(false);
        return;
      }

      const mappedRoutes = ((data ?? []) as ShuttleRouteRow[]).map((route, index) => ({
        id: route.shuttle_route_id || index,
        busNumber: route.bus_number || 'BUS-NEW',
        duration: route.duration_minutes ? `${route.duration_minutes} min` : 'N/A',
        startLocation: route.start_location || 'TBD',
        startTime: route.departure_time ? formatDbTime(route.departure_time) : 'N/A',
        endLocation: route.end_location || 'TBD',
        endTime: route.arrival_time ? formatDbTime(route.arrival_time) : 'N/A',
        stops: route.number_of_stops ?? 0,
        availableSeats: route.total_seats ?? 0,
        price: route.price_per_seat ? `LKR ${Number(route.price_per_seat).toFixed(2)}` : 'N/A',
      }));

      console.log('Mapped routes count:', mappedRoutes.length, 'Routes:', mappedRoutes);
      setShuttleRoutes(mappedRoutes);
      setIsRoutesLoading(false);
    };

    fetchShuttleRoutes();
  }, []);

  const [welcomeRef, welcomeVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const [searchRef, searchVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2, delay: 200 });
  const [statsRef, statsVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2, delay: 400 });

  // bookedTrips now comes from Supabase

  const handleBookedTripsClick = () => {
    setShowBookedTrips(true);
  };

  const handleBackToRoutes = () => {
    setShowBookedTrips(false);
  };

  const handleViewRoute = (trip: BookedTrip) => {
    if (trip.liveLocation && trip.liveLocation.startsWith('http')) {
      window.open(trip.liveLocation, '_blank');
    } else {
      setSelectedRoute(trip);
      setShowMapModal(true);
    }
  };

  const closeMapModal = () => {
    setShowMapModal(false);
    setSelectedRoute(null);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredShuttleRoutes = shuttleRoutes.filter((route) => {
    if (!normalizedSearch) return true;

    return [route.busNumber, route.startLocation, route.endLocation]
      .some((field) => field.toLowerCase().includes(normalizedSearch));
  });

  return (
    <div>
      <div className="dashboard-wrapper">
        {/* Welcome Header */}
        <div ref={welcomeRef} className={`dashboard-welcome fade-up ${welcomeVisible ? 'visible' : ''}`}>
          <h1>Welcome, {userSession?.fullName || 'Rider'}!</h1>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className={`search-container fade-up ${searchVisible ? 'visible' : ''}`}>
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search for shuttle routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Statistics Cards */}
        <div ref={statsRef} className={`stats-grid fade-up ${statsVisible ? 'visible' : ''}`}>
          <div className="stat-card" onClick={handleBackToRoutes} style={{ cursor: 'pointer' }}>
            <div className="stat-icon">
              <i className="fas fa-bus"></i>
            </div>
            <div className="stat-info">
              <h3>{shuttleRoutes.length}</h3>
              <p>Available Buses</p>
            </div>
          </div>

          {/* Removed Active Routes stat card */}

          <div className="stat-card" onClick={handleBookedTripsClick} style={{ cursor: 'pointer' }}>
            <div className="stat-icon">
              <i className="fas fa-ticket-alt"></i>
            </div>
            <div className="stat-info">
              <h3>{isBookedTripsLoading ? '...' : bookedTrips.length}</h3>
              <p>Booked Trips</p>
            </div>
          </div>
        </div>

        {/* Available Shuttle Routes or Booked Trips */}
        <div className="routes-section">
          {showBookedTrips ? (
            <>
              <div className="section-header">
                <h2 className="section-title">My Booked Trips</h2>
              </div>

              <div className="routes-list">
                {isBookedTripsLoading ? (
                  <div className="route-card"><p>Loading booked trips...</p></div>
                ) : bookedTripsError ? (
                  <div className="route-card"><p>{bookedTripsError}</p></div>
                ) : bookedTrips.length === 0 ? (
                  <div className="route-card"><p>No booked trips found.</p></div>
                ) : bookedTrips.map((trip) => (
                  <div key={trip.id} className="route-card booked-trip">
                    <div className="route-header">
                      <div className="bus-number">
                        <i className="fas fa-bus-alt"></i>
                        <span>{trip.busNumber}</span>
                      </div>
                      <div className="trip-status">
                        <span className={`status-badge ${trip.status.toLowerCase()}`}>
                          {trip.status}
                        </span>
                      </div>
                    </div>

                    <div className="route-details">
                      <div className="route-location">
                        <div className="location-point start">
                          <i className="fas fa-circle"></i>
                          <div className="location-info">
                            <p className="location-name">{trip.startLocation}</p>
                            <p className="location-time">{trip.startTime}</p>
                          </div>
                        </div>

                        <div className="route-line">
                          <div className="route-dots"></div>
                        </div>

                        <div className="location-point end">
                          <i className="fas fa-map-marker-alt"></i>
                          <div className="location-info">
                            <p className="location-name">{trip.endLocation}</p>
                            <p className="location-time">{trip.endTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="route-footer">
                      <div className="route-meta">
                        <span className="meta-item">
                          <i className="fas fa-calendar"></i>
                          {trip.bookingDate}
                        </span>
                        <span className="meta-item">
                          <i className="fas fa-chair"></i>
                          Seat {trip.seatNumber}
                        </span>
                        <span className="route-price">{trip.duration}</span>
                      </div>
                      <button className="view-route-btn" onClick={() => handleViewRoute(trip)}>
                        <i className="fas fa-map"></i> View Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="section-title">Available Shuttle Routes</h2>

              <div className="routes-list">
                {isRoutesLoading && (
                  <div className="route-card">
                    <p>Loading available shuttles...</p>
                  </div>
                )}

                {!isRoutesLoading && routesError && (
                  <div className="route-card">
                    <p>{routesError}</p>
                  </div>
                )}

                {!isRoutesLoading && !routesError && filteredShuttleRoutes.length === 0 && (
                  <div className="route-card">
                    <p>No shuttle routes found.</p>
                  </div>
                )}

                {!isRoutesLoading && !routesError && filteredShuttleRoutes.map((route) => (
                  <div key={route.id} className="route-card">
                    <div className="route-header">
                      <div className="bus-number">
                        <i className="fas fa-bus-alt"></i>
                        <span>{route.busNumber}</span>
                      </div>
                      <div className="route-duration">
                        <i className="far fa-clock"></i>
                        <span>{route.duration}</span>
                      </div>
                    </div>

                    <div className="route-details">
                      <div className="route-location">
                        <div className="location-point start">
                          <i className="fas fa-circle"></i>
                          <div className="location-info">
                            <p className="location-name">{route.startLocation}</p>
                            <p className="location-time">{route.startTime}</p>
                          </div>
                        </div>

                        <div className="route-line">
                          <div className="route-dots"></div>
                        </div>

                        <div className="location-point end">
                          <i className="fas fa-map-marker-alt"></i>
                          <div className="location-info">
                            <p className="location-name">{route.endLocation}</p>
                            <p className="location-time">{route.endTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="route-footer">
                      <div className="route-meta">
                        <span className="meta-item">
                          <i className="fas fa-map-pin"></i>
                          {route.stops} Stops
                        </span>
                        <span className="meta-item">
                          <i className="fas fa-chair"></i>
                          {route.availableSeats} Seats
                        </span>
                        <span className="route-price">{route.price}</span>
                      </div>
                      <button className="book-btn" onClick={() => navigate('/shuttle-booking', { state: { shuttle: route } })}>
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Map Modal */}
        {showMapModal && selectedRoute && (
          <div className="map-modal-overlay" onClick={closeMapModal}>
            <div className="map-modal" onClick={(e) => e.stopPropagation()}>
              <div className="map-modal-header">
                <h3>Route Map - {selectedRoute.busNumber}</h3>
                <button className="close-modal-btn" onClick={closeMapModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="map-modal-body">
                <div className="route-info">
                  <div className="route-detail">
                    <i className="fas fa-circle"></i>
                    <span>{selectedRoute.startLocation} ({selectedRoute.startTime})</span>
                  </div>
                  <div className="route-arrow">
                    <i className="fas fa-arrow-down"></i>
                  </div>
                  <div className="route-detail">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{selectedRoute.endLocation} ({selectedRoute.endTime})</span>
                  </div>
                </div>
                <div className="map-container">
                  <RouteMap route={selectedRoute.route} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
