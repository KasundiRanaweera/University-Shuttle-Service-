
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faGraduationCap, faClipboardList, faExclamationTriangle, faBuilding, faChartBar, faBus, faChartLine, faEye, faEyeSlash, faMoneyBillWave, faTrophy, faMedal, faMapMarkerAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  totalTrips: number;
  licenseNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  seats: number;
  joinDate: string;
  rating: number;
}

interface Student {
  id: number;
  username: string;
  fullName: string;
  email: string;
  mobile: string;
  university: string;
  homeAddress: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  totalBookings: number;
  status: 'active' | 'inactive';
  joinDate: string;
}

interface EmergencyReport {
  id: number;
  driverName: string;
  busNumber: string;
  emergencyType: string;
  location: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'in_progress';
}

const AdminDashboard = () => {
    const [totalBookings, setTotalBookings] = useState<number>(0);

    // Fetch total bookings (optionally, for this month only)
    useEffect(() => {
      const fetchTotalBookings = async () => {
        // For all-time bookings:
        // const { count, error } = await supabase.from('booking').select('*', { count: 'exact', head: true });

        // For bookings only in the current month:
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const fromDate = firstDay.toISOString().split('T')[0];
        const toDate = lastDay.toISOString().split('T')[0];
        const { count, error } = await supabase
          .from('booking')
          .select('*', { count: 'exact', head: true })
          .gte('trip_date', fromDate)
          .lte('trip_date', toDate);
        if (!error && typeof count === 'number') {
          setTotalBookings(count);
        } else {
          setTotalBookings(0);
        }
      };
      fetchTotalBookings();
    }, []);
  const [activeSection, setActiveSection] = useState<'overview' | 'drivers' | 'students' | 'routes' | 'emergencies' | 'analytics'>('overview');
    // Shuttle Route State
    const [routes, setRoutes] = useState<any[]>([]);
    const [routesLoading, setRoutesLoading] = useState(true);
    const [routesError, setRoutesError] = useState('');
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [editingRoute, setEditingRoute] = useState<any>(null);
    const [routeForm, setRouteForm] = useState<any>({});
    const [routeActionLoading, setRouteActionLoading] = useState(false);
    const [routeSuccess, setRouteSuccess] = useState("");

    useEffect(() => {
      const fetchRoutes = async () => {
        setRoutesLoading(true);
        setRoutesError('');
        const { data, error } = await supabase.from('shuttle_route').select('*');
        if (error) {
          setRoutesError('Failed to fetch routes');
          setRoutesLoading(false);
          return;
        }
        setRoutes(data || []);
        setRoutesLoading(false);
      };
      fetchRoutes();
    }, []);

    const handleRouteFormChange = (e: any) => {
      setRouteForm({ ...routeForm, [e.target.name]: e.target.value });
    };

    const handleRouteSubmit = async (e: any) => {
      e.preventDefault();
      setRouteActionLoading(true);
      let success = false;
      if (editingRoute) {
        const { error } = await supabase.from('shuttle_route').update({ price_per_seat: routeForm.price_per_seat }).eq('shuttle_route_id', editingRoute.shuttle_route_id);
        success = !error;
      } else {
        const { error } = await supabase.from('shuttle_route').insert([{ ...routeForm }]);
        success = !error;
      }
      setRouteActionLoading(false);
      if (success) {
        setRouteSuccess("Saved successfully!");
        setTimeout(() => setRouteSuccess(""), 2000);
        setShowRouteModal(false);
        setEditingRoute(null);
        setRouteForm({});
      }
      // Refresh
      const { data } = await supabase.from('shuttle_route').select('*');
      setRoutes(data || []);
    };
  const [passwordVisibility, setPasswordVisibility] = useState<{[key: number]: boolean}>({});
  const [driverPasswordVisibility, setDriverPasswordVisibility] = useState<{[key: number]: boolean}>({});
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const togglePasswordVisibility = (studentId: number) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const toggleDriverPasswordVisibility = (driverId: number) => {
    setDriverPasswordVisibility(prev => ({
      ...prev,
      [driverId]: !prev[driverId]
    }));
  };

  // Real data from Supabase
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState('');

  useEffect(() => {
    const fetchDrivers = async () => {
      setDriversLoading(true);
      setDriversError('');
      // Join users and driver tables
      const { data, error } = await supabase
        .from('driver')
        .select(`
          user_id,
          license_no,
          vehicle_type,
          vehicle_number,
          number_of_seats,
          users:users(user_id, full_name, email, phone_no, status, created_at)
        `);
      if (error) {
        setDriversError('Failed to fetch drivers');
        setDriversLoading(false);
        return;
      }
      // Map to Driver interface
      const mapped = (data || []).map((d: any) => ({
        id: d.user_id,
        name: d.users?.full_name || '',
        email: d.users?.email || '',
        phone: d.users?.phone_no || '',
        status: (d.users?.status || 'inactive').toLowerCase(),
        totalTrips: 0, // You can fetch trip count if available
        licenseNumber: d.license_no,
        vehicleType: d.vehicle_type,
        vehicleNumber: d.vehicle_number,
        seats: d.number_of_seats,
        joinDate: d.users?.created_at ? d.users.created_at.split('T')[0] : '',
        rating: 0 // You can fetch rating if available
      }));
      setDrivers(mapped);
      setDriversLoading(false);
    };
    fetchDrivers();
  }, []);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setStudentsLoading(true);
      setStudentsError('');
      // Join users and student tables
      const { data, error } = await supabase
        .from('student')
        .select(`
          user_id,
          university,
          home_address,
          parent_name,
          parent_email,
          parent_phone_no,
          users:users(user_id, username, full_name, email, phone_no, status, created_at)
        `);
      if (error) {
        setStudentsError('Failed to fetch students');
        setStudentsLoading(false);
        return;
      }
      // Map to Student interface
      const mapped = (data || []).map((s: any) => ({
        id: s.user_id,
        username: s.users?.username || '',
        fullName: s.users?.full_name || '',
        email: s.users?.email || '',
        mobile: s.users?.phone_no || '',
        university: s.university,
        homeAddress: s.home_address,
        parentName: s.parent_name,
        parentEmail: s.parent_email,
        parentPhone: s.parent_phone_no,
        totalBookings: 0, // You can fetch booking count if available
        status: (s.users?.status || 'inactive').toLowerCase(),
        joinDate: s.users?.created_at ? s.users.created_at.split('T')[0] : ''
      }));
      setStudents(mapped);
      setStudentsLoading(false);
    };
    fetchStudents();
  }, []);

  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  const [emergenciesError, setEmergenciesError] = useState('');

  // Move fetchEmergencies outside useEffect for reuse
  const fetchEmergencies = async () => {
    setEmergenciesLoading(true);
    setEmergenciesError('');
    const { data, error } = await supabase
      .from('emergency_report')
      .select(`
        emergency_id,
        emergency_type,
        location_name,
        reported_time,
        status,
        driver:driver_id (user_id, users:users(user_id, full_name)),
        shuttle_route:shuttle_route_id (bus_number)
      `)
      .order('reported_time', { ascending: false });
    if (error) {
      setEmergenciesError('Failed to fetch emergency reports');
      setEmergenciesLoading(false);
      return;
    }
    const mapped = (data || []).map((e: any) => ({
      id: e.emergency_id,
      driverName: e.driver?.users?.full_name || 'Unknown',
      busNumber: e.shuttle_route?.bus_number || 'Unknown',
      emergencyType: formatEmergencyType(e.emergency_type),
      location: e.location_name,
      timestamp: new Date(e.reported_time).toLocaleString(),
      status: (e.status || 'pending').toLowerCase(),
    }));
    setEmergencies(mapped);
    setEmergenciesLoading(false);
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  function formatEmergencyType(type: string) {
    switch (type) {
      case 'TIRE_PUNCH': return 'Tire Punch';
      case 'ENGINE_ISSUE': return 'Engine Issue';
      case 'MEDICAL_EMERGENCY': return 'Medical Emergency';
      case 'ACCIDENT': return 'Accident';
      case 'OTHER': return 'Other Emergency';
      default: return type;
    }
  }

  const stats = {
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.status === 'active').length,
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    totalBookings: totalBookings,
    pendingEmergencies: emergencies.filter(e => e.status === 'pending').length,
    resolvedEmergencies: emergencies.filter(e => e.status === 'resolved').length,
  };

  // Filter drivers based on search term
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
    driver.phone.includes(driverSearchTerm) ||
    driver.vehicleNumber.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(driverSearchTerm.toLowerCase())
  );

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.mobile.includes(studentSearchTerm) ||
    student.university.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const renderOverview = () => (
    <div className="overview-content">
      <div className="stats-grid">
        <div className="stat-card" title="Total Drivers">
          <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="stat-info">
            <h3>{stats.totalDrivers}</h3>
            <p>Total Drivers</p>
            <span className="stat-badge">{stats.activeDrivers} active</span>
          </div>
        </div>
        <div className="stat-card" title="Total Students">
          <div className="stat-icon"><FontAwesomeIcon icon={faGraduationCap} /></div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Total Students</p>
            <span className="stat-badge">{stats.activeStudents} active</span>
          </div>
        </div>
        <div className="stat-card" title="Total Bookings">
          <div className="stat-icon"><FontAwesomeIcon icon={faClipboardList} /></div>
          <div className="stat-info">
            <h3>{stats.totalBookings}</h3>
            <p>Total Bookings</p>
            <span className="stat-badge">This month</span>
          </div>
        </div>
        <div className="stat-card" title="Pending Emergencies">
          <div className="stat-icon"><FontAwesomeIcon icon={faExclamationTriangle} /></div>
          <div className="stat-info">
            <h3>{stats.pendingEmergencies}</h3>
            <p>Pending Emergencies</p>
            <span className="stat-badge">{stats.resolvedEmergencies} resolved</span>
          </div>
        </div>
      </div>
      <div className="recent-emergencies">
        <h2>Recent Emergency Reports</h2>
        <div className="emergency-cards">
          {emergencies.slice(0, 3).map(emergency => (
            <div key={emergency.id} className="emergency-card">
              <div className="emergency-header">
                <span className="emergency-type">{emergency.emergencyType}</span>
                <span className={`status ${emergency.status}`}>{emergency.status}</span>
              </div>
              <div className="emergency-details">
                <p><strong>Driver:</strong> {emergency.driverName}</p>
                <p><strong>Bus:</strong> {emergency.busNumber}</p>
                <p><strong>Location:</strong> {emergency.location}</p>
                <p><strong>Time:</strong> {emergency.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDrivers = () => (
    <div className="drivers-content">
      <div className="content-header">
        <h2>Driver Management</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search drivers by name, email, phone, vehicle..."
            value={driverSearchTerm}
            onChange={(e) => setDriverSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <div className="driver-cards">
        {filteredDrivers.map(driver => (
          <div key={driver.id} className="driver-card">
            <div className="driver-header">
              <div className="driver-avatar">{driver.name.charAt(0)}</div>
              <div className="driver-info">
                <h3>{driver.name}</h3>
              </div>
              <span className={`status ${driver.status}`}>{driver.status}</span>
            </div>
            <div className="driver-details">
              <div className="detail-row">
                <span>Full Name:</span>
                <span>{driver.name}</span>
              </div>
              <div className="detail-row">
                <span>Phone Number:</span>
                <span>{driver.phone}</span>
              </div>
              <div className="detail-row">
                <span>Email Address:</span>
                <span>{driver.email}</span>
              </div>
              <div className="detail-row">
                <span>Password:</span>
                <span>••••••••</span>
              </div>
              <div className="detail-row">
                <span>Driver's License Number:</span>
                <span>{driver.licenseNumber}</span>
              </div>
              <div className="detail-row">
                <span>Upload License:</span>
                <span>license_file.pdf</span>
              </div>
              <div className="detail-row">
                <span>Upload Vehicle Document:</span>
                <span>vehicle_doc.pdf</span>
              </div>
              <div className="detail-row">
                <span>Vehicle Type:</span>
                <span>{driver.vehicleType}</span>
              </div>
              <div className="detail-row">
                <span>Vehicle Number:</span>
                <span>{driver.vehicleNumber}</span>
              </div>
              <div className="detail-row">
                <span>Number of Seats:</span>
                <span>{driver.seats}</span>
              </div>
            </div>
            {/* Edit/Delete actions removed as per requirements */}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="students-content">
      <div className="content-header">
        <h2>Student Management</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search students by name, username, email, phone..."
            value={studentSearchTerm}
            onChange={(e) => setStudentSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <div className="student-cards">
        {filteredStudents.map(student => (
          <div key={student.id} className="student-card">
            <div className="student-header">
              <div className="student-avatar">{student.fullName.charAt(0)}</div>
              <div className="student-info">
                <h3>{student.fullName}</h3>
                <p className="username">@{student.username}</p>
              </div>
              <span className={`status ${student.status}`}>{student.status}</span>
            </div>
            <div className="student-details">
              <div className="detail-row">
                <span>Username:</span>
                <span>@{student.username}</span>
              </div>
              <div className="detail-row">
                <span>Full Name:</span>
                <span>{student.fullName}</span>
              </div>
              <div className="detail-row">
                <span>Email Address:</span>
                <span>{student.email}</span>
              </div>
              <div className="detail-row">
                <span>Mobile Number:</span>
                <span>{student.mobile}</span>
              </div>
              <div className="detail-row">
                <span>University:</span>
                <span>{student.university}</span>
              </div>
              <div className="detail-row">
                <span>Home Address:</span>
                <span>{student.homeAddress}</span>
              </div>
              <div className="detail-row">
                <span>Password:</span>
                <div className="password-field">
                  <span>{passwordVisibility[student.id] ? 'password123' : '••••••••'}</span>
                  <button
                    className="eye-icon"
                    onClick={() => togglePasswordVisibility(student.id)}
                    title={passwordVisibility[student.id] ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisibility[student.id] ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                  </button>
                </div>
              </div>
              <div className="detail-row">
                <span>Parent/Guardian Name:</span>
                <span>{student.parentName}</span>
              </div>
              <div className="detail-row">
                <span>Parent/Guardian Email Address:</span>
                <span>{student.parentEmail}</span>
              </div>
              <div className="detail-row">
                <span>Parent/Guardian Mobile Number:</span>
                <span>{student.parentPhone}</span>
              </div>
              <div className="detail-row">
                <span>Total Bookings:</span>
                <span>{student.totalBookings}</span>
              </div>
            </div>
            {/* Edit/Delete actions removed as per requirements */}
          </div>
        ))}
      </div>
    </div>
  );
  // Shuttle Routes Section
  const [routeSearchTerm, setRouteSearchTerm] = useState("");
  const renderRoutes = () => (
    <div className="routes-content">
      <div className="content-header">
        <h2>Shuttle Routes</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search routes by bus number, start, end..."
            value={routeSearchTerm}
            onChange={e => setRouteSearchTerm(e.target.value)}
            className="search-input"
            style={{padding:'8px 12px',borderRadius:6,border:'1px solid #ccc',fontSize:'1rem',minWidth:220}}
          />
        </div>
      </div>
      {routesLoading ? <p>Loading...</p> : routesError ? <p style={{color:'red'}}>{routesError}</p> : (
        <div className="route-cards">
          {routes.filter(route =>
            (route.bus_number || '').toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
            (route.start_location || '').toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
            (route.end_location || '').toLowerCase().includes(routeSearchTerm.toLowerCase())
          ).map(route => (
            <div key={route.shuttle_route_id} className="route-card">
              <div><b>Bus Number:</b> {route.bus_number}</div>
              <div><b>From:</b> {route.start_location}</div>
              <div><b>To:</b> {route.end_location}</div>
              <div><b>Departure:</b> {route.departure_time}</div>
              <div><b>Arrival:</b> {route.arrival_time}</div>
              <div><b>Duration:</b> {route.duration_minutes} min</div>
              <div><b>Stops:</b> {route.number_of_stops}</div>
              <div><b>Total Seats:</b> {route.total_seats}</div>
              <div><b>Price per Seat:</b> Rs. {route.price_per_seat}
                <button className="btn-secondary" style={{marginLeft:8}} onClick={() => { setEditingRoute(route); setRouteForm({ price_per_seat: route.price_per_seat }); setShowRouteModal(true); }}>Edit</button>
              </div>
              <div><b>Status:</b> {route.status}</div>
            </div>
          ))}
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="modal-overlay popup-overlay">
          <div className="modal popup-modal">
            {routeSuccess && (
              <div style={{background:'#38a169',color:'#fff',padding:'10px 18px',borderRadius:8,marginBottom:16,textAlign:'center',fontWeight:600,boxShadow:'0 2px 8px rgba(56,161,105,0.15)'}}>
                {routeSuccess}
              </div>
            )}
            {editingRoute ? (
              <>
                <h2>Edit Price for Route: <span style={{color:'#8417BA'}}>{editingRoute.bus_number}</span></h2>
                <div style={{marginBottom: '1rem', background:'#f7fafc', padding:'1rem', borderRadius:'8px'}}>
                  <div><b>Bus Number:</b> {editingRoute.bus_number}</div>
                  <div><b>From:</b> {editingRoute.start_location}</div>
                  <div><b>To:</b> {editingRoute.end_location}</div>
                  <div><b>Departure:</b> {editingRoute.departure_time}</div>
                  <div><b>Arrival:</b> {editingRoute.arrival_time}</div>
                  <div><b>Duration:</b> {editingRoute.duration_minutes} min</div>
                  <div><b>Total Seats:</b> {editingRoute.total_seats}</div>
                </div>
                <form onSubmit={handleRouteSubmit}>
                  <label style={{fontWeight:'bold', marginBottom:4, display:'block'}}>Price per Seat</label>
                  <div style={{position:'relative', marginBottom:'1.5rem'}}>
                    <span style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#8417BA',
                      fontSize: '1.2rem',
                      pointerEvents: 'none'
                    }}>₨</span>
                    <input
                      name="price_per_seat"
                      placeholder="Enter amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={routeForm.price_per_seat || ''}
                      onChange={handleRouteFormChange}
                      required
                      style={{
                        width:'100%',
                        padding:'12px 12px 12px 38px',
                        fontSize:'1.25rem',
                        border:'2px solid #e2e8f0',
                        borderRadius:'8px',
                        outline:'none',
                        fontWeight:'600',
                        color:'#2d3748',
                        boxSizing:'border-box',
                        transition:'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#8417BA'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={routeActionLoading} style={{marginRight:8}}>{routeActionLoading ? 'Saving...' : 'Save'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowRouteModal(false)}>Cancel</button>
                </form>
              </>
            ) : (
              <>
                <h2>Add New Shuttle Route</h2>
                <form onSubmit={handleRouteSubmit}>
                  <input name="bus_number" placeholder="Bus Number" value={routeForm.bus_number || ''} onChange={handleRouteFormChange} required />
                  <input name="start_location" placeholder="Start Location" value={routeForm.start_location || ''} onChange={handleRouteFormChange} required />
                  <input name="end_location" placeholder="End Location" value={routeForm.end_location || ''} onChange={handleRouteFormChange} required />
                  <input name="departure_time" placeholder="Departure Time (HH:MM:SS)" value={routeForm.departure_time || ''} onChange={handleRouteFormChange} required />
                  <input name="arrival_time" placeholder="Arrival Time (HH:MM:SS)" value={routeForm.arrival_time || ''} onChange={handleRouteFormChange} required />
                  <input name="duration_minutes" placeholder="Duration (min)" type="number" value={routeForm.duration_minutes || ''} onChange={handleRouteFormChange} required />
                  <input name="number_of_stops" placeholder="Number of Stops" type="number" value={routeForm.number_of_stops || ''} onChange={handleRouteFormChange} required />
                  <input name="total_seats" placeholder="Total Seats" type="number" value={routeForm.total_seats || ''} onChange={handleRouteFormChange} required />
                  <input name="price_per_seat" placeholder="Price per Seat" type="number" value={routeForm.price_per_seat || ''} onChange={handleRouteFormChange} required />
                  <input name="status" placeholder="Status" value={routeForm.status || ''} onChange={handleRouteFormChange} required />
                  <input name="driver_id" placeholder="Driver ID" value={routeForm.driver_id || ''} onChange={handleRouteFormChange} required />
                  <button type="submit" className="btn-primary" disabled={routeActionLoading} style={{marginRight:8}}>{routeActionLoading ? 'Saving...' : 'Save'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowRouteModal(false)}>Cancel</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Handler to mark emergency as resolved
  const handleMarkResolved = async (emergencyId: number) => {
    // Update status to 'approved' in the database
    const { error } = await supabase
      .from('emergency_report')
      .update({ status: 'RESOLVED' })
      .eq('emergency_id', emergencyId);
    if (error) {
      alert('Failed to update status: ' + error.message);
      return;
    }
    // Refresh emergencies list without reloading the page
    fetchEmergencies();
  };

  const renderEmergencies = () => (
    <div className="emergencies-content">
      <div className="content-header">
        <h2>Emergency Reports</h2>
        <div className="filters">
          <select className="filter-select">
            <option>All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>
      <div className="emergency-list">
        {emergencies.map(emergency => (
          <div key={emergency.id} className="emergency-item">
            <div className="emergency-main">
              <div className="emergency-icon"><FontAwesomeIcon icon={faExclamationTriangle} /></div>
              <div className="emergency-info">
                <h3>{emergency.emergencyType}</h3>
                <p>{emergency.driverName} • {emergency.busNumber}</p>
                <p className="location"><FontAwesomeIcon icon={faMapMarkerAlt} /> {emergency.location}</p>
                <p className="timestamp"><FontAwesomeIcon icon={faClock} /> {emergency.timestamp}</p>
              </div>
              <span className={`status ${emergency.status}`}>{emergency.status}</span>
            </div>
            <div className="emergency-actions">
              <button className="btn-secondary">View Details</button>
              <button className="btn-primary" onClick={() => handleMarkResolved(emergency.id)} disabled={emergency.status === 'resolved' || emergency.status === 'in_progress'}>
                {emergency.status === 'resolved' || emergency.status === 'in_progress' ? 'Resolved' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  // --- Analytics State ---
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{month: string, value: number}[]>([]);
  // User Growth State
  const [newStudents, setNewStudents] = useState<number>(0);
  const [newDrivers, setNewDrivers] = useState<number>(0);
  const [activeUsersPercent, setActiveUsersPercent] = useState<number>(0);
  useEffect(() => {
    // Fetch total revenue, total trips, monthly revenue, and user growth
    const fetchAnalytics = async () => {
      // Total Revenue: sum of all booking total_amount
      const { data: revenueData, error: revenueError } = await supabase
        .from('booking')
        .select('total_amount, booking_date_time');
      if (!revenueError && Array.isArray(revenueData)) {
        const sum = revenueData.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
        setTotalRevenue(sum);
        // Monthly revenue aggregation
        const monthly: {[key: string]: number} = {};
        revenueData.forEach((row) => {
          const date = new Date(row.booking_date_time);
          const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthly[month] = (monthly[month] || 0) + (parseFloat(row.total_amount) || 0);
        });
        // Sort months chronologically
        const sorted = Object.entries(monthly)
          .sort((a, b) => {
            const [ma, ya] = a[0].split(' ');
            const [mb, yb] = b[0].split(' ');
            const da = new Date(2000 + Number(ya), new Date(Date.parse(ma + ' 1, 2000')).getMonth());
            const db = new Date(2000 + Number(yb), new Date(Date.parse(mb + ' 1, 2000')).getMonth());
            return da.getTime() - db.getTime();
          })
          .map(([month, value]) => ({ month, value }));
        setMonthlyRevenue(sorted);
      } else {
        setTotalRevenue(0);
        setMonthlyRevenue([]);
      }
      // Total Trips: count of all bookings
      const { count, error: tripsError } = await supabase
        .from('booking')
        .select('*', { count: 'exact', head: true });
      if (!tripsError && typeof count === 'number') {
        setTotalTrips(count);
      } else {
        setTotalTrips(0);
      }

      // User Growth: new students and drivers in the last 30 days
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      const lastMonthISO = lastMonth.toISOString();
      // New Students
      const { count: newStudentCount } = await supabase
        .from('student')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', lastMonthISO);
      setNewStudents(typeof newStudentCount === 'number' ? newStudentCount : 0);
      // New Drivers
      const { count: newDriverCount } = await supabase
        .from('driver')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', lastMonthISO);
      setNewDrivers(typeof newDriverCount === 'number' ? newDriverCount : 0);
      // Active Users: users with status 'active' / total users
      const { data: usersData } = await supabase
        .from('users')
        .select('status');
      if (Array.isArray(usersData) && usersData.length > 0) {
        const active = usersData.filter(u => (u.status || '').toLowerCase() === 'active').length;
        setActiveUsersPercent(Math.round((active / usersData.length) * 1000) / 10); // 1 decimal
      } else {
        setActiveUsersPercent(0);
      }
    };
    fetchAnalytics();
  }, []);

  const renderAnalytics = () => (
    <div className="analytics-content redesigned-analytics">
      <div className="analytics-header">
        <h2><FontAwesomeIcon icon={faChartLine} /> Analytics Dashboard</h2>
        <div className="analytics-filters">
          <select className="filter-select">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last year</option>
          </select>
        </div>
      </div>

      {/* Modern Key Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card modern">
          <div className="metric-icon"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
          <div className="metric-info">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">Rs. {totalRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="metric-card modern">
          <div className="metric-icon"><FontAwesomeIcon icon={faChartLine} /></div>
          <div className="metric-info">
            <span className="metric-label">Total Trips</span>
            <span className="metric-value">{totalTrips.toLocaleString()}</span>
          </div>
        </div>
        <div className="metric-card modern">
          <div className="metric-icon"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="metric-info">
            <span className="metric-label">New Students</span>
            <span className="metric-value">+{newStudents}</span>
          </div>
        </div>
        <div className="metric-card modern">
          <div className="metric-icon"><FontAwesomeIcon icon={faGraduationCap} /></div>
          <div className="metric-info">
            <span className="metric-label">New Drivers</span>
            <span className="metric-value">+{newDrivers}</span>
          </div>
        </div>
        <div className="metric-card modern">
          <div className="metric-icon"><FontAwesomeIcon icon={faChartBar} /></div>
          <div className="metric-info">
            <span className="metric-label">Active Users</span>
            <span className="metric-value">{activeUsersPercent}%</span>
          </div>
        </div>
      </div>

      {/* Modern Revenue Trends Chart */}
      <div className="charts-row">
        <div className="chart-card large modern">
          <h3><FontAwesomeIcon icon={faChartBar} /> Revenue Trends</h3>
          <div className="revenue-chart modern">
            <div className="chart-area">
              {monthlyRevenue.length === 0 ? (
                <div style={{padding:'2rem',textAlign:'center',color:'#888'}}>No revenue data</div>
              ) : (
                monthlyRevenue.map((item, idx) => {
                  const max = Math.max(...monthlyRevenue.map(m => m.value));
                  const height = max > 0 ? Math.round((item.value / max) * 90) : 0;
                  return (
                    <div
                      key={item.month}
                      className="revenue-bar modern"
                      style={{height: `${height}%`}}
                      data-month={item.month}
                      data-value={`Rs. ${item.value.toLocaleString()}`}
                      title={`Rs. ${item.value.toLocaleString()}`}
                    ></div>
                  );
                })
              )}
            </div>
            <div className="chart-labels">
              {monthlyRevenue.map(item => (
                <span key={item.month}>{item.month}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Bottom Row */}
      <div className="bottom-analytics modern">
        <div className="analytics-card modern">
          <h3><FontAwesomeIcon icon={faTrophy} /> Top Performing Drivers</h3>
          <div className="top-drivers-grid modern">
            {drivers.slice(0, 5).map((driver, index) => (
              <div key={driver.id} className={`driver-rank-card modern ${index === 0 ? 'first-place' : ''}`}>
                <div className="driver-rank-header modern">
                  <div className="driver-avatar-circle modern">{driver.name ? driver.name.charAt(0).toUpperCase() : '?'}</div>
                  <div className="driver-rank-number modern">#{index + 1}</div>
                  <div className="driver-rank-badge modern">{index === 0 ? <FontAwesomeIcon icon={faTrophy} style={{color:'#FFD700'}} /> : <FontAwesomeIcon icon={faMedal} style={{color:'#C0C0C0'}} />}</div>
                </div>
                <div className="driver-rank-info modern">
                  <span className="driver-rank-name modern">{driver.name}</span>
                  <span className="driver-rank-trips modern">{driver.totalTrips} trips</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="analytics-card modern">
          <h3><FontAwesomeIcon icon={faChartBar} /> User Growth</h3>
          <div className="growth-chart modern">
            <div className="growth-metric modern">
              <span className="growth-label modern">New Students</span>
              <span className="growth-value modern">+{newStudents}</span>
            </div>
            <div className="growth-metric modern">
              <span className="growth-label modern">New Drivers</span>
              <span className="growth-value modern">+{newDrivers}</span>
            </div>
            <div className="growth-metric modern">
              <span className="growth-label modern">Active Users</span>
              <span className="growth-value modern">{activeUsersPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Export analytics data as CSV or Excel
  const exportAnalyticsData = (type: 'csv' | 'excel') => {
    // Prepare data for export
    const data = [
      {
        'Total Revenue': totalRevenue,
        'Total Trips': totalTrips,
        'New Students': newStudents,
        'New Drivers': newDrivers,
        'Active Users (%)': activeUsersPercent,
        'Top Performing Drivers': drivers.slice(0, 5).map((d) => d.name).join(', '),
      },
    ];

    if (type === 'csv') {
      const csvRows = [
        Object.keys(data[0]).join(','),
        Object.values(data[0]).join(','),
      ];
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'excel') {
      // Excel export using SheetJS
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics');
      XLSX.writeFile(workbook, 'analytics.xlsx');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1><FontAwesomeIcon icon={faBuilding} /> Admin</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="nav-icon"><FontAwesomeIcon icon={faChartBar} /></span>
            Overview
          </button>
          <button
            className={`nav-item ${activeSection === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveSection('drivers')}
          >
            <span className="nav-icon"><FontAwesomeIcon icon={faUsers} /></span>
            Drivers
          </button>
          <button
            className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
          >
            <span className="nav-icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
            Students
          </button>
          <button
            className={`nav-item ${activeSection === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveSection('routes')}
          >
            <span className="nav-icon"><FontAwesomeIcon icon={faBus} /></span>
            Shuttle Routes
          </button>
          <button
            className={`nav-item ${activeSection === 'emergencies' ? 'active' : ''}`}
            onClick={() => setActiveSection('emergencies')}
          >
            <span className="nav-icon"><FontAwesomeIcon icon={faExclamationTriangle} /></span>
            Emergencies
          </button>
          <button
            className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <span className="nav-icon"><FontAwesomeIcon icon={faChartLine} /></span>
            Analytics
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="top-header">
          <h1>
            {activeSection === 'overview' && 'Dashboard Overview'}
            {activeSection === 'drivers' && 'Driver Management'}
            {activeSection === 'students' && 'Student Management'}
            {activeSection === 'emergencies' && 'Emergency Reports'}
            {activeSection === 'analytics' && 'Analytics'}
          </h1>
          <div className="header-actions">
            <button className="btn-pro export-csv" onClick={() => exportAnalyticsData('csv')} title="Export as CSV">
              Export CSV
            </button>
            <button className="btn-pro export-excel" onClick={() => exportAnalyticsData('excel')} title="Export as Excel">
              Export Excel
            </button>
            <button className="btn-pro logout" onClick={() => {
              localStorage.removeItem('adminLoggedIn');
              window.location.href = '/';
            }} title="Logout">
              Logout
            </button>
          </div>
        </header>

        <main className="content-area">
          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'drivers' && renderDrivers()}
          {activeSection === 'students' && renderStudents()}
          {activeSection === 'routes' && renderRoutes()}
          {activeSection === 'emergencies' && renderEmergencies()}
          {activeSection === 'analytics' && renderAnalytics()}
        </main>
      </div>

      <style>{`
        html, body, .admin-dashboard {
          font-family: 'Inter', 'Roboto', Arial, sans-serif;
        }
        .welcome-summary-card {
          background: linear-gradient(90deg, #f3e9fa 0%, #e6e6ff 100%);
          border-radius: 18px;
          box-shadow: 0 4px 18px rgba(132,23,186,0.10);
          padding: 2.2rem 2.2rem 1.5rem 2.2rem;
          margin: 32px 40px 0 40px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 2.5rem;
        }
        .welcome-summary-left h2 {
          margin: 0 0 0.3rem 0;
          font-size: 2.1rem;
          font-weight: 700;
          color: #6B1297;
        }
        .welcome-summary-left p {
          margin: 0;
          color: #555;
          font-size: 1.1rem;
        }
        .welcome-summary-stats {
          display: flex;
          gap: 2.2rem;
          flex-wrap: wrap;
        }
        .summary-stat {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          font-size: 1.15rem;
          font-weight: 600;
          color: #8417BA;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(132,23,186,0.07);
          padding: 0.7rem 1.2rem;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
        }
        .summary-stat:hover {
          box-shadow: 0 6px 18px rgba(132,23,186,0.18);
          transform: translateY(-2px) scale(1.04);
        }
        .summary-stat svg {
          font-size: 1.5rem;
        }
        /* --- Existing styles below remain unchanged, but update stat-card, btn, nav-icon --- */
        .stat-card {
          background: white;
          padding: 32px 28px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: 0 4px 12px rgba(132,23,186,0.08);
          transition: box-shadow 0.25s, transform 0.25s;
          cursor: pointer;
        }
        .stat-card:hover {
          box-shadow: 0 8px 24px rgba(132,23,186,0.16);
          transform: translateY(-3px) scale(1.02);
        }
        .btn-primary {
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #6B1297 0%, #8417BA 100%);
          box-shadow: 0 6px 18px rgba(132, 23, 186, 0.18);
          transform: translateY(-2px) scale(1.04);
        }
        .btn-secondary {
          background: white;
          color: #4a5568;
          border: 2px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
        }
        .btn-secondary:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
          box-shadow: 0 4px 12px rgba(132,23,186,0.10);
          transform: translateY(-2px) scale(1.03);
        }
        .nav-icon {
          margin-right: 12px;
          font-size: 1.2rem;
          cursor: pointer;
        }
        .nav-icon[title]:hover {
          color: #fff;
          filter: drop-shadow(0 2px 8px #8417BA);
        }
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .popup-modal {
                  background: #fff;
                  border-radius: 16px;
                  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
                  padding: 2.5rem 2rem 2rem 2rem;
                  min-width: 340px;
                  max-width: 95vw;
                  max-height: 90vh;
                  overflow-y: auto;
                  position: relative;
                  z-index: 1001;
                  animation: popup-fadein 0.2s;
                }
                @keyframes popup-fadein {
                  from { opacity: 0; transform: scale(0.97); }
                  to { opacity: 1; transform: scale(1); }
                }
        .admin-dashboard {
          display: flex;
          min-height: 100vh;
          background: #f8f9fa;
          margin-top: 80px;
        }

        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #8417BA 0%, #6B1297 100%);
          color: white;
          padding: 30px 0;
          position: fixed;
          height: calc(100vh - 80px);
          left: 0;
          top: 80px;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          z-index: 1200;
        }

        .sidebar-header {
          padding: 0 30px 30px;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }

        .sidebar-header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        @media (max-width: 600px) {
          .sidebar-header h1 {
            margin-top: 18px;
            margin-bottom: 10px;
            text-align: center;
          }
        }
        }

        .sidebar-nav {
          padding: 20px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 15px 30px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.8);
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .nav-item.active {
          background: rgba(255,255,255,0.2);
          color: white;
          border-right: 3px solid white;
        }

        .nav-icon {
          margin-right: 12px;
          font-size: 1.2rem;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          display: flex;
          flex-direction: column;
        }

        .top-header {
          background: white;
          padding: 25px 40px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .top-header h1 {
          margin: 0;
          color: #2d3748;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 15px;
        }

        @media (max-width: 600px) {
          .header-actions {
            flex-direction: column;
            gap: 8px;
            width: 100%;
            align-items: stretch;
          }
          .search-input {
            width: 100%;
            min-width: 0;
            font-size: 1rem;
            padding: 10px 14px;
            border-radius: 8px;
            border: 1px solid #ccc;
            box-shadow: 0 2px 8px rgba(132,23,186,0.06);
            margin-bottom: 2px;
          }
        }
        }

        .content-area {
          flex: 1;
          padding: 30px 40px;
          overflow-y: auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 30px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.07);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 3rem;
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          border-radius: 12px;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info h3 {
          margin: 0 0 5px 0;
          font-size: 2.5rem;
          font-weight: 700;
          color: #2d3748;
        }

        .stat-info p {
          margin: 0 0 10px 0;
          color: #718096;
          font-weight: 500;
        }

        .stat-badge {
          background: #e6fffa;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .recent-emergencies h2 {
          margin-bottom: 25px;
          color: #2d3748;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .emergency-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .emergency-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border-left: 4px solid #e53e3e;
        }

        .emergency-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .emergency-type {
          font-weight: 600;
          color: #2d3748;
        }

        .emergency-details p {
          margin: 5px 0;
          color: #718096;
          font-size: 0.9rem;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .content-header h2 {
          margin: 0;
          color: #2d3748;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .driver-cards, .student-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 25px;
        }

        .driver-card, .student-card {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.07);
          transition: transform 0.2s ease;
        }

        .driver-card:hover, .student-card:hover {
          transform: translateY(-2px);
        }

        .driver-header, .student-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .driver-avatar, .student-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .driver-info h3, .student-info h3 {
          margin: 0 0 5px 0;
          color: #2d3748;
          font-size: 1.2rem;
        }

        .driver-info p, .student-info p {
          margin: 0;
          color: #718096;
        }

        .username {
          color: #a0aec0 !important;
          font-size: 0.9rem;
        }

        .status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status.active {
          background: #c6f6d5;
          color: #22543d;
        }

        .status.inactive {
          background: #fed7d7;
          color: #742a2a;
        }

        .status.pending {
          background: #fef5e7;
          color: #7c2d12;
        }

        .status.resolved {
          background: #c6f6d5;
          color: #22543d;
        }

        .status.in_progress {
          background: #bee3f8;
          color: #2a4365;
        }

        .driver-details, .student-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f7fafc;
        }

        @media (max-width: 600px) {
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding: 8px 0;
          }
          .detail-row span:first-child {
            margin-bottom: 2px;
          }
          .detail-row span:last-child {
            margin-left: 0;
          }
        }

        .detail-row span:first-child {
          color: #718096;
          font-weight: 500;
        }

        .detail-row span:last-child {
          color: #2d3748;
          font-weight: 600;
        }

        .driver-actions, .student-actions {
          display: flex;
          gap: 10px;
        }

        .emergency-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .emergency-item {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border-left: 4px solid #e53e3e;
        }

        .emergency-main {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 15px;
        }

        .emergency-icon {
          font-size: 2rem;
        }

        .emergency-info h3 {
          margin: 0 0 8px 0;
          color: #2d3748;
        }

        .emergency-info p {
          margin: 3px 0;
          color: #718096;
          font-size: 0.9rem;
        }

        .location, .timestamp {
          color: #4a5568 !important;
        }

        .emergency-actions {
          display: flex;
          gap: 10px;
        }

        .analytics-content.redesigned-analytics h2 {
          margin-bottom: 30px;
          color: #2d3748;
          font-size: 1.7rem;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .analytics-filters {
          display: flex;
          gap: 15px;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 22px;
          margin-bottom: 38px;
        }
        .metric-card.modern {
          background: linear-gradient(120deg, #f3e9fa 0%, #e6e6ff 100%);
          padding: 28px 22px 22px 22px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 4px 16px rgba(132,23,186,0.10);
          transition: box-shadow 0.22s, transform 0.22s;
          border: 1.5px solid #e9e3f7;
        }
        .metric-card.modern:hover {
          box-shadow: 0 8px 28px rgba(132,23,186,0.16);
          transform: translateY(-2px) scale(1.03);
        }
        .metric-icon {
          font-size: 2.2rem;
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          border-radius: 12px;
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 2px 8px rgba(132,23,186,0.10);
        }
        .metric-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .metric-label {
          color: #6B1297;
          font-size: 1.02rem;
          font-weight: 500;
          margin-bottom: 2px;
        }
        .metric-value {
          color: #2d3748;
          font-size: 1.35rem;
          font-weight: 700;
        }

        .metric-change {
          font-size: 0.85rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .metric-change.positive {
          background: #c6f6d5;
          color: #22543d;
        }

        .charts-row {
          display: flex;
          flex-direction: row;
          gap: 28px;
          margin-bottom: 38px;
        }
        .chart-card.large.modern {
          background: #fff;
          border-radius: 18px;
          padding: 32px 28px 28px 28px;
          box-shadow: 0 4px 16px rgba(132,23,186,0.10);
          flex: 1 1 0;
          min-width: 320px;
        }
        .chart-card.large.modern h3 {
          margin-bottom: 18px;
          color: #6B1297;
          font-size: 1.18rem;
          font-weight: 700;
        }
        .revenue-chart.modern {
          height: 200px;
        }

        .chart-area {
          display: flex;
          align-items: end;
          gap: 20px;
          height: 150px;
          padding: 20px 0;
          justify-content: space-between;
        }

        .revenue-bar {
          flex: 1;
          background: linear-gradient(180deg, #8417BA 0%, #6B1297 100%);
          border-radius: 4px 4px 0 0;
          min-height: 20px;
          position: relative;
          transition: all 0.3s ease;
        }

        .revenue-bar:hover {
          opacity: 0.8;
        }

        .revenue-bar::after {
          content: attr(data-value);
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background: #2d3748;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .revenue-bar:hover::after {
          opacity: 1;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
        }

        .pie-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .pie-svg {
          width: 200px;
          height: 200px;
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-item span {
          font-size: 0.85rem;
          color: #4a5568;
        }

        .bottom-analytics.modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 28px;
          margin-top: 18px;
        }
        .analytics-card.modern {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 16px rgba(132,23,186,0.10);
          padding: 28px 24px 22px 24px;
          min-width: 320px;
        }
        .analytics-card.modern h3 {
          color: #8417BA;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .top-drivers-grid.modern {
          display: flex;
          flex-direction: row;
          gap: 18px;
          flex-wrap: wrap;
        }
        .driver-rank-card.modern {
          background: linear-gradient(120deg, #f3e9fa 0%, #e6e6ff 100%);
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(132,23,186,0.07);
          padding: 18px 16px 14px 16px;
          min-width: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border: 1.5px solid #e9e3f7;
          position: relative;
        }
        .driver-rank-card.modern.first-place {
          border: 2.5px solid #FFD700;
          box-shadow: 0 4px 18px rgba(255,215,0,0.10);
        }
        .driver-rank-header.modern {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
        }
        .driver-avatar-circle.modern {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .driver-rank-number.modern {
          font-size: 1.1rem;
          font-weight: 600;
          color: #8417BA;
        }
        .driver-rank-badge.modern {
          font-size: 1.3rem;
        }
        .driver-rank-info.modern {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .driver-rank-name.modern {
          font-weight: 600;
          color: #2d3748;
          font-size: 1.02rem;
        }
        .driver-rank-trips.modern {
          font-size: 0.92rem;
          color: #718096;
        }
        .growth-chart.modern {
          display: flex;
          flex-direction: row;
          gap: 18px;
          justify-content: space-between;
          align-items: stretch;
        }
        .growth-metric.modern {
          flex: 1 1 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #f7fafc;
          border-radius: 10px;
          margin: 0 2px;
          padding: 18px 0 14px 0;
          min-width: 100px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
          border-bottom: none;
        }
        .growth-label.modern {
          font-weight: 500;
          color: #4a5568;
        }
        .growth-value.modern {
          font-weight: 700;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .top-drivers {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .driver-rank {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #f7fafc;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .driver-rank:hover {
          background: #edf2f7;
        }

        .rank-number {
          font-size: 1.2rem;
          font-weight: 700;
          color: #8417BA;
          min-width: 30px;
        }

        .driver-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .driver-name {
          font-weight: 600;
          color: #2d3748;
        }

        .driver-stats {
          font-size: 0.85rem;
          color: #718096;
        }

        .rank-badge {
          font-size: 1.5rem;
        }

        .popular-routes {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .route-item {
          padding: 15px;
          background: #f7fafc;
          border-radius: 8px;
          border-left: 4px solid #8417BA;
        }

        .route-path {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .route-from, .route-to {
          font-weight: 600;
          color: #2d3748;
        }

        .route-arrow {
          color: #8417BA;
          font-weight: 700;
        }

        .route-stats {
          font-size: 0.85rem;
          color: #718096;
        }

        .growth-chart {
          display: flex;
          flex-direction: row;
          gap: 24px;
          justify-content: space-between;
          align-items: stretch;
        }
        @media (max-width: 700px) {
          .growth-chart {
            flex-direction: column;
            gap: 15px;
          }
        }

        .growth-metric {
          flex: 1 1 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #f7fafc;
          border-radius: 10px;
          margin: 0 2px;
          padding: 18px 0 14px 0;
          min-width: 120px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
          border-bottom: none;
        }

        .growth-metric:last-child {
          border-bottom: none;
        }

        .growth-label {
          font-weight: 500;
          color: #4a5568;
        }

        .growth-value {
          font-weight: 700;
          color: #2d3748;
        }

        .growth-change {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          background: #c6f6d5;
          color: #22543d;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          .chart-card.large {
            grid-column: auto;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          .bottom-analytics {
            grid-template-columns: 1fr;
          }
          .analytics-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }
        }

        .btn-primary {
          background: linear-gradient(135deg, #8417BA 0%, #6B1297 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(132, 23, 186, 0.3);
        }

        .btn-pro {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(90deg, #f8fafd 0%, #e6e6ff 100%);
          color: #5a189a;
          border: 1.5px solid #e0e0f0;
          padding: 11px 26px 11px 20px;
          border-radius: 11px;
          font-weight: 600;
          font-size: 1.04rem;
          cursor: pointer;
          transition: box-shadow 0.18s, background 0.18s, color 0.18s, border 0.18s, transform 0.13s;
          box-shadow: 0 2px 10px rgba(132,23,186,0.08);
          letter-spacing: 0.01em;
          position: relative;
          outline: none;
        }
        /* No icon or emoji in buttons, only text */
        .btn-pro.export-csv {
          border-color: #b794f4;
          background: linear-gradient(90deg, #f3e9fa 0%, #e6e6ff 100%);
        }
        .btn-pro.export-excel {
          border-color: #81e6d9;
          background: linear-gradient(90deg, #e6fffa 0%, #e6e6ff 100%);
        }
        .btn-pro.logout {
          background: #e53935;
          color: #fff;
          border: none;
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(229,57,53,0.10);
          padding: 12px 32px;
          border-radius: 12px;
          letter-spacing: 0.02em;
        }
        .btn-pro:hover, .btn-pro:focus {
          background: linear-gradient(90deg, #e6e6ff 0%, #f8fafd 100%);
          color: #8417BA;
          border-color: #8417BA;
          box-shadow: 0 6px 18px rgba(132,23,186,0.13);
          transform: translateY(-2px) scale(1.03);
        }
        .btn-pro.logout:hover, .btn-pro.logout:focus {
          background: #c62828;
          color: #fff;
          box-shadow: 0 6px 18px rgba(229,57,53,0.18);
          transform: translateY(-2px) scale(1.03);
        }
        .btn-pro.logout:active {
          background: #b71c1c;
          transform: scale(0.98);
        }
        .btn-pro:active {
          transform: scale(0.98);
        }

        .btn-danger {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-danger:hover {
          background: #c53030;
        }

        .filter-select {
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #4a5568;
          font-weight: 500;
        }

        .filters {
          display: flex;
          gap: 15px;
        }

        .password-field {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .eye-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          border-radius: 3px;
          transition: background-color 0.2s ease;
          font-size: 14px;
        }

        .eye-icon:hover {
          background: rgba(0,0,0,0.1);
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .content-header h2 {
          margin: 0;
          color: #2d3748;
          font-size: 1.8rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .search-input {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #4a5568;
          font-size: 0.9rem;
          width: 300px;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #8417BA;
          box-shadow: 0 0 0 3px rgba(132, 23, 186, 0.1);
        }

        .search-input::placeholder {
          color: #a0aec0;
        }

        @media (max-width: 1024px) {
          .sidebar {
            width: 250px;
          }
          .main-content {
            margin-left: 250px;
          }
        }

        @media (max-width: 768px) {
          .admin-dashboard {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            height: auto;
            position: static;
            padding: 20px 0;
          }
          .sidebar-nav {
            display: flex;
            overflow-x: auto;
            padding: 0 20px;
          }
          .nav-item {
            flex-shrink: 0;
            padding: 12px 20px;
          }
          .main-content {
            margin-left: 0;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .driver-cards, .student-cards {
            grid-template-columns: 1fr;
          }
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          .search-input {
            width: 100%;
            max-width: 300px;
          }
          .header-actions {
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;