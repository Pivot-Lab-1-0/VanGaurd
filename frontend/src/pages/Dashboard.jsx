import { useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import { Radio, Shield, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react'

import MetricCard    from '../components/dashboard/MetricCard'
import ReportFeed    from '../components/dashboard/ReportFeed'
import ProblemMarker from '../components/map/ProblemMarker'
import MapLegend     from '../components/map/MapLegend'
import DispatchModal from '../components/dashboard/DispatchModal'
import useProblems   from '../hooks/useProblems'

const MAP_CENTER = [26.5, 74.5]
const MAP_ZOOM   = 7
const TILE_URL   = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

// ── Inner component that can call useMap() (must be inside MapContainer) ──
function MapController({ target }) {
  const map = useMap()
  if (target) {
    map.flyTo([target.latitude, target.longitude], 11, { duration: 1.0 })
  }
  return null
}

export default function Dashboard() {
  const { problems, metrics, loading, useDummy, refetch } = useProblems()
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [flyTarget,       setFlyTarget]       = useState(null)
  const [showDispatch,    setShowDispatch]     = useState(false)

  function handleSelectProblem(problem) {
    setSelectedProblem(problem)
    if (problem?.latitude && problem?.longitude) {
      setFlyTarget(problem)
      // Reset so same problem can be re-clicked
      setTimeout(() => setFlyTarget(null), 1500)
    }
  }

  const criticalCount = problems.filter(p => p.urgency >= 8).length

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 52px)',
      overflow: 'hidden',
    }}>

      {/* ── METRICS BAR ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex',
        gap: 10,
        flexShrink: 0,
      }}>
        <MetricCard label="ACTIVE MISSIONS" value={metrics.activeMissions}
          accent="var(--accent-amber)" icon={Radio} sublabel="across all zones" />
        <MetricCard label="VERIFIED HEROES" value={metrics.verifiedHeroes}
          accent="var(--accent-blue)" icon={Shield} sublabel="volunteers online" />
        <MetricCard label="RESOLVED TODAY"  value={metrics.resolvedToday}
          accent="var(--accent-green)" icon={CheckCircle} sublabel="consensus confirmed" />
        <MetricCard label="CRITICAL ALERTS" value={criticalCount}
          accent="var(--accent-red)" icon={AlertTriangle} sublabel="urgency ≥ 8" />
        <MetricCard label="AVG RESPONSE" value={metrics.avgResponseMin}
          unit="m" accent="var(--accent-teal)" icon={Clock} sublabel="time to dispatch" />

        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={refetch} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 4,
            padding: '5px 10px', display: 'flex', alignItems: 'center',
            gap: 5, fontSize: 10, letterSpacing: '0.1em', fontFamily: 'inherit',
          }}>
            <RefreshCw size={10} /> REFRESH
          </button>
          {useDummy && (
            <div style={{ fontSize: 9, color: 'var(--accent-amber)', letterSpacing: '0.1em' }}>
              ⚡ DEMO MODE
            </div>
          )}
        </div>
      </div>

      {/* ── MAP + FEED ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>

          {/* Overlay header */}
          <div style={{
            position: 'absolute', top: 14, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(13,17,23,0.92)',
            border: '1px solid var(--border)',
            borderRadius: 4, padding: '5px 16px',
            fontSize: 9, letterSpacing: '0.2em',
            color: 'var(--text-secondary)', zIndex: 500,
            display: 'flex', alignItems: 'center', gap: 10,
            whiteSpace: 'nowrap',
          }}>
            <div className="blink" style={{
              width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-red)',
            }} />
            LIVE — RAJASTHAN THEATRE
            <span style={{ color: 'var(--border-bright)' }}>|</span>
            <span style={{ color: 'var(--accent-amber)' }}>{problems.length} REPORTS</span>
          </div>

          {loading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 600,
              background: 'rgba(8,12,16,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent-amber)' }}>
                LOADING INCIDENT DATA...
              </span>
            </div>
          )}

          {/* MapContainer — MUST have explicit pixel height, not % */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <MapContainer
              center={MAP_CENTER}
              zoom={MAP_ZOOM}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              scrollWheelZoom={true}
            >
              <TileLayer url={TILE_URL} attribution="© OpenStreetMap" />
              <ZoomControl position="bottomright" />
              <MapController target={flyTarget} />

              {problems.map(problem => (
                <ProblemMarker
                  key={problem.id}
                  problem={problem}
                  onSelect={handleSelectProblem}
                />
              ))}
            </MapContainer>
          </div>

          <MapLegend />

          {/* Selected problem action bar */}
          {selectedProblem && (
            <div style={{
              position: 'absolute', bottom: 20, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(13,17,23,0.96)',
              border: '1px solid var(--border-bright)',
              borderRadius: 4, padding: '10px 18px',
              zIndex: 500, display: 'flex', alignItems: 'center',
              gap: 16, minWidth: 380,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 8, color: 'var(--text-dim)',
                  letterSpacing: '0.15em', marginBottom: 2,
                }}>SELECTED INCIDENT</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {selectedProblem.title}
                </div>
              </div>
              <button
                onClick={() => setShowDispatch(true)}
                style={{
                  background: 'var(--accent-amber)', color: '#000',
                  border: 'none', borderRadius: 4, padding: '8px 14px',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>⚡ DISPATCH</button>
              <button
                onClick={() => setSelectedProblem(null)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', borderRadius: 4,
                  padding: '8px 10px', fontSize: 11, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>✕</button>
            </div>
          )}
        </div>

        {/* Feed panel */}
        <div style={{
          width: 320, flexShrink: 0,
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <ReportFeed
            problems={[...problems].sort((a, b) => b.urgency - a.urgency)}
            onSelect={handleSelectProblem}
            selectedId={selectedProblem?.id}
          />
        </div>
      </div>

      {/* Dispatch modal */}
      {showDispatch && selectedProblem && (
        <DispatchModal
          problem={selectedProblem}
          onClose={() => setShowDispatch(false)}
        />
      )}
    </div>
  )
}
