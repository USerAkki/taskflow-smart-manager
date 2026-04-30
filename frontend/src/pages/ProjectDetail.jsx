import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, UserPlus, X, Clock, CheckCircle2,
  Zap, Trash2, Users, ChevronDown, Activity, CalendarDays
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import AIBreakdownModal from '../components/AIBreakdownModal'

function PriorityBadge({ label }) {
  const normalized = label === 'critical' ? 'critical' : label === 'high' ? 'high' : 'normal'
  const map = { critical: 'badge-critical', high: 'badge-high', normal: 'badge-low' }
  const text = normalized === 'critical' ? 'Critical' : normalized === 'high' ? 'High' : 'Normal'
  return <span className={map[normalized]}>{text}</span>
}

function StatusBadge({ status }) {
  const map = {
    'todo': 'status-todo', 'in-progress': 'status-in-progress', 'done': 'status-done'
  }
  return <span className={map[status]}>{status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
}

function TaskCard({ task, onStatusChange, onDelete, isAdmin }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

  const handleStatus = async (status) => {
    setUpdating(true)
    await onStatusChange(task._id, status)
    setUpdating(false)
  }

  const completedSubtasks = task.subtasks?.filter(s => s.done).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  return (
    <div className={`bg-[#161b27] border rounded-xl overflow-hidden transition-all hover:scale-[1.015] hover:border-brand-500/35 ${
      isOverdue ? 'border-red-500/30' : task.priorityLabel === 'critical' ? 'border-orange-500/20' : 'border-[#2d3748]'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <PriorityBadge label={task.priorityLabel} />
              {isOverdue && <span className="text-red-400 text-xs font-medium">Overdue</span>}
              {task.aiGenerated && (
                <span className="flex items-center gap-1 text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-2 py-0.5">
                  <Zap size={9} /> AI
                </span>
              )}
            </div>
            <h4 className="text-slate-200 font-medium text-sm leading-snug">{task.title}</h4>
            {task.description && (
              <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {totalSubtasks > 0 && (
              <button onClick={() => setExpanded(!expanded)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => onDelete(task._id)}
                className="text-slate-600 hover:text-red-400 transition-colors p-1">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <StatusBadge status={task.status} />
          {task.assignedTo && (
            <span className="text-slate-500 text-xs">Assigned to {task.assignedTo.name}</span>
          )}
          {task.deadline && (
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <Clock size={10} />
              {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className="text-slate-500 text-xs">{completedSubtasks}/{totalSubtasks} subtasks</span>
          )}
        </div>

        {/* Status controls */}
        <div className="flex gap-1.5 mt-3">
          {task.status === 'todo' && (
            <button disabled={updating} onClick={() => handleStatus('in-progress')} className="btn-secondary !px-2.5 !py-1 !text-xs">
              Move to In Progress
            </button>
          )}
          {task.status !== 'done' && (
            <button disabled={updating} onClick={() => handleStatus('done')} className="btn-primary !px-2.5 !py-1 !text-xs">
              Mark Done
            </button>
          )}
          {task.status === 'done' && (
            <button disabled={updating} onClick={() => handleStatus('in-progress')} className="btn-secondary !px-2.5 !py-1 !text-xs">
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {expanded && totalSubtasks > 0 && (
        <div className="border-t border-[#1e2535] px-4 py-3 bg-[#111520] space-y-2">
          {task.subtasks.map((sub) => (
            <div key={sub._id} className="flex items-center gap-2.5">
              <button
                onClick={() => api.patch(`/tasks/${task._id}/subtasks/${sub._id}`)}
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                  sub.done ? 'bg-green-500 border-green-500' : 'border-[#2d3748] hover:border-brand-500'
                }`}>
                {sub.done && <CheckCircle2 size={10} className="text-white" />}
              </button>
              <span className={`text-xs flex-1 ${sub.done ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                {sub.title}
              </span>
              <span className="text-slate-600 text-xs">{sub.estimatedHours}h</span>
              <PriorityBadge label={sub.priority} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', assignedTo: '', deadline: '', tags: ''
  })
  const [aiResult, setAiResult] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const payload = {
        ...form, projectId,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        subtasks: aiResult?.subtasks || []
      }
      const { data } = await api.post('/tasks', payload)
      onCreated(data); onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally { setLoading(false) }
  }

  const handleApplyAI = (result) => {
    setAiResult(result)
    setShowAI(false)
  }

  return (
    <>
      {showAI && <AIBreakdownModal onClose={() => setShowAI(false)} onApply={handleApplyAI} />}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="bg-[#161b27] border border-[#2d3748] rounded-2xl w-full max-w-lg shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748]">
            <h2 className="text-white font-semibold">Create Task</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="Task title..."
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2}
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Assign To</label>
                <select className="input"
                  value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input"
                  value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>

            {/* AI feature button */}
            <button type="button" onClick={() => setShowAI(true)}
              className="w-full border border-dashed border-brand-500/40 hover:border-brand-500/70 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-brand-400 text-sm hover:bg-brand-500/5 transition-all">
              <Zap size={14} />
              {aiResult ? `AI applied - ${aiResult.subtasks.length} subtasks ready` : 'Use AI to generate subtasks + estimates'}
            </button>

            {aiResult && (
              <div className="bg-[#1a1f2e] rounded-xl p-3 space-y-1.5">
                <p className="text-slate-400 text-xs font-medium mb-2">AI-generated subtasks:</p>
                {aiResult.subtasks.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    <span className="text-slate-300 flex-1">{s.title}</span>
                    <span className="text-slate-500">{s.estimatedHours}h</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberId, setMemberId] = useState('')
  const [memberError, setMemberError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('tasks')

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?projectId=${id}`),
      isAdmin ? api.get('/auth/users') : Promise.resolve({ data: [] })
    ]).then(([proj, taskRes, usersRes]) => {
      setProject(proj.data)
      setTasks(taskRes.data)
      setAllUsers(usersRes.data)
    }).finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status`, { status })
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t))
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${taskId}`)
    setTasks(prev => prev.filter(t => t._id !== taskId))
  }

  const handleAddMember = async () => {
    setMemberError('')
    const u = memberId
      ? allUsers.find(u => u._id === memberId)
      : allUsers.find(u => u.email.toLowerCase() === memberEmail.toLowerCase())
    if (!u) { setMemberError('User not found'); return }
    try {
      const { data } = await api.post(`/projects/${id}/members`, { userId: u._id })
      setProject(data)
      setMemberEmail('')
      setMemberId('')
      setShowAddMember(false)
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    await api.delete(`/projects/${id}/members/${userId}`)
    setProject(prev => ({ ...prev, members: prev.members.filter(m => m._id !== userId) }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!project) return <div className="text-slate-400 text-center py-20">Project not found</div>

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const completion = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const availableMembers = allUsers.filter(u => !project.members?.some(m => m._id === u._id))
  const activityItems = [
    ...tasks.slice(0, 3).map(t => ({
      id: t._id,
      text: `${t.assignedTo?.name || 'Unassigned'} owns "${t.title}"`,
      meta: t.status === 'done' ? 'Marked done' : t.status === 'in-progress' ? 'In progress' : 'Ready to start'
    })),
    { id: 'members', text: `${project.members?.length || 0} members are on this project`, meta: 'Team updated' },
    { id: 'project', text: `${project.createdBy?.name || 'Admin'} created ${project.name}`, meta: 'Project created' }
  ]
  const tabs = [
    { id: 'tasks', label: `Tasks (${tasks.length})` },
    { id: 'members', label: `Members (${project.members?.length || 0})` },
    { id: 'activity', label: 'Activity' }
  ]

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link to="/projects" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4 transition-colors w-fit">
          <ArrowLeft size={14} /> Back to Projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{project.name}</h1>
            {project.description && <p className="text-slate-400 text-sm mt-1">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <>
                <button onClick={() => { setActiveTab('members'); setShowAddMember(true) }} className="btn-secondary flex items-center gap-2">
                  <UserPlus size={14} /> Add Member
                </button>
                <button onClick={() => setShowCreateTask(true)} className="btn-primary flex items-center gap-2">
                  <Plus size={14} /> Task
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Progress</span>
          <span className="text-white font-semibold">{completion}%</span>
        </div>
        <div className="h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${completion === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
            style={{ width: `${completion}%` }} />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-slate-500">
          <span>{tasks.filter(t => t.status === 'todo').length} todo</span>
          <span className="text-blue-400">{tasks.filter(t => t.status === 'in-progress').length} in progress</span>
          <span className="text-green-400">{doneTasks} done</span>
          <span className="ml-auto">{tasks.filter(t => t.priorityLabel === 'critical' && t.status !== 'done').length} critical</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#161b27] border border-[#2d3748] rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="card fade-in">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-slate-300 text-sm font-semibold flex items-center gap-2">
              <Users size={14} className="text-brand-400" /> Team Members
            </h3>
            {isAdmin && (
              <button onClick={() => setShowAddMember(!showAddMember)} className="btn-secondary flex items-center gap-2">
                <UserPlus size={14} /> Add Member
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            {project.members?.map(m => (
              <div key={m._id} className="flex items-center gap-3 bg-[#1a1f2e] border border-[#2d3748] rounded-xl px-3 py-3 text-sm hover:scale-[1.015] transition-all">
                <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-brand-400 font-bold">
                  {m.name?.[0] || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-200 font-medium truncate">{m.name}</p>
                  <p className="text-slate-500 text-xs truncate">{m.email}</p>
                </div>
                <span className="text-slate-500 text-xs capitalize">{m.role}</span>
                {m._id !== project.createdBy?._id && (
                  <button onClick={() => handleRemoveMember(m._id)} className="text-slate-600 hover:text-red-400 ml-1">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {showAddMember && isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2">
              <select className="input flex-1" value={memberId} onChange={e => setMemberId(e.target.value)}>
                <option value="">Select a user</option>
                {availableMembers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
              <input className="input flex-1" placeholder="or member@email.com"
                value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMember()} />
              <button onClick={handleAddMember} className="btn-primary">Add</button>
            </div>
          )}
          {memberError && <p className="text-red-400 text-xs mt-2">{memberError}</p>}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card fade-in">
          <h3 className="text-slate-300 text-sm font-semibold flex items-center gap-2 mb-4">
            <Activity size={14} className="text-brand-400" /> Activity Timeline
          </h3>
          <div className="space-y-3">
            {activityItems.map(item => (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-300 text-sm">{item.text}</p>
                  <p className="text-slate-500 text-xs">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-[#161b27] border border-[#2d3748] rounded-xl p-1 w-fit">
        {['all', 'todo', 'in-progress', 'done'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === s
                ? 'bg-brand-500 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}>
            {s === 'all' ? `All (${tasks.length})` : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks grid */}
      {filteredTasks.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle2 size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">
            {isAdmin ? 'No tasks yet. Create one to get started.' : 'No tasks in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTasks.map(task => (
            <TaskCard key={task._id} task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              isAdmin={isAdmin} />
          ))}
        </div>
      )}
        </>
      )}

      {isAdmin && (
        <button onClick={() => setShowCreateTask(true)}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/20 flex items-center justify-center hover:scale-105 transition-all"
          title="Create task">
          <Plus size={20} />
        </button>
      )}

      {showCreateTask && (
        <CreateTaskModal
          projectId={id}
          members={project.members || []}
          onClose={() => setShowCreateTask(false)}
          onCreated={t => setTasks(prev => [t, ...prev])}
        />
      )}
    </div>
  )
}

