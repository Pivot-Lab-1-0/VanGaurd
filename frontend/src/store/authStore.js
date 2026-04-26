import { create } from 'zustand'

/**
 * Vanguard Auth Store
 * Persists to sessionStorage so refresh doesn't log you out mid-demo.
 */

const STORAGE_KEY = 'vanguard_session'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(user) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export const useAuthStore = create((set, get) => ({
  user:    loadSession(),   // { id, phone, name, role }
  loading: false,
  error:   null,

  setLoading: (v)    => set({ loading: v }),
  setError:   (msg)  => set({ error: msg }),
  clearError: ()     => set({ error: null }),

  login: (userData) => {
    saveSession(userData)
    set({ user: userData, error: null })
  },

  logout: () => {
    clearSession()
    set({ user: null })
  },

  isAuthenticated: () => !!get().user,
  isRole: (role)   => get().user?.role === role,
}))