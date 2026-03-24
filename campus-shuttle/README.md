<p align="center">
   <img src="https://i.postimg.cc/xjMxPPTX/Screenshot-2026-03-23-120710.png" alt="Campus Shuttle Site Preview" width="800" />
</p>

# Campus Shuttle — Frontend (UI)

A modern React + TypeScript web app for campus shuttle management, featuring admin, driver, and student dashboards, real-time route tracking, Google Maps integration, and Firebase hosting.

---

## 🚀 Features

- **Admin Dashboard**: Manage drivers, students, shuttle routes, emergencies, analytics, and pricing.
- **Driver Dashboard**: View assigned routes, mark attendance, and use Google Maps for route management.
- **Student Dashboard**: Book seats, view shuttle schedules, and track shuttles live.
- **Emergency Reporting**: Real-time emergency report management and resolution.
- **Google Maps Integration**: Interactive location pickers, route info, and distance/ETA calculation.
- **Supabase Backend**: For authentication and data storage.
- **Firebase Hosting**: Fast, secure deployment.
- **Export/Import**: Download analytics as CSV/Excel.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: CSS, FontAwesome
- **APIs**: Google Maps (Directions, Distance Matrix, Geocoding, Places)
- **Backend**: Supabase (Postgres, Auth)
- **Hosting**: Firebase Hosting

---

## 📦 Project Structure

```
campus-shuttle/
├── public/
├── src/
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Main app pages (AdminDashboard, DriverDashboard, etc.)
│   ├── styles/             # CSS files
│   ├── utils/              # Utility functions (Google Maps, etc.)
│   └── firebase.ts         # Firebase config
├── database_schema.sql     # Postgres schema
├── GOOGLE_MAPS_INTEGRATION.md
├── GOOGLE_MAPS_SETUP_COMPLETE.md
├── firebase.json           # Firebase Hosting config
├── package.json            # NPM scripts & dependencies
└── README.md
```

---

## ⚡ Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Set up environment variables:**
   - Create a `.env` file in the root:
     ```
     VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     ```
3. **Run the dev server:**
   ```sh
   npm run dev
   ```
4. **Build for production:**
   ```sh
   npm run build
   ```
5. **Preview production build:**
   ```sh
   npm run preview
   ```

---

## 🌐 Deployment

### Deploy to Firebase Hosting

1. **Build the app:**
   ```sh
   npm run build
   ```
2. **Deploy:**
   ```sh
   firebase deploy --only hosting
   ```
3. **Live URL:**
   [https://campus-shutle.web.app](https://campus-shutle.web.app)

---

## 🗺️ Google Maps Integration

- Uses Directions, Distance Matrix, Geocoding, and Places APIs.
- See `GOOGLE_MAPS_INTEGRATION.md` and `GOOGLE_MAPS_SETUP_COMPLETE.md` for setup and usage details.
- Main location picker: `src/components/GoogleMapsLocationPicker.tsx`
- Route info: `src/components/RouteInfo.tsx`

---

## 🔥 Firebase Hosting

- Configured via `firebase.json`.
- Public files served from `dist/` after build.
- All routes rewritten to `index.html` for SPA support.

---

## 📊 Analytics & Export

- Admins can export analytics as CSV or Excel.
- Uses `xlsx` for Excel export.

---

## 📚 Useful Scripts

- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run preview` — Preview production build

---

## 📝 Notes

- Make sure your Google Maps API key is enabled for all required APIs.
- Supabase and Firebase credentials should be kept secure.
- For more details, see the markdown docs in this repo.

---

## 👀 Live Demo

[https://campus-shutle.web.app](https://campus-shutle.web.app)

---

## 📄 License

MIT
