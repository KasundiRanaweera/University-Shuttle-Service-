import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom shuttle icon - using a more reliable icon
const shuttleIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMzYgMiA1IDUuMTM2IDUgOUM1IDkuODY0IDYuMTM2IDEyIDggMTJDOS44NjQgMTIgMTIgOS44NjQgMTIgOUMxMiA1LjEzNiAxNC44NjQgMiAxOCA1QzIxLjEzNiA1IDI0IDguMTM2IDI0IDEyQzI0IDE1Ljg2NCAyMS4xMzYgMTkgMTggMTlIMTZMMjAgMjJIMTZMMTggMTJDMTYuOSA5LjkgMTUuOSAxMCAxNSAxMEMxNC4xIDEwIDEzLjEgOS45IDEyIDlDMTMuMSAxMC4xIDE0LjEgMTEgMTUgMTFDMTUuOSAxMSAxNi45IDEwLjEgMTggMTFaIiBmaWxsPSIjODQxN0JBIi8+Cjwvc3ZnPgo=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Stop icons - using simple colored circles
const stopIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyMTk2RjMiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

const completedStopIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM0Q0FGNTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

interface RouteMapProps {
  route?: [number, number][];
  shuttlePosition?: [number, number];
  currentStop?: number;
  isTracking?: boolean;
}

const RouteMap: React.FC<RouteMapProps> = ({
  route = [
    [6.9271, 79.8612], // Colombo
    [6.9147, 79.9725], // Rajagiriya
    [6.9000, 79.9580], // Nugegoda
    [6.8650, 79.8997], // Moratuwa
  ],
  shuttlePosition,
  currentStop = 1,
  isTracking = false
}) => {
  // Validate route coordinates
  const validRoute = route.filter(coord =>
    Array.isArray(coord) &&
    coord.length === 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number' &&
    !isNaN(coord[0]) &&
    !isNaN(coord[1])
  );

  const [currentShuttlePos, setCurrentShuttlePos] = useState<[number, number]>(
    shuttlePosition || validRoute[1] || validRoute[0]
  );

  // Simulate shuttle movement if tracking is enabled
  useEffect(() => {
    if (!isTracking || validRoute.length < 2) return;

    const interval = setInterval(() => {
      setCurrentShuttlePos(prev => {
        // Simple simulation - move towards next stop
        const nextStopIndex = Math.min(currentStop + 1, validRoute.length - 1);
        const nextStop = validRoute[nextStopIndex];
        const currentIndex = validRoute.findIndex(([lat, lng]) =>
          Math.abs(lat - prev[0]) < 0.001 && Math.abs(lng - prev[1]) < 0.001
        );

        if (currentIndex >= validRoute.length - 1) return prev;

        // Move 10% towards next stop
        const latDiff = nextStop[0] - prev[0];
        const lngDiff = nextStop[1] - prev[1];

        return [
          prev[0] + latDiff * 0.1,
          prev[1] + lngDiff * 0.1
        ];
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isTracking, currentStop, validRoute]);

  const getStopIcon = (stopIndex: number) => {
    if (stopIndex < currentStop) return completedStopIcon;
    if (stopIndex === currentStop) return shuttleIcon;
    return stopIcon;
  };

  const getStopStatus = (stopIndex: number) => {
    if (stopIndex < currentStop) return 'Completed';
    if (stopIndex === currentStop) return 'Current Stop';
    return 'Upcoming';
  };

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        Route: {validRoute.length} stops | Current: Stop {currentStop + 1}
      </div>
      <MapContainer
        center={[6.9271, 79.8612]} // Fixed center coordinates
        zoom={11}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {validRoute.length > 1 && (
          <Polyline
            positions={validRoute}
            pathOptions={{ color: 'purple', weight: 4, opacity: 0.8 }}
          />
        )}
        {validRoute.map((pos, idx) => (
          <Marker
            position={pos}
            key={`marker-${idx}`}
            icon={getStopIcon(idx)}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>Stop {idx + 1}</strong><br />
                <small>{getStopStatus(idx)}</small>
              </div>
            </Popup>
          </Marker>
        ))}
        <Marker
          position={currentShuttlePos}
          icon={shuttleIcon}
          key="shuttle-marker"
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong>🚐 Shuttle Location</strong><br />
              <small>Live Tracking Active</small>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {isTracking && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 12px',
          borderRadius: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          🔴 LIVE
        </div>
      )}
    </div>
  );
};

export default RouteMap;
