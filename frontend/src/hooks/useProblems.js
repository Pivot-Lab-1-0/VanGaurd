import { useState, useEffect, useCallback } from 'react'
import { getProblems } from '../services/api'

// ── Dummy data — used when backend is not running ──────────────────────────
export const DUMMY_PROBLEMS = [
  {
    id: 'prob-001', urgency: 9, status: 'dispatched',
    title: 'Child with critical fever — no transport',
    description: '4yr old, 104°F, 30km from nearest clinic.',
    required_skill: 'medical', confirmation_count: 2,
    latitude: 26.72, longitude: 75.52,
    address: 'Kalyanpura, Jaipur Dist.', created_at: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: 'prob-002', urgency: 8, status: 'open',
    title: 'Borewell contamination — entire village',
    description: 'Coliform bacteria detected. 340 residents affected.',
    required_skill: 'water_sanitation', confirmation_count: 0,
    latitude: 26.44, longitude: 74.63,
    address: 'Nayagaon, Ajmer Dist.', created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'prob-003', urgency: 6, status: 'in_progress',
    title: 'School roof collapse risk — monsoon damage',
    description: 'Structural damage to roof. 80 students at risk.',
    required_skill: 'construction', confirmation_count: 1,
    latitude: 26.23, longitude: 73.02,
    address: 'Mandore, Jodhpur Dist.', created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'prob-004', urgency: 5, status: 'dispatched',
    title: 'Severe malnutrition — 6 children under 5',
    description: 'MUAC measurements below 11.5cm. Immediate nutrition support needed.',
    required_skill: 'nutrition', confirmation_count: 0,
    latitude: 25.21, longitude: 75.86,
    address: 'Sultanpur, Kota Dist.', created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'prob-005', urgency: 3, status: 'open',
    title: 'Solar pump failure — irrigation blocked',
    description: 'Controller unit failed. 12 farmers losing crops.',
    required_skill: 'solar_energy', confirmation_count: 0,
    latitude: 24.58, longitude: 73.68,
    address: 'Nathdwara, Udaipur Dist.', created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'prob-006', urgency: 10, status: 'open',
    title: 'Snakebite — anti-venom needed urgently',
    description: 'Adult male, neurotoxic bite. Golden hour window closing.',
    required_skill: 'medical', confirmation_count: 0,
    latitude: 27.10, longitude: 76.60,
    address: 'Alwar rural zone', created_at: new Date(Date.now() - 8 * 60000).toISOString(),
  },
]

export const DUMMY_METRICS = {
  activeMissions:   14,
  verifiedHeroes:   38,
  resolvedToday:     6,
  criticalAlerts:    3,
  avgResponseMin:   22,
}

// ── Hook ───────────────────────────────────────────────────────────────────
export default function useProblems() {
  const [problems, setProblems]   = useState([])
  const [metrics,  setMetrics]    = useState(DUMMY_METRICS)
  const [loading,  setLoading]    = useState(true)
  const [error,    setError]      = useState(null)
  const [useDummy, setUseDummy]   = useState(false)

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProblems()
      const data = res.data.problems || []
      setProblems(data.length > 0 ? data : DUMMY_PROBLEMS)
      if (data.length === 0) setUseDummy(true)
      setError(null)
    } catch (err) {
      // Backend not running — fall back to dummy data gracefully
      console.warn('[Vanguard] Backend offline — using demo data.')
      setProblems(DUMMY_PROBLEMS)
      setUseDummy(true)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProblems()
    // Poll every 30s for live updates
    const interval = setInterval(fetchProblems, 30000)
    return () => clearInterval(interval)
  }, [fetchProblems])

  return { problems, metrics, loading, error, useDummy, refetch: fetchProblems }
}