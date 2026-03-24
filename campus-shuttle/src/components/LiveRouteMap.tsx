/// <reference types="vite/client" />

import React, { useState, useEffect } from 'react';
import { ensureGoogleMapsLoaded } from '../utils/googleMapsLoader';

interface RouteMapProps {
  startLocation?: { lat: number; lng: number; name: string };
  endLocation?: { lat: number; lng: number; name: string };
  shuttlePosition?: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number };
  isTracking?: boolean;
}

const LiveRouteMap: React.FC<RouteMapProps> = ({
  startLocation,
  endLocation,
  shuttlePosition,
  driverLocation,
  isTracking = false,
}) => {
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (!mapInitialized) {
      initializeMap();
    }
  }, []); // Empty dependency array - only run once on mount

  // Redraw map when locations change
  useEffect(() => {
    if (mapInitialized) {
      drawMap();
    }
  }, [startLocation, endLocation, driverLocation, shuttlePosition]);

  const initializeMap = async () => {
    try {
      // Use centralized loader
      await ensureGoogleMapsLoaded();
      drawMap();
      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const drawMap = () => {
    if (!window.google?.maps) {
      setTimeout(() => drawMap(), 100);
      return;
    }

    const mapDiv = document.getElementById('live-route-map-container');
    if (!mapDiv) return;

    mapDiv.innerHTML = '';

    // Default center (Sri Lanka)
    const center = startLocation 
      ? { lat: startLocation.lat, lng: startLocation.lng }
      : { lat: 6.9271, lng: 80.7744 };

    const map = new window.google.maps.Map(mapDiv, {
      center,
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    // Draw start marker
    if (startLocation) {
      new window.google.maps.Marker({
        position: { lat: startLocation.lat, lng: startLocation.lng },
        map: map,
        title: startLocation.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      // Add label for start location
      new window.google.maps.Marker({
        position: {
          lat: startLocation.lat + 0.003,
          lng: startLocation.lng,
        },
        map: map,
        label: '📍 Start',
        icon: {
          path: 'M0,0',
          fillOpacity: 0,
          strokeOpacity: 0,
          scale: 0,
        },
      });
    }

    // Draw end marker
    if (endLocation) {
      new window.google.maps.Marker({
        position: { lat: endLocation.lat, lng: endLocation.lng },
        map: map,
        title: endLocation.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF6B6B',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      // Add label for end location
      new window.google.maps.Marker({
        position: {
          lat: endLocation.lat + 0.003,
          lng: endLocation.lng,
        },
        map: map,
        label: '🎯 End',
        icon: {
          path: 'M0,0',
          fillOpacity: 0,
          strokeOpacity: 0,
          scale: 0,
        },
      });
    }

    // Draw shuttle current position
    if (shuttlePosition) {
      new window.google.maps.Marker({
        position: { lat: shuttlePosition.lat, lng: shuttlePosition.lng },
        map: map,
        title: 'Current Position',
        icon: {
          path: 'M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12.5,7H11V13L16.2,16.2L17,15.3L12.5,12.4V7Z',
          scale: 1.2,
          fillColor: '#7c3aed',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          anchor: new window.google.maps.Point(12, 12),
        },
      });
    }

    // Draw driver's current location (GPS tracking)
    if (driverLocation) {
      new window.google.maps.Marker({
        position: { lat: driverLocation.lat, lng: driverLocation.lng },
        map: map,
        title: 'Driver Location (GPS)',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#2196F3',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
      });

      // Add accuracy circle (blue zone) around driver
      if ((window as any).accuracyCircle) {
        (window as any).accuracyCircle.setMap(null);
      }
      (window as any).accuracyCircle = new window.google.maps.Circle({
        center: { lat: driverLocation.lat, lng: driverLocation.lng },
        radius: 20, // Default 20 meters
        map: map,
        fillColor: '#2196F3',
        fillOpacity: 0.1,
        strokeColor: '#2196F3',
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });

      // Add label for driver location
      new window.google.maps.Marker({
        position: {
          lat: driverLocation.lat + 0.003,
          lng: driverLocation.lng,
        },
        map: map,
        label: '🚗 You',
        icon: {
          path: 'M0,0',
          fillOpacity: 0,
          strokeOpacity: 0,
          scale: 0,
        },
      });
    }

    // Draw polyline between start and end
    if (startLocation && endLocation) {
      new window.google.maps.Polyline({
        path: [
          { lat: startLocation.lat, lng: startLocation.lng },
          { lat: endLocation.lat, lng: endLocation.lng },
        ],
        geodesic: true,
        strokeColor: '#7c3aed',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map,
      });

      // Fit bounds to show all relevant markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: startLocation.lat, lng: startLocation.lng });
      bounds.extend({ lat: endLocation.lat, lng: endLocation.lng });
      
      // Include driver's location in bounds if tracking
      if (driverLocation) {
        bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
      }
      
      map.fitBounds(bounds);
    } else if (driverLocation) {
      // If only driver location exists, center on it
      map.setCenter({ lat: driverLocation.lat, lng: driverLocation.lng });
      map.setZoom(15);
    }

    // Store map reference
    (window as any).liveRouteMap = map;
  };

  return (
    <div className="live-route-map-wrapper">
      <div id="live-route-map-container" className="live-route-map-container"></div>

      {/* Status Overlay */}
      {isTracking && (
        <div className="map-status-overlay">
          <div className="status-badge">
            <span className="pulse-dot"></span>
            <span>LIVE TRACKING ACTIVE</span>
          </div>
        </div>
      )}

      <style>{`
        .live-route-map-wrapper {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: 12px;
          overflow: hidden;
          background: #f0f0f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .live-route-map-container {
          width: 100%;
          height: 100%;
          background: #e5e3df;
        }

        .map-status-overlay {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 8px 16px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-weight: 600;
          font-size: 12px;
          color: #333;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #ff4444;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 600px) {
          .live-route-map-wrapper {
            height: 300px;
          }

          .status-badge {
            padding: 6px 12px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveRouteMap;
