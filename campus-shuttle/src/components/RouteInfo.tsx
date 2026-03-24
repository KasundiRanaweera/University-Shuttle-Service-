import React, { useState, useEffect } from 'react';
import { getDirections, formatDistance, formatDuration, calculateETA } from '../utils/googleMapsApi';

interface RouteInfoProps {
  startLocation: {
    name: string;
    lat: number;
    lng: number;
  };
  endLocation: {
    name: string;
    lat: number;
    lng: number;
  };
  departureTime: string;
  isLoading?: boolean;
}

interface RouteData {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  eta: string;
  polyline?: string;
}

const RouteInfo: React.FC<RouteInfoProps> = ({
  startLocation,
  endLocation,
  departureTime,
  isLoading = false,
}) => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drawRouteOnMap = (result: any) => {
    // This function would draw the polyline on the map
    // For now, it's a placeholder for future map integration
    console.log('Route polyline:', result.polyline);
  };

  useEffect(() => {
    if (!startLocation || !endLocation || !departureTime) return;

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);

      const result = await getDirections(
        { lat: startLocation.lat, lng: startLocation.lng },
        { lat: endLocation.lat, lng: endLocation.lng }
      );

      if (result.success) {
        const eta = calculateETA(departureTime, result.duration.value);
        setRouteData({
          distance: result.distance,
          duration: result.duration,
          eta,
          polyline: result.polyline,
        });
        
        // Draw route on map
        drawRouteOnMap(result);
      } else {
        setError('Failed to calculate route');
      }

      setLoading(false);
    };

    fetchRoute();
  }, [startLocation, endLocation, departureTime]);

  if (isLoading || loading) {
    return (
      <div className="route-info-card">
        <div className="loading-skeleton">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="route-info-card error">
        <p>{error}</p>
      </div>
    );
  }

  if (!routeData) {
    return null;
  }

  return (
    <div className="route-info-card">
      <div className="route-info-header">
        <h4>📍 Route Information</h4>
      </div>

      <div className="route-info-grid">
        {/* Distance */}
        <div className="info-item">
          <div className="info-icon">📏</div>
          <div className="info-content">
            <span className="info-label">Distance</span>
            <span className="info-value">{routeData.distance.text}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="info-item">
          <div className="info-icon">⏱️</div>
          <div className="info-content">
            <span className="info-label">Travel Time</span>
            <span className="info-value">{routeData.duration.text}</span>
          </div>
        </div>

        {/* ETA */}
        <div className="info-item">
          <div className="info-icon">🎯</div>
          <div className="info-content">
            <span className="info-label">Estimated Arrival</span>
            <span className="info-value">{routeData.eta}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .route-info-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 20px;
          border-radius: 12px;
          border: 2px solid rgba(132, 23, 186, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .route-info-card.error {
          background: rgba(244, 67, 54, 0.08);
          border-color: rgba(244, 67, 54, 0.3);
          color: #d32f2f;
        }

        .route-info-header {
          margin-bottom: 15px;
        }

        .route-info-header h4 {
          margin: 0;
          color: var(--primary, #8417ba);
          font-size: 1rem;
          font-weight: 600;
        }

        .route-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .info-icon {
          font-size: 1.5rem;
          min-width: 40px;
          text-align: center;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .info-label {
          font-size: 0.75rem;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
        }

        .info-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary, #8417ba);
          line-height: 1.2;
        }

        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-line {
          height: 60px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 768px) {
          .route-info-card {
            padding: 15px;
          }

          .route-info-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .info-item {
            padding: 10px;
          }

          .info-value {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RouteInfo;
