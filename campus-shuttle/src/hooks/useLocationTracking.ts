import { useState, useEffect, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

interface UseLocationTrackingReturn {
  location: Location | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

/**
 * Hook for real-time GPS tracking of driver's location
 */
export const useLocationTracking = (): UseLocationTrackingReturn => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation: Location = {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: Date.now(),
        };
        setLocation(newLocation);
        console.log('Initial location:', newLocation);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(`Error getting location: ${err.message}`);
        setIsTracking(false);
      }
    );

    // Watch for location changes
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const newLocation: Location = {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: Date.now(),
        };
        setLocation(newLocation);
        console.log('Location updated:', newLocation, { heading, speed });
      },
      (err) => {
        console.error('Watch position error:', err);
        setError(`Tracking error: ${err.message}`);
      },
      {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 10000,
        maximumAge: 0, // Always get fresh location
      }
    );

    setWatchId(id);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    console.log('Location tracking stopped');
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
};
