import React from 'react'

export default function SearchBar({ onSearch }: { onSearch?: (q: string) => void }) {
  const [q, setQ] = React.useState('')

  return (
    <div className="search-bar">
      <input
        aria-label="pickup-location"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Enter pickup location"
      />
      <button
        onClick={() => {
          onSearch?.(q)
        }}
      >
        Search
      </button>
    </div>
  )
}
