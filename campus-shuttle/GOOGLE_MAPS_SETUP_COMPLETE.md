# 🚗 Complete Google Maps API Integration Guide

## ✅ What We've Set Up

### 1. **Directions API** ✅

- Calculates route between two locations
- Returns distance, travel time, and ETA
- Used in: `RouteInfo` component

### 2. **Distance Matrix API** ✅

- Calculate distances between multiple locations
- Used in: Utility function (ready to use)

### 3. **Geocoding API** ✅

- Convert addresses ↔ coordinates
- Included in utilities (ready to use)

### 4. **Places API** ✅

- Get place details
- Included in utilities (ready to use)

---

## 📁 New Files Created

| File                            | Purpose                            |
| ------------------------------- | ---------------------------------- |
| `src/utils/googleMapsApi.ts`    | All API utility functions          |
| `src/components/RouteInfo.tsx`  | Display route info (distance, ETA) |
| `src/pages/DriverDashboard.tsx` | Updated with RouteInfo integration |

---

## 🔑 Quick Setup

### Step 1: Ensure API Key is Set

In `.env` file:

```
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY
```

### Step 2: Enable APIs in Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Library

Enable these:

- ✅ Maps JavaScript API
- ✅ Directions API
- ✅ Distance Matrix API
- ✅ Geocoding API
- ✅ Places API

### Step 3: Test in DriverDashboard

1. Open DriverDashboard
2. Select Start Location (using map picker)
3. Select End Location (using map picker)
4. Set Departure Time
5. **RouteInfo card appears** showing:
   - 📏 Distance
   - ⏱️ Travel Time
   - 🎯 Estimated Arrival (ETA)

---

## 💻 How to Use Each API in Your Code

### **1. Get Directions & ETA**

```typescript
import { getDirections, calculateETA } from "@/utils/googleMapsApi";

const result = await getDirections(
  { lat: 6.9271, lng: 80.7744 }, // Start
  { lat: 6.865, lng: 80.6389 }, // End
);

if (result.success) {
  console.log("Distance:", result.distance.text); // "5.2 km"
  console.log("Duration:", result.duration.text); // "12 mins"
  console.log("ETA:", calculateETA("14:30", result.duration.value)); // "14:42"
}
```

### **2. Calculate Distances Between Multiple Locations**

```typescript
import { getDistanceMatrix } from "@/utils/googleMapsApi";

const result = await getDistanceMatrix(
  [
    { lat: 6.9271, lng: 80.7744 }, // Origin 1
    { lat: 6.865, lng: 80.6389 }, // Origin 2
  ],
  [
    { lat: 6.9, lng: 79.958 }, // Destination 1
    { lat: 6.865, lng: 79.8997 }, // Destination 2
  ],
);

// Returns matrix of all distances
console.log(result.rows); // Array of distance/duration pairs
```

### **3. Convert Address to Coordinates**

```typescript
import { geocodeAddress } from "@/utils/googleMapsApi";

const result = await geocodeAddress("Rajagiriya, Colombo");
// { lat: 6.9147, lng: 79.9725, formattedAddress: "...", placeId: "..." }
```

### **4. Convert Coordinates to Address (Reverse)**

```typescript
import { reverseGeocode } from "@/utils/googleMapsApi";

const result = await reverseGeocode(6.9147, 79.9725);
// { address: "Rajagiriya Junction, Colombo", placeId: "..." }
```

### **5. Get Place Details**

```typescript
import { getPlaceDetails } from "@/utils/googleMapsApi";

const result = await getPlaceDetails("ChIJ...");
// { name: "...", address: "...", rating: 4.5, ... }
```

### **6. Format Functions**

```typescript
import { formatDistance, formatDuration } from "@/utils/googleMapsApi";

formatDistance(5200); // "5.2 km"
formatDuration(720); // "12m"
```

---

## 🎯 How It Works in DriverDashboard

```
1. Driver opens DriverDashboard
   ↓
2. Driver clicks "📍 Pick Location" → GoogleMapsLocationPicker opens
   ↓
3. Driver selects location → Coordinates stored (lat, lng)
   ↓
4. Driver does same for End Location + sets Departure Time
   ↓
5. RouteInfo component triggers automatically:
   - Calls getDirections() with start/end coordinates
   - Gets distance, duration, polyline
   - Calculates ETA using calculateETA()
   ↓
6. Card displays:
   📏 Distance: 5.2 km
   ⏱️ Travel Time: 12 mins
   🎯 Estimated Arrival: 14:42
```

---

## 🚀 Advanced Features (Ready to Add)

### **Show Turn-by-Turn Directions**

```typescript
const result = await getDirections(start, end);
result.steps.forEach((step) => {
  console.log(step.html_instructions); // Each turn instruction
});
```

### **Draw Route on Map**

```typescript
// Use result.polyline to draw on Leaflet map
const polyline = L.polyline(decodedPolyline, { color: "blue" });
polyline.addTo(map);
```

### **Find Nearest Pickup Points**

```typescript
// Use Distance Matrix to find closest pickup
const origins = [currentLocation]; // Driver's current position
const destinations = [stop1, stop2, stop3]; // Possible pickups

const result = await getDistanceMatrix(origins, destinations);
// Sort by distance to find nearest
```

### **Multi-Stop Route Optimization** (Future)

Use Route Optimization API when you have multiple pickups/dropoffs.

---

## 🔍 Testing

### Test in Browser Console

```javascript
// Import utilities (if exposed)
const result = await getDirections(
  { lat: 6.9271, lng: 80.7744 },
  { lat: 6.865, lng: 80.6389 },
);
console.log(result);
```

### Check API Usage

Go to [Google Cloud Console](https://console.cloud.google.com/)
→ APIs & Services → Library → Click each API → View metrics

---

## 💰 Pricing Notes

**Free Tier** (up to $200/month credit):

- Directions API: $7 per 1000 requests
- Distance Matrix: $7 per 1000 requests
- Geocoding: $5 per 1000 requests
- Places API: $7 per 1000 requests

**For campus shuttle**: Probably free tier is enough (unless 1000s of requests/day)

---

## 🐛 Troubleshooting

| Problem                | Solution                                          |
| ---------------------- | ------------------------------------------------- |
| "API key invalid"      | Check `.env` file has correct key                 |
| "API not enabled"      | Enable APIs in Google Cloud Console               |
| "CORS error"           | Add API restrictions in Cloud Console             |
| No route found         | Check coordinates are valid (within Earth bounds) |
| "Daily quota exceeded" | Upgrade API quota in Google Cloud Console         |

---

## 📋 What's Working Now

✅ **RouteInfo Component**

- Displays distance automatically
- Shows travel time automatically
- Calculates ETA based on departure time
- Fresh design with icons

✅ **GoogleMapsLocationPicker**

- Select locations with map
- Stores coordinates
- Predefined locations for quick selection

✅ **DriverDashboard Integration**

- Route info shows when locations selected
- All data flows correctly
- Responsive design

---

## 🎨 Next Steps (Optional Features)

1. **Add "Save Route" button** → Save to database
2. **Show turn-by-turn directions** → Draw each step
3. **Real-time traffic** → Show live traffic on route
4. **Multiple stops** → Add waypoints (Rajagiriya → Nugegoda → Campus)
5. **Route history** → Reuse previous routes
6. **Sharing** → Share route with students

---

## 📞 Need Help?

Check the console (F12) for error messages. Most issues are:

- Missing API key
- APIs not enabled
- Invalid coordinates

All error messages will tell you exactly what's wrong!
