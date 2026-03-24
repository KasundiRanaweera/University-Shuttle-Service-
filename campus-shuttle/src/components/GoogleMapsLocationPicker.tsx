/// <reference types="vite/client" />

import React, { useState, useEffect } from 'react';
import { ensureGoogleMapsLoaded } from '../utils/googleMapsLoader';

declare global {
  interface Window {
    google: any;
  }
}

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (location: string, lat: number, lng: number, placeId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface LocationData {
  name: string;
  lat: number;
  lng: number;
  placeId: string;
}

const GoogleMapsLocationPicker: React.FC<LocationPickerProps> = ({
  label,
  value,
  onChange,
  onClose,
  isOpen,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Predefined college/university locations
  const predefinedLocations: LocationData[] = [];  // Empty - drivers can select anywhere

  useEffect(() => {
    if (isOpen && !mapInitialized) {
      initializeMapAsync();
    } else if (!isOpen && mapInitialized) {
      // Clean up when modal closes
      const mapDiv = document.getElementById('google-map-container');
      if (mapDiv) {
        mapDiv.innerHTML = '';
      }
      
      setMapInitialized(false);
      setSelectedLocation(null);
      setSearchInput('');
      setSearchResults([]);
      setShowResults(false);
    }
  }, [isOpen]);

  const initializeMapAsync = async () => {
    try {
      await ensureGoogleMapsLoaded();
      drawMap();
      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const drawMap = () => {
    try {
      if (!window.google?.maps) {
        console.error('Google Maps API not loaded yet');
        return;
      }

      const mapDiv = document.getElementById('google-map-container');
      if (!mapDiv) {
        console.error('Map container not found');
        return;
      }

      // Clear container for fresh map
      mapDiv.innerHTML = '';

      const map = new window.google.maps.Map(mapDiv, {
        center: { lat: 6.9271, lng: 80.7744 },
        zoom: 12,
      });

      let selectedMarker: any = null;

      // Click handler for map
      map.addListener('click', (event: any) => {
        if (!event.latLng) return;
        
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        if (selectedMarker) {
          selectedMarker.setMap(null);
        }

        selectedMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        });

        // Get address from coordinates using reverse geocoding
        reverseGeocodeLocation(lat, lng);

        setSelectedLocation({
          name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          lat,
          lng,
          placeId: `custom_${Date.now()}`,
        });
      });

      // Store map references globally
      (window as any).mapInstance = map;
      (window as any).activeMap = map;
      (window as any).selectedMarker = selectedMarker;
      
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error drawing map:', error);
    }
  };

  const reverseGeocodeLocation = (lat: number, lng: number) => {
    try {
      if (!window.google?.maps) return;

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            setSelectedLocation(prev => 
              prev ? { ...prev, name: address } : null
            );
          }
        }
      );
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleLocationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchInput(query);

    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (!window.google?.maps) {
      console.warn('Google Maps not loaded yet');
      setSearchResults([]);
      return;
    }

    try {
      // Use Geocoding API to search for locations
      const geocoder = new window.google.maps.Geocoder();
      
      const request = { 
        address: query,
        language: 'en'
      };

      geocoder.geocode(request, (results: any[], status: string) => {
        console.log('Geocoding status:', status);
        
        if (status === window.google.maps.GeocoderStatus.OK && results) {
          console.log(`Found ${results.length} results for "${query}"`);
          
          // Filter results to Sri Lanka region if needed
          const sriLankaResults = results.filter((result: any) => {
            const lat = result.geometry.location.lat?.() || result.geometry.location.lat;
            const lng = result.geometry.location.lng?.() || result.geometry.location.lng;
            return lat >= 5.9 && lat <= 7.7 && lng >= 79.65 && lng <= 81.88;
          });

          const resultsToShow = sriLankaResults.length > 0 ? sriLankaResults : results;
          
          const formattedResults = resultsToShow.slice(0, 5).map((result: any) => ({
            name: result.formatted_address.split(',')[0],
            formatted_address: result.formatted_address,
            geometry: result.geometry,
            place_id: result.place_id
          }));
          
          setSearchResults(formattedResults);
          setShowResults(true);
        } else if (status === window.google.maps.GeocoderStatus.ZERO_RESULTS) {
          console.log(`No results found for "${query}"`);
          setSearchResults([]);
          setShowResults(false);
        } else if (status === 'REQUEST_DENIED') {
          console.error('REQUEST_DENIED: Check if Geocoding API is enabled in Google Cloud Console');
          alert('Search is not available. Please ensure Geocoding API is enabled in Google Cloud Console.');
          setSearchResults([]);
        } else {
          console.error(`Geocoder status: ${status}`);
          setSearchResults([]);
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const selectSearchResult = (place: any) => {
    try {
      if (!place?.geometry?.location) {
        console.error('No geometry location in place object');
        return;
      }

      // Handle both function and direct value formats
      let lat: number, lng: number;
      
      if (typeof place.geometry.location.lat === 'function') {
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
      } else {
        lat = place.geometry.location.lat;
        lng = place.geometry.location.lng;
      }

      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates:', lat, lng);
        return;
      }

      const name = place.name || place.formatted_address || 'Selected Location';

      // Update map
      const map = (window as any).activeMap;
      if (map && window.google?.maps) {
        map.setCenter({ lat, lng });
        map.setZoom(15);

        if ((window as any).selectedMarker) {
          (window as any).selectedMarker.setMap(null);
        }

        (window as any).selectedMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: name,
        });
      } else {
        console.warn('Map not available for update');
      }

      setSelectedLocation({
        name,
        lat,
        lng,
        placeId: place.place_id || `custom_${Date.now()}`,
      });

      setSearchInput(name);
      setShowResults(false);
      setSearchResults([]);
      
      console.log('Selected location:', name, 'at', lat, lng);
    } catch (error) {
      console.error('Error selecting search result:', error);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
  };

  const handleConfirmSelection = () => {
    if (selectedLocation) {
      onChange(
        selectedLocation.name,
        selectedLocation.lat,
        selectedLocation.lng,
        selectedLocation.placeId
      );
      setMapInitialized(false);
      onClose();
    }
  };

  const filteredLocations = predefinedLocations.filter(loc =>
    loc.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="location-picker-overlay">
      <div className="location-picker-modal">
        {/* Search Section - Top */}
        <div className="search-header">
          <div className="search-inputs">
            <div className="search-input-group">
              <span className="input-icon">📍</span>
              <input
                type="text"
                placeholder="Start location"
                value={searchInput}
                onChange={handleLocationSearch}
                className="location-search-input"
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => selectSearchResult(result)}
                  >
                    <div className="result-icon">📍</div>
                    <div className="result-content">
                      <div className="result-name">{result.name}</div>
                      <div className="result-address">{result.formatted_address}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button className="close-header-btn" onClick={onClose}>✕</button>
        </div>

        {/* Map Section - Middle */}
        <div id="google-map-container" className="google-map-container"></div>

        {/* Selected Location Info - Bottom */}
        {selectedLocation && (
          <div className="location-info-footer">
            <div className="location-details-section">
              <div className="location-pin">📍</div>
              <div className="location-text">
                <div className="location-name">{selectedLocation.name}</div>
                <div className="location-coords">
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="footer-actions">
              <button
                className="cancel-footer-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="confirm-footer-btn"
                onClick={handleConfirmSelection}
              >
                Confirm Location
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .location-picker-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          z-index: 9999;
        }

        .location-picker-modal {
          background: white;
          border-radius: 20px 20px 0 0;
          width: 100%;
          height: 90vh;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
          overflow: hidden;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .search-header {
          background: white;
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .search-inputs {
          flex: 1;
          position: relative;
        }

        .search-input-group {
          display: flex;
          align-items: center;
          background: #f8f8f8;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 12px;
          gap: 10px;
          transition: all 0.2s;
        }

        .search-input-group:focus-within {
          border-color: #7c3aed;
          background: white;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .input-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .location-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
          font-family: inherit;
        }

        .location-search-input::placeholder {
          color: #999;
        }

        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-top: none;
          border-radius: 0 0 12px 12px;
          max-height: 300px;
          overflow-y: auto;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          z-index: 1001;
          margin-top: 4px;
        }

        .search-result-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          border-bottom: 1px solid #f0f0f0;
        }

        .search-result-item:hover {
          background-color: #f9f5ff;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .result-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .result-content {
          flex: 1;
          min-width: 0;
        }

        .result-name {
          font-weight: 600;
          color: #333;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .result-address {
          font-size: 12px;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .close-header-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          transition: color 0.2s;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .close-header-btn:hover {
          color: #333;
        }

        .google-map-container {
          flex: 1;
          background: #f0f0f0;
          position: relative;
          overflow: hidden;
        }

        .location-info-footer {
          background: white;
          border-top: 1px solid #e0e0e0;
          padding: 16px;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
        }

        .location-details-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: #f9f5ff;
          border-radius: 12px;
          border-left: 4px solid #7c3aed;
        }

        .location-pin {
          font-size: 24px;
          flex-shrink: 0;
        }

        .location-text {
          flex: 1;
          min-width: 0;
        }

        .location-name {
          font-weight: 600;
          color: #333;
          font-size: 14px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location-coords {
          font-size: 12px;
          color: #888;
        }

        .footer-actions {
          display: flex;
          gap: 10px;
        }

        .cancel-footer-btn,
        .confirm-footer-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .cancel-footer-btn {
          background: #f0f0f0;
          color: #333;
        }

        .cancel-footer-btn:hover {
          background: #e0e0e0;
        }

        .confirm-footer-btn {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
        }

        .confirm-footer-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
        }

        @media (max-width: 600px) {
          .location-picker-modal {
            max-width: 100%;
            height: 95vh;
            border-radius: 16px 16px 0 0;
          }

          .search-header {
            padding: 12px;
          }

          .location-info-footer {
            padding: 12px;
          }

          .footer-actions {
            gap: 8px;
          }

          .cancel-footer-btn,
          .confirm-footer-btn {
            padding: 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleMapsLocationPicker;
