# Google Maps Integration for Driver Dashboard Route Management

## Overview

This document describes the Google Maps integration implemented in the Driver Dashboard for route management with interactive location selection.

## Features Implemented

### 1. **GoogleMapsLocationPicker Component**

- **File**: `src/components/GoogleMapsLocationPicker.tsx`
- **Features**:
  - Interactive Google Map for location selection
  - Predefined location buttons for quick selection (popular campus areas)
  - Real-time search functionality for location filtering
  - Click-on-map capability for custom location selection
  - InfoWindow popup showing selected location details
  - Coordinates display (Latitude, Longitude)
  - Responsive design for mobile and desktop

### 2. **DriverDashboard Route Management Updates**

- **File**: `src/pages/DriverDashboard.tsx`
- **Changes**:
  - Replaced static select dropdowns with interactive Google Maps pickers
  - Extended route form state to include:
    - `startLat`, `startLng`: Start location coordinates
    - `endLat`, `endLng`: End location coordinates
    - `startPlaceId`, `endPlaceId`: Location identifiers
  - Added location picker modal state management
  - Updated form validation to require location selection
  - Disabled submit button until all required fields are filled
  - New styling for location input groups and map buttons

### 3. **Predefined Locations**

The component includes popular campus and city locations:

- University of Colombo
- Moratuwa University
- NIBM Campus
- Rajagiriya Junction
- Nugegoda Town
- Dehiwala Junction
- Moratuwa Town
- Colombo City Center

## Installation

### Step 1: Install Dependencies

```bash
npm install @react-google-maps/api
```

### Step 2: Configure Google Maps API Key

1. **Get an API Key**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project
   - Enable these APIs:
     - Maps JavaScript API
     - Places API
     - Maps API

2. **Set Up Environment Variables**:
   - Create a `.env` file in the project root (or update existing):
     ```
     VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```

3. **Security Note**:
   - The current implementation includes a fallback API key (for testing only)
   - In production, use environment variables and API key restrictions

## Usage

### Using the Location Picker in DriverDashboard

1. **Open Location Picker**:
   - Click "📍 Pick Location" button next to Start Location or End Location

2. **Select a Location**:
   - **Option A**: Click a predefined location button
   - **Option B**: Search for a location using the search bar
   - **Option C**: Click directly on the map to select custom coordinates

3. **Confirm Selection**:
   - Location details appear in the "Selected Location" section
   - Click "Confirm Location" to set the location
   - The map picker closes and location name appears in the form

4. **Submit Route**:
   - Both start and end locations must be selected
   - All required fields filled (times + locations)
   - Click "Update Route" to submit

## Data Structure

### Route Form State

```typescript
interface RouteForm {
  departureTime: string; // HH:mm format
  arrivalTime: string; // HH:mm format
  startLocation: string; // Location name
  endLocation: string; // Location name
  startLat: number; // Latitude
  startLng: number; // Longitude
  endLat: number; // Latitude
  endLng: number; // Longitude
  startPlaceId: string; // Place identifier
  endPlaceId: string; // Place identifier
}
```

## Styling

### CSS Classes

- `.location-input-group`: Container for location input and button
- `.location-display`: Read-only input showing selected location
- `.open-map-btn`: Button to open Google Maps picker
- `.location-picker-overlay`: Full-screen modal overlay
- `.location-picker-modal`: Modal dialog container
- `.location-btn`: Predefined location buttons
- `.map-section`: Google Map container

### Responsive Design

- Desktop: Full-width modal with side-by-side location buttons
- Tablet: Adapted grid layout for medium screens
- Mobile: Optimized for portrait orientation with flexible buttons

## Customization

### Add More Predefined Locations

Edit `GoogleMapsLocationPicker.tsx`:

```typescript
const predefinedLocations: LocationData[] = [
  { name: 'Location Name', lat: 6.xxxx, lng: 80.xxxx, placeId: 'unique_id' },
  // Add more...
];
```

### Modify Map Center

```typescript
const mapCenter = { lat: 7.8731, lng: 80.7718 }; // Default: Sri Lanka center
```

### Change Map Zoom Level

```typescript
<GoogleMap
  zoom={markerPosition ? 14 : 9}  // 14 when location selected, 9 otherwise
/>
```

## Backend Integration

When integrating with your backend API:

1. **Send route data**:

```typescript
const routeData = {
  departureTime: routeForm.departureTime,
  arrivalTime: routeForm.arrivalTime,
  startLocation: {
    name: routeForm.startLocation,
    coordinates: [routeForm.startLat, routeForm.startLng],
    placeId: routeForm.startPlaceId,
  },
  endLocation: {
    name: routeForm.endLocation,
    coordinates: [routeForm.endLat, routeForm.endLng],
    placeId: routeForm.endPlaceId,
  },
};
```

2. **Handle coordinates on backend**:
   - Store coordinates for mapping and routing services
   - Use placeIds for caching and updates
   - Validate coordinates are within valid ranges

## Troubleshooting

### API Key Issues

- **Error**: "Google Maps API is not initialized"
  - Ensure API key is set in `.env` file
  - Verify APIs are enabled in Google Cloud Console
  - Check for API key restrictions

### Map Not Displaying

- Verify LoadScript component is loading correctly
- Check browser console for API errors
- Ensure container has defined height

### Locations Not Appearing

- Verify predefined locations coordinates are correct
- Check for typos in location names
- Ensure map can receive click events

## Future Enhancements

1. **Reverse Geocoding**: Convert coordinates to address automatically
2. **Route Optimization**: Calculate best route between start and end
3. **Traffic Integration**: Show real-time traffic data
4. **Route History**: Save and reuse previous routes
5. **Autocomplete**: Address autocomplete for quicker selection
6. **Multiple Stops**: Add support for waypoints/stops
7. **Distance Calculator**: Show distance between selected locations
8. **Time Estimation**: Estimate travel time based on traffic

## Dependencies

```json
{
  "@react-google-maps/api": "^2.19.2",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.4.2"
}
```

## Files Modified

1. **package.json** - Added Google Maps API dependency
2. **src/pages/DriverDashboard.tsx** - Integrated location picker
3. **src/components/GoogleMapsLocationPicker.tsx** - New component (created)
4. **.env** - Added Google Maps API key configuration
5. **.env.example** - Added documentation template

## Support

For issues or enhancements:

1. Check predefined locations are correct
2. Verify Google Cloud Console configuration
3. Review browser console for error messages
4. Ensure API key has proper scopes enabled
