import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Shield, MapPin, Radio, LogOut } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Shield, roles: ['ngo'] },
  { to: '/report', label: 'Report', icon: MapPin, roles: ['ngo', 'villager'] },
  { to: '/volunteer', label: 'Volunteer', icon: Radio, roles: ['ngo', 'volunteer'] },
]

export default function Navbar() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '12px 20px', background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: 'var(--accent-blue)', color: '#fff', display: 'grid',
          placeItems: 'center', fontWeight: 700, letterSpacing: '0.1em',
        }}>
          V
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Vanguard</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Impact Pipeline</div>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {navItems.map(item => (
          item.roles.includes(user?.role) && (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', color: 'var(--text-primary)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 6, textDecoration: 'none', fontSize: 12,
                fontWeight: 700,
              }}
            >
              <item.icon size={14} /> {item.label}
            </Link>
          )
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{user?.name || 'Guest'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{user?.role || 'visitor'}</div>
        </div>
        {user && (
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        )}
      </div>
    </header>
  )
}
