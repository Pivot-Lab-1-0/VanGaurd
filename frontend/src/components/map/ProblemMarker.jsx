import { Marker, Popup } from 'react-leaflet'

export default function ProblemMarker({ problem, onSelect }) {
  if (!problem?.latitude || !problem?.longitude) return null

  return (
    <Marker
      position={[problem.latitude, problem.longitude]}
      eventHandlers={{ click: () => onSelect(problem) }}
    >
      <Popup>
        <div style={{ minWidth: 180 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{problem.title}</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>{problem.address || 'Location unknown'}</div>
        </div>
      </Popup>
    </Marker>
  )
}
