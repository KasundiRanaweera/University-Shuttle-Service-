import React from 'react'
import SearchBar from './SearchBar'
import ShuttleCard from './ShuttleCard'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const mockRides = [
  { route: 'Route A', time: '08:30', status: 'Available' },
  { route: 'Route B', time: '09:00', status: 'Full' },
  { route: 'Route C', time: '09:30', status: '3 seats' },
]

export default function HeroUI() {
  const [rides] = React.useState(mockRides)
  const [titleRef, titleVisible] = useScrollAnimation<HTMLHeadingElement>({ threshold: 0.2 });
  const [leadRef, leadVisible] = useScrollAnimation<HTMLParagraphElement>({ threshold: 0.2 });
  const [searchRef, searchVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const [statsRef, statsVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const [ridesRef, ridesVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div className="hero-ui">
      <div className="hero-left">
        <h2 
          ref={titleRef} 
          className={`fade-down ${titleVisible ? 'visible' : ''}`}
        >
          Campus Shuttle
        </h2>
        <p 
          ref={leadRef} 
          className={`lead fade-up ${leadVisible ? 'visible' : ''}`}
        >
          Quickly find and book shuttles around campus
        </p>

        <div 
          ref={searchRef} 
          className={`search-container fade-right ${searchVisible ? 'visible' : ''}`}
        >
          <SearchBar onSearch={(q) => console.log('search', q)} />
        </div>

        <div 
          ref={statsRef} 
          className={`stats fade-left ${statsVisible ? 'visible' : ''}`}
        >
          {/* Removed Active Routes stat button */}
          <div className="stat">
            <div className="num">230</div>
            <div className="label">Passengers Today</div>
          </div>
        </div>
      </div>

      <div className="hero-right">
        <div 
          ref={ridesRef} 
          className={`ui-preview fade-left ${ridesVisible ? 'visible' : ''}`}
        >
          <h3>Upcoming Rides</h3>
          <div className="rides-list">
            {rides.map((r) => (
              <ShuttleCard key={r.route} route={r.route} time={r.time} status={r.status} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
