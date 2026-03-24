import React from 'react'
import HeroUI from '../components/HeroUI'

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <HeroUI />
      </section>

      <section className="map-and-list">
        <div className="map-placeholder">[Map placeholder — Google Maps will be integrated here]</div>
        <aside className="bookings">
          <h3>Upcoming Rides</h3>
          <ul>
            <li>Route A — 08:30 — Available</li>
            <li>Route B — 09:00 — Full</li>
            <li>Route C — 09:30 — 3 seats</li>
          </ul>
        </aside>
      </section>
    </div>
  )
}
