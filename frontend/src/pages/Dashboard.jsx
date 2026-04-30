import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts'
import {
  AlertTriangle, Clock, TrendingUp, CheckCircle2,
  Users, FolderKanban, Flame, AlertCircle, ArrowRight, Activity, Plus
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const PRIORITY_COLORS = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#64748b'
}

function StatCard({ icon: Icon, label, value, sub, color = 'brand', alert, onClick, title }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    red:   'text-red-400 bg-red-500/10 border-red-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue:  'text-blue-400 bg-blue-500/10 border-blue-500/20'
  }

  return (
    <div
      onClick={onClick}
      title={title}
      className={`card relative overflow-hidden ${alert ? 'border-red-500/30' : ''} ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-brand-500/40 transition-all duration-200' : ''
      }`}>
      {alert && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  )
}

function TeamMembersModal({ members, loading, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] w-full max-w-[420px] rounded-2xl p-6 shadow-xl border border-gray-800 fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Team Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            X
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 py-6 text-center">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-400 py-6 text-center">No members found</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {members.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {m.name?.[0]?.toUpperCase() || 'U'}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                </div>

                <span className={`text-xs px-2 py-1 rounded-full capitalize flex-shrink-0 ${
                  m.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PriorityBadge({ label }) {
  const map = {
    critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low'
  }
  return <span className={map[label] || 'badge-low'}>{label}</span>
}

function TaskRow({ task }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '-'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#1e2535] last:border-0 hover:bg-[#1a1f2e] -mx-1 px-1 rounded transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-sm font-medium truncate">{task.title}</p>
        <p className="text-slate-500 text-xs truncate">{task.projectId?.name || '-'}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isOverdue && <span className="text-red-400 text-xs font-medium">Overdue</span>}
        <span className="text-slate-500 text-xs">{deadlineStr}</span>
        <PriorityBadge label={task.priorityLabel} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    api.get('/dashboard/insights')
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const handleOpenMembers = async () => {
    try {
      setLoadingMembers(true)
      setShowMembersModal(true)
      const { data } = await api.get('/dashboard/members')
      setMembers(data)
    } catch {
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load insights</div>

  const { summary, statusBreakdown, priorityBreakdown, workloadByMember, projectHealth, overdueTasks, criticalTasks, upcoming48h } = data

  const priorityChartData = Object.entries(priorityBreakdown).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1), value: val, color: PRIORITY_COLORS[key]
  })).filter(d => d.value > 0)
  const hasNoWork = summary.totalTasks === 0 && (!summary.totalProjects || summary.totalProjects === 0)
  const activityItems = [
    ...overdueTasks.slice(0, 2).map(t => ({ id: `overdue-${t._id}`, text: `${t.title} needs attention`, meta: 'Overdue task' })),
    ...upcoming48h.slice(0, 2).map(t => ({ id: `upcoming-${t._id}`, text: `${t.title} is due soon`, meta: 'Next 48 hours' })),
    ...criticalTasks.slice(0, 2).map(t => ({ id: `critical-${t._id}`, text: `${t.title} is marked critical`, meta: 'Priority signal' }))
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Mission Control</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Hi {user?.name || 'there'} - here's your team's execution status
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Tasks" value={summary.totalTasks}
          sub={`${summary.completionRate}% complete`} color="brand" />
        <StatCard icon={CheckCircle2} label="Completed" value={summary.doneTasks}
          sub="tasks done" color="green" />
        <StatCard icon={AlertTriangle} label="Overdue" value={summary.overdueCount}
          sub="need attention" color="red" alert={summary.overdueCount > 0} />
        <StatCard icon={Flame} label="Critical" value={summary.criticalCount}
          sub="high-risk tasks" color="amber" alert={summary.criticalCount > 0} />
      </div>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={FolderKanban} label="Projects" value={summary.totalProjects} color="blue" />
          <StatCard
            icon={Users}
            label="Team Members"
            value={summary.totalUsers}
            color="brand"
            onClick={handleOpenMembers}
            title="View all team members"
          />
        </div>
      )}

      {hasNoWork && (
        <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-white text-base font-semibold">Create your first project</h2>
            <p className="text-slate-500 text-sm mt-1">Your dashboard will come alive once projects, members, and tasks exist.</p>
          </div>
          {user?.role === 'admin' && (
            <Link to="/projects" className="btn-primary flex items-center gap-2 w-fit">
              <Plus size={14} /> New Project
            </Link>
          )}
        </div>
      )}

      {/* Completion progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 text-sm font-medium">Overall Progress</span>
          <span className="text-brand-400 font-bold">{summary.completionRate}%</span>
        </div>
        <div className="h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-blue-400 rounded-full transition-all duration-700"
            style={{ width: `${summary.completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{summary.todoTasks} todo</span>
          <span>{summary.inProgressTasks} in progress</span>
          <span>{summary.doneTasks} done</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status bar chart */}
        <div className="card">
          <h3 className="text-slate-300 text-sm font-semibold mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={statusBreakdown} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0', fontSize: 12 }}
                itemStyle={{ color: '#94a3b8', fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie */}
        <div className="card">
          <h3 className="text-slate-300 text-sm font-semibold mb-4">Priority Distribution</h3>
          {priorityChartData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={150}>
                <PieChart>
                  <Pie data={priorityChartData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65}>
                    {priorityChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1f2e', border: '1px solid #2d3748', borderRadius: 8 }}
                    itemStyle={{ color: '#94a3b8', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {priorityChartData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-400 text-xs">{d.name}: <span className="text-slate-200 font-medium">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No task data</div>
          )}
        </div>
      </div>

      {/* Workload + Project health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workload */}
        {workloadByMember.length > 0 && (
          <div className="card">
            <h3 className="text-slate-300 text-sm font-semibold mb-4 flex items-center gap-2">
              <Users size={14} className="text-brand-400" /> Team Workload
            </h3>
            <div className="space-y-3">
              {workloadByMember.map(m => (
                <div key={m.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{m.name}</span>
                    <span className="text-slate-500">{m.count} tasks</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1f2e] rounded-full">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min((m.count / (workloadByMember[0]?.count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project health */}
        {projectHealth.length > 0 && (
          <div className="card">
            <h3 className="text-slate-300 text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-brand-400" /> Project Health
            </h3>
            <div className="space-y-3">
              {projectHealth.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate max-w-[60%]">{p.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.overdue > 0 && <span className="text-red-400">{p.overdue} overdue</span>}
                      <span className="text-slate-500">{p.completion}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1a1f2e] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.overdue > 0 ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${p.completion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alert lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overdue */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400" /> Overdue Tasks
              {overdueTasks.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-bold">{overdueTasks.length}</span>
              )}
            </h3>
            <Link to="/tasks?status=overdue" className="text-slate-500 hover:text-brand-400 transition-colors">
              <ArrowRight size={14} />
            </Link>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">No overdue tasks.</div>
          ) : (
            overdueTasks.slice(0, 5).map(t => <TaskRow key={t._id} task={t} />)
          )}
        </div>

        {/* Upcoming 48h */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 text-sm font-semibold flex items-center gap-2">
              <Clock size={14} className="text-amber-400" /> Due in 48 Hours
            </h3>
          </div>
          {upcoming48h.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">No tasks due soon</div>
          ) : (
            upcoming48h.map(t => <TaskRow key={t._id} task={t} />)
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 text-sm font-semibold flex items-center gap-2">
              <Activity size={14} className="text-brand-400" /> Activity Timeline
            </h3>
          </div>
          {activityItems.length === 0 ? (
            <div className="space-y-3">
              {['Admin created project', 'Task assigned to team member', 'Task marked complete'].map((text, index) => (
                <div key={text} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  <div>
                    <p className="text-slate-300 text-sm">{text}</p>
                    <p className="text-slate-500 text-xs">{index === 0 ? 'Demo activity' : 'Sample workflow'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {activityItems.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-300 text-sm truncate">{item.text}</p>
                    <p className="text-slate-500 text-xs">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showMembersModal && (
        <TeamMembersModal
          members={members}
          loading={loadingMembers}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </div>
  )
}

