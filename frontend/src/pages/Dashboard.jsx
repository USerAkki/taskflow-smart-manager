import { useState, useEffect } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import {
  AlertTriangle, CheckCircle2, Flame, Activity
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#64748b'
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs">{label}</p>
          <p className="text-white text-2xl font-bold">{value ?? 0}</p>
        </div>
        <Icon size={18} className="text-slate-500" />
      </div>
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

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks"   value={summary.totalTasks   ?? 0} icon={Activity}      />
        <StatCard label="Completed"     value={summary.doneTasks    ?? 0} icon={CheckCircle2}  />
        <StatCard label="Overdue"       value={summary.overdueCount ?? 0} icon={AlertTriangle} />
        <StatCard label="Critical"      value={summary.criticalCount ?? 0} icon={Flame}        />
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

      {/* Admin-only stats */}
      {user?.role === 'admin' && (summary.totalProjects != null || summary.totalUsers != null) && (
        <div className="grid grid-cols-2 gap-4">
          {summary.totalProjects != null && (
            <div className="card text-center py-4">
              <p className="text-white text-2xl font-bold">{summary.totalProjects}</p>
              <p className="text-slate-500 text-xs mt-1">Total Projects</p>
            </div>
          )}
          {summary.totalUsers != null && (
            <div className="card text-center py-4">
              <p className="text-white text-2xl font-bold">{summary.totalUsers}</p>
              <p className="text-slate-500 text-xs mt-1">Total Users</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
