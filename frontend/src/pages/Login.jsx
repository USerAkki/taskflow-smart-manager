import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@demo.com', password: '123456' })
    else setForm({ email: 'member@demo.com', password: '123456' })
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">TaskFlow</div>
            <div className="text-slate-500 text-xs">Smart Team Execution</div>
          </div>
        </div>

        <div className="card">
          <h1 className="text-white text-xl font-semibold mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-6">Sign in to your workspace</p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4 text-sm">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email" className="input pl-9"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password" className="input pl-9"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-2 py-2.5" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo creds */}
          <div className="mt-4 pt-4 border-t border-[#2d3748]">
            <p className="text-slate-500 text-xs text-center mb-2">Demo accounts</p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo('admin')} className="btn-secondary flex-1 text-xs py-1.5">
                Admin Demo
              </button>
              <button onClick={() => fillDemo('member')} className="btn-secondary flex-1 text-xs py-1.5">
                Member Demo
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-5">
          No account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

