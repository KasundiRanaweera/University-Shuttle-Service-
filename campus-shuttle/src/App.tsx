import ConfirmEmail from './pages/ConfirmEmail';
import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './components/LandingPage'
import AboutUs from './components/AboutUs'
import Contact from './components/Contact'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'
import ShuttleBooking from './pages/ShuttleBooking'
import DriverDashboard from './pages/DriverDashboard'
import DriverProfile from './pages/DriverProfile'
import AdminDashboard from './pages/AdminDashboard'
import './styles/animations.css' // Import animations

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={
          <Layout>
            <main className="main-content">
              <LandingPage />
              <AboutUs />
              <Contact />
            </main>
          </Layout>
        } />
        <Route path="/student-dashboard" element={
          <Layout>
            <StudentDashboard />
          </Layout>
        } />
        <Route path="/student-profile" element={
          <Layout>
            <StudentProfile />
          </Layout>
        } />
        <Route path="/shuttle-booking" element={
          <Layout>
            <ShuttleBooking />
          </Layout>
        } />
        <Route path="/driver-dashboard" element={
          <Layout>
            <DriverDashboard />
          </Layout>
        } />
        <Route path="/driver-profile" element={
          <Layout>
            <DriverProfile />
          </Layout>
        } />
        <Route path="/admin-dashboard" element={
          <Layout>
            <AdminDashboard />
          </Layout>
        } />
        <Route path="/contact" element={
          <Layout>
            <Contact />
          </Layout>
        } />
        <Route path="/about" element={
          <Layout>
            <AboutUs />
          </Layout>
        } />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
      </Routes>
    </>
  )
}