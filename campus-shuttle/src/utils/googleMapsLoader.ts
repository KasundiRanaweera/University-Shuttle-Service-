/// <reference types="vite/client" />

let mapsLoadPromise: Promise<void> | null = null;
let isLoading = false;
let isLoaded = false;

/**
 * Centralized Google Maps loader that ensures the script is loaded only once
 * and provides a promise-based interface for components
 */
export const loadGoogleMaps = (): Promise<void> => {
  // If already loaded or loading, return the existing promise
  if (isLoaded) {
    return Promise.resolve();
  }

  if (isLoading && mapsLoadPromise) {
    return mapsLoadPromise;
  }

  // Create the load promise
  mapsLoadPromise = new Promise((resolve, reject) => {
    isLoading = true;

    // Check if already in window
    if (window.google?.maps) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    
    if (existingScript) {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          isLoaded = true;
          isLoading = false;
          resolve();
        }
      }, 50);
      
      // Safety timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps) {
          isLoading = false;
          reject(new Error('Google Maps script timeout'));
        }
      }, 10000);
      
      return;
    }

    // Load the script
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAoJf23q1BgcZWxuxJa2QOpZtoYjXzvTwE';
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = false;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      console.log('Google Maps script loaded successfully');
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      console.error('Failed to load Google Maps script');
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return mapsLoadPromise;
};

/**
 * Utility to ensure Google Maps is available
 */
export const ensureGoogleMapsLoaded = async (): Promise<void> => {
  try {
    await loadGoogleMaps();
  } catch (error) {
    console.error('Error ensuring Google Maps loaded:', error);
    throw error;
  }
};
