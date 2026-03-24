/// <reference types="vite/client" />

/**
 * Google Maps API Utilities
 * Handles all Google Maps API calls (Directions, Distance Matrix, Geocoding, Places)
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Get directions route between two locations
 * @param startLocation - Starting point coordinates or address
 * @param endLocation - Ending point coordinates or address
 * @returns Route info with polyline, distance, duration, steps
 */
export const getDirections = async (
  startLocation: { lat: number; lng: number },
  endLocation: { lat: number; lng: number }
) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${startLocation.lat},${startLocation.lng}` +
        `&destination=${endLocation.lat},${endLocation.lng}` +
        `&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        success: true,
        distance: leg.distance, // { text: "5.2 km", value: 5200 }
        duration: leg.duration, // { text: "12 mins", value: 720 }
        durationInTraffic: leg.duration_in_traffic || leg.duration,
        polyline: route.overview_polyline.points, // For drawing on map
        steps: leg.steps, // Turn-by-turn directions
        route: route,
      };
    } else {
      return { success: false, error: data.status };
    }
  } catch (error) {
    console.error('Directions API Error:', error);
    return { success: false, error: error };
  }
};

/**
 * Calculate distance and duration between multiple locations
 * @param origins - Array of start points
 * @param destinations - Array of end points
 * @returns Matrix of distances and durations
 */
export const getDistanceMatrix = async (
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>
) => {
  try {
    const originsStr = origins.map((o) => `${o.lat},${o.lng}`).join('|');
    const destinationsStr = destinations.map((d) => `${d.lat},${d.lng}`).join('|');

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${originsStr}` +
        `&destinations=${destinationsStr}` +
        `&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return {
        success: true,
        rows: data.rows, // Matrix of results
        originAddresses: data.origin_addresses,
        destinationAddresses: data.destination_addresses,
      };
    } else {
      return { success: false, error: data.status };
    }
  } catch (error) {
    console.error('Distance Matrix API Error:', error);
    return { success: false, error: error };
  }
};

/**
 * Convert address to coordinates (Geocoding)
 * @param address - Address string to geocode
 * @returns Coordinates and location details
 */
export const geocodeAddress = async (address: string) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}` +
        `&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.results.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
      };
    } else {
      return { success: false, error: 'Address not found' };
    }
  } catch (error) {
    console.error('Geocoding API Error:', error);
    return { success: false, error: error };
  }
};

/**
 * Reverse geocoding - convert coordinates to address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address and location details
 */
export const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
        `latlng=${lat},${lng}` +
        `&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.results.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        address: result.formatted_address,
        placeId: result.place_id,
      };
    } else {
      return { success: false, error: 'Address not found' };
    }
  } catch (error) {
    console.error('Reverse Geocoding Error:', error);
    return { success: false, error: error };
  }
};

/**
 * Get place details from Places API
 * @param placeId - Google Places ID
 * @returns Detailed place information
 */
export const getPlaceDetails = async (placeId: string) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}` +
        `&fields=name,formatted_address,geometry,opening_hours,rating,photos` +
        `&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      const place = data.result;
      return {
        success: true,
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        rating: place.rating,
        openNow: place.opening_hours?.open_now,
        photos: place.photos,
      };
    } else {
      return { success: false, error: data.status };
    }
  } catch (error) {
    console.error('Place Details API Error:', error);
    return { success: false, error: error };
  }
};

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (km or m)
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

/**
 * Format duration for display
 * @param seconds - Duration in seconds
 * @returns Formatted string (hours, mins, secs)
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};

/**
 * Calculate ETA based on start time and travel duration
 * @param startTime - Start time in HH:mm format
 * @param durationSeconds - Travel duration in seconds
 * @returns ETA in HH:mm format
 */
export const calculateETA = (startTime: string, durationSeconds: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Math.ceil(durationSeconds / 60);

  const etaHours = Math.floor(totalMinutes / 60) % 24;
  const etaMinutes = totalMinutes % 60;

  return `${String(etaHours).padStart(2, '0')}:${String(etaMinutes).padStart(2, '0')}`;
};
