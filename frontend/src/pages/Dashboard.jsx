import { useState, useEffect } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import {
  AlertTriangle, CheckCircle2, Flame, Activity,
  Users, X, Shield, User, Loader
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#64748b'
}

// ── StatCard — supports optional onClick to make the card interactive ─────────
function StatCard({ icon: Icon, label, value, onClick }) {
  const isClickable = typeof onClick === 'function'
  return (
    <div
      className={`card transition-all duration-150 ${
        isClickable
          ? 'cursor-pointer hover:border-brand-500/50 hover:scale-[1.02] active:scale-[0.98]'
          : ''
      }`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs">{label}</p>
          <p className="text-white text-2xl font-bold">{value ?? 0}</p>
        </div>
        <Icon size={18} className={isClickable ? 'text-brand-400' : 'text-slate-500'} />
      </div>
      {isClickable && (
        <p className="text-brand-400/60 text-[10px] mt-2">Click to view →</p>
      )}
    </div>
  )
}

function TaskRow({ task }) {
  if (!task) return null
  return (
    <div className="py-2 border-b border-[#1e2535]">
      <p className="text-white text-sm">{task.title || 'Untitled'}</p>
      {task.projectId?.name && (
        <p className="text-slate-500 text-xs mt-0.5">{task.projectId.name}</p>
      )}
    </div>
  )
}

// ── Team Members Modal ─────────────────────────────────────────────────────────
function MembersModal({ members, loading, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#161b27] border border-[#2d3748] rounded-2xl w-full max-w-md shadow-2xl fade-in flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
              <Users size={15} className="text-brand-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Team Members</h2>
              <p className="text-slate-500 text-xs">
                {loading ? 'Loading...' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-[#1a1f2e]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader size={24} className="text-brand-400 animate-spin" />
              <p className="text-slate-400 text-sm">Fetching team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Users size={36} className="text-slate-600" />
              <p className="text-slate-400 text-sm">No members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-3 bg-[#1a1f2e] border border-[#2d3748] rounded-xl hover:border-brand-500/20 transition-all"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                    {member.role === 'admin'
                      ? <Shield size={14} className="text-brand-400" />
                      : <User size={14} className="text-slate-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 text-sm font-medium truncate">
                      {member.name || 'Unnamed'}
                    </p>
                    <p className="text-slate-500 text-xs truncate">
                      {member.email || '—'}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${
                    member.role === 'admin'
                      ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {member.role || 'member'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2d3748] flex-shrink-0">
          <button onClick={onClose} className="btn-secondary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Team Members modal state ───────────────────────────────────────────────
  const [members, setMembers] = useState([])
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    api.get('/dashboard/insights')
      .then(res => {
        setData(res.data)
        setError(null)
      })
      .catch(err => {
        console.error('[Dashboard] Failed to load insights:', err.message || err)
        setError('Failed to load dashboard data. Please try refreshing.')
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Open members modal and fetch list ─────────────────────────────────────
  const handleOpenMembers = async () => {
    setShowMembersModal(true)
    setLoadingMembers(true)
    try {
      const res = await api.get('/dashboard/members')
      setMembers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('[Dashboard] Failed to load members:', err.message || err)
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleCloseMembers = () => {
    setShowMembersModal(false)
    // Keep members cached so re-open is instant
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-16">
        <AlertTriangle size={36} className="mx-auto text-red-400 mb-3" />
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    )
  }

  // ── Safe data extraction with fallbacks ───────────────────────────────────
  const summary = data?.summary || {}

  const statusBreakdown = Array.isArray(data?.statusBreakdown)
    ? data.statusBreakdown
    : []

  const priorityBreakdown = data?.priorityBreakdown || {}
  const overdueTasks = Array.isArray(data?.overdueTasks)
    ? data.overdueTasks
    : []

  // ── Safe chart data — charts must never receive empty arrays ─────────────
  const safeStatusData = statusBreakdown.length
    ? statusBreakdown
    : [{ label: 'No Data', count: 0, color: '#2d3748' }]

  const priorityChartData = Object.entries(priorityBreakdown).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: typeof val === 'number' ? val : 0,
    color: PRIORITY_COLORS[key] || '#64748b'
  }))

  const safePriorityData = priorityChartData.length
    ? priorityChartData
    : [{ name: 'None', value: 1, color: '#2d3748' }]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-white text-2xl font-bold">
        Welcome back, {user?.name || 'User'} 👋
      </h1>

      {/* Stats — Team Members card is clickable for admin */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks"    value={summary.totalTasks    ?? 0} icon={Activity}      />
        <StatCard label="Completed"      value={summary.doneTasks     ?? 0} icon={CheckCircle2}  />
        <StatCard label="Overdue"        value={summary.overdueCount  ?? 0} icon={AlertTriangle} />
        <StatCard label="Critical"       value={summary.criticalCount ?? 0} icon={Flame}         />
        {user?.role === 'admin' && (
          <StatCard
            label="Team Members"
            value={summary.totalUsers ?? 0}
            icon={Users}
            onClick={handleOpenMembers}
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Status Bar Chart */}
        <div className="card p-4">
          <h3 className="text-white text-sm font-semibold mb-3">Task Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={safeStatusData}>
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#161b27', border: '1px solid #2d3748', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {safeStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Pie Chart */}
        <div className="card p-4">
          <h3 className="text-white text-sm font-semibold mb-3">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={safePriorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                labelLine={false}
              >
                {safePriorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#161b27', border: '1px solid #2d3748', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue Tasks */}
      <div className="card p-4">
        <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          Overdue Tasks
        </h3>
        {overdueTasks.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No overdue tasks 🎉</p>
        ) : (
          overdueTasks.map(t => <TaskRow key={t._id} task={t} />)
        )}
      </div>

      {/* Admin-only project count card */}
      {user?.role === 'admin' && summary.totalProjects != null && (
        <div className="card text-center py-4">
          <p className="text-white text-2xl font-bold">{summary.totalProjects}</p>
          <p className="text-slate-500 text-xs mt-1">Total Projects</p>
        </div>
      )}

      {/* Team Members Modal */}
      {showMembersModal && (
        <MembersModal
          members={members}
          loading={loadingMembers}
          onClose={handleCloseMembers}
        />
      )}
    </div>
  )
}
