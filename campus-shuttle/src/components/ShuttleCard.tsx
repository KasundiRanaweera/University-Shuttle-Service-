import React from 'react'

type Props = {
  route: string
  time: string
  status: string
}

export default function ShuttleCard({ route, time, status }: Props) {
  const statusClass = status.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="shuttle-card modern">
      <div className="shuttle-card-icon">
        <i className="fas fa-bus"></i>
      </div>
      <div className="shuttle-top">
        <strong className="route">{route}</strong>
        <span className="time">
          <i className="far fa-clock" style={{ marginRight: 4, color: '#8417BA' }}></i>
          {time}
        </span>
      </div>
      <div className="shuttle-bottom">
        <span className={`status ${statusClass}`}>{status}</span>
        <button className="book">
          <i className="fas fa-ticket-alt" style={{ marginRight: 6 }}></i>
          Book
        </button>
      </div>
    </div>
  );
}
