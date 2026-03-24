import React, { useState, useEffect } from 'react';
import RouteMap from './RouteMap';

interface RouteTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData?: any;
}

const RouteTrackingModal: React.FC<RouteTrackingModalProps> = ({
  isOpen,
  onClose,
  bookingData
}) => {
  const [currentStop, setCurrentStop] = useState(1);
  const [eta, setEta] = useState('15 min');
  const [status, setStatus] = useState('In Transit');

  // Simulate real-time tracking
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentStop(prev => {
        if (prev >= 3) return 3; // Max stop index
        return prev + Math.random() > 0.7 ? 1 : 0;
      });

      // Update ETA and status based on current stop
      if (currentStop === 0) {
        setStatus('Preparing');
        setEta('20 min');
      } else if (currentStop === 1) {
        setStatus('In Transit');
        setEta('15 min');
      } else if (currentStop === 2) {
        setStatus('Approaching');
        setEta('5 min');
      } else {
        setStatus('Arrived');
        setEta('Arrived');
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, currentStop]);

  if (!isOpen) return null;

  // Sample route coordinates (you can replace with actual coordinates)
  const route: [number, number][] = [
    [6.9271, 79.8612], // Start: Main Campus
    [6.9147, 79.9725], // Stop 1: University Gate
    [6.9000, 79.9580], // Stop 2: Library
    [6.8650, 79.8997], // End: City Center
  ];

  const shuttlePosition: [number, number] = route[Math.min(currentStop + 1, route.length - 1)];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'modalSlideIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#333',
              fontFamily: 'keylinx, sans-serif'
            }}>
              🚐 Live Route Tracking
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              {bookingData?.shuttleData?.busNumber || 'BUS 101'} • {status}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Map Container */}
        <div style={{ height: '400px', position: 'relative' }}>
          <RouteMap
            route={route}
            shuttlePosition={shuttlePosition}
            currentStop={currentStop}
            isTracking={true}
          />
        </div>

        {/* Trip Details */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e0e0e0',
          background: '#f8f9fa'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#8417BA',
                marginBottom: '4px'
              }}>
                {eta}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Estimated Arrival</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#8417BA',
                marginBottom: '4px'
              }}>
                {currentStop + 1}/4
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Stops Completed</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#8417BA',
                marginBottom: '4px'
              }}>
                {bookingData?.selectedSeats?.join(', ') || '1, 2'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Your Seats</div>
            </div>
          </div>

          {/* Route Stops */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Route Progress
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {['Main Campus', 'University Gate', 'Library', 'City Center'].map((stop, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: index <= currentStop ? '#28a745' : '#ddd',
                    marginBottom: '4px',
                    transition: 'all 0.3s ease'
                  }} />
                  <div style={{
                    fontSize: '0.7rem',
                    color: index <= currentStop ? '#28a745' : '#666',
                    textAlign: 'center',
                    fontWeight: index === currentStop ? 'bold' : 'normal'
                  }}>
                    {stop}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default RouteTrackingModal;