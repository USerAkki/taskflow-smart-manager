import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, Filter, ArrowUpRight } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

function PriorityBadge({ label }) {
  const normalized = label === 'critical' ? 'critical' : label === 'high' ? 'high' : 'normal'
  const map = { critical: 'badge-critical', high: 'badge-high', normal: 'badge-low' }
  const text = normalized === 'critical' ? 'Critical' : normalized === 'high' ? 'High' : 'Normal'
  return <span className={map[normalized]}>{text}</span>
}

function StatusBadge({ status }) {
  const map = { 'todo': 'status-todo', 'in-progress': 'status-in-progress', 'done': 'status-done' }
  // Null guard: status can be undefined if task data is incomplete
  if (!status) return <span className="status-todo">Unknown</span>
  const label = status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)
  return <span className={map[status] || 'status-todo'}>{label}</span>
}

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' })
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    api.get('/tasks')
      .then(res => setTasks(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        console.error('[Tasks] Failed to load:', err.message)
        setError('Failed to load tasks. Please try refreshing.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (taskId, status) => {
    setUpdating(taskId)
    try {
      await api.patch(`/tasks/${taskId}/status`, { status })
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t))
    } finally { setUpdating(null) }
  }

  const filteredTasks = tasks.filter(t => {
    const statusOk = filters.status === 'all' || t.status === filters.status
    const priorityOk = filters.priority === 'all' || t.priorityLabel === filters.priority
    return statusOk && priorityOk
  })

  const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="card text-center py-16">
      <CheckSquare size={40} className="mx-auto text-red-400 mb-3" />
      <p className="text-red-400 font-medium">{error}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">All Tasks</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {filteredTasks.length} tasks
            {overdueTasks.length > 0 && (
              <span className="text-red-400 ml-2">· {overdueTasks.length} overdue</span>
            )}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-white">{tasks.filter(t => t.status === 'todo').length}</div>
          <div className="text-slate-500 text-xs mt-0.5">To Do</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-blue-400">{tasks.filter(t => t.status === 'in-progress').length}</div>
          <div className="text-slate-500 text-xs mt-0.5">In Progress</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-green-400">{tasks.filter(t => t.status === 'done').length}</div>
          <div className="text-slate-500 text-xs mt-0.5">Done</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Filter size={13} /> Filter:
        </div>
        <select className="input !w-auto text-xs py-1.5"
          value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="all">All Status</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="input !w-auto text-xs py-1.5"
          value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="card text-center py-16">
          <CheckSquare size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No tasks match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTasks.map(task => {
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
            const canUpdateStatus = user?.role === 'admin' ||
              task.assignedTo?._id === user?._id || task.assignedTo === user?._id

            return (
              <div key={task._id}
                className={`card flex flex-col gap-4 py-4 transition-all hover:scale-[1.015] hover:border-brand-500/35 ${
                  isOverdue ? 'border-red-500/25' : ''
                }`}>
                {/* Priority color bar */}
                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                  task.priorityLabel === 'critical' ? 'bg-red-500' :
                  task.priorityLabel === 'high' ? 'bg-orange-500' :
                  task.priorityLabel === 'medium' ? 'bg-green-500' : 'bg-green-500'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-slate-200 text-sm font-medium truncate">{task.title}</p>
                    {isOverdue && <span className="text-red-400 text-xs flex-shrink-0">Overdue</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {task.projectId && (
                      <Link to={`/projects/${task.projectId._id}`}
                        className="flex items-center gap-1 hover:text-brand-400 transition-colors">
                        {task.projectId.name} <ArrowUpRight size={10} />
                      </Link>
                    )}
                    {task.assignedTo && <span>Assigned to {task.assignedTo.name}</span>}
                    {task.deadline && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                        <Clock size={10} />
                        {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {task.subtasks?.length > 0 && (
                      <span>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge label={task.priorityLabel} />
                  <StatusBadge status={task.status} />

                  {canUpdateStatus && task.status === 'todo' && (
                    <button
                      disabled={updating === task._id}
                      onClick={() => handleStatusChange(task._id, 'in-progress')}
                      className="btn-secondary !px-2.5 !py-1 !text-xs">
                      Move to In Progress
                    </button>
                  )}
                  {canUpdateStatus && task.status !== 'done' && (
                    <button
                      disabled={updating === task._id}
                      onClick={() => handleStatusChange(task._id, 'done')}
                      className="btn-primary !px-2.5 !py-1 !text-xs">
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

