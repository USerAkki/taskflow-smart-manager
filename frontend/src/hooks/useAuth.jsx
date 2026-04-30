import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tf_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(res => { setUser(res.data); localStorage.setItem('tf_user', JSON.stringify(res.data)) })
      .catch(() => { localStorage.removeItem('tf_token'); localStorage.removeItem('tf_user'); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('tf_token', data.token)
    localStorage.setItem('tf_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const signup = async (name, email, password, role) => {
    const { data } = await api.post('/auth/signup', { name, email, password, role })
    localStorage.setItem('tf_token', data.token)
    localStorage.setItem('tf_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('tf_token')
    localStorage.removeItem('tf_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

