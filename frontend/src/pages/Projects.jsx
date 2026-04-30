import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Users, ChevronRight, X, Calendar } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', deadline: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/projects', form)
      onCreated(data); onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b27] border border-[#2d3748] rounded-2xl w-full max-w-md shadow-2xl fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748]">
          <h2 className="text-white font-semibold">New Project</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Project Name *</label>
            <input className="input" placeholder="e.g. Mobile App Redesign"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What's this project about?"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" className="input"
              value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MembersModal({ members, loading, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b27] border border-[#2d3748] rounded-2xl w-full max-w-md shadow-2xl fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748]">
          <h2 className="text-white font-semibold">Team Members</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-slate-400 text-sm py-8 text-center">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-slate-500 text-sm py-8 text-center">No members added yet.</div>
          ) : (
            <div className="space-y-2">
              {members.map(member => (
                <div key={member._id} className="flex items-center gap-3 p-3 bg-[#1a1f2e] border border-[#2d3748] rounded-xl">
                  <div className="w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {member.name?.[0] || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 text-sm font-medium truncate">{member.name}</p>
                    <p className="text-slate-500 text-xs truncate">{member.email}</p>
                  </div>
                  <span className="text-slate-500 text-xs capitalize">{member.role}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={onClose} className="btn-secondary w-full mt-5">Close</button>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onOpenMembers }) {
  const navigate = useNavigate()
  const completion = project.taskCount > 0
    ? Math.round((project.doneCount / project.taskCount) * 100) : 0

  const statusColors = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'on-hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/projects/${project._id}`)}
      role="button"
      tabIndex={0}
      className="card hover:border-brand-500/40 transition-all duration-200 hover:scale-[1.02] group cursor-pointer block">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">
            <FolderKanban size={16} className="text-brand-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm group-hover:text-brand-300 transition-colors">{project.name}</h3>
            <p className="text-slate-500 text-xs">{project.createdBy?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColors[project.status]}`}>
            {project.status}
          </span>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
        </div>
      </div>

      {project.description && (
        <p className="text-slate-500 text-xs mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">{project.doneCount}/{project.taskCount} tasks</span>
          <span className="text-slate-400 font-medium">{completion}%</span>
        </div>
        <div className="h-1.5 bg-[#1a1f2e] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${completion === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <button
          type="button"
          title="Click to view members"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMembers(project._id);
          }}
          className="flex items-center gap-1 hover:text-brand-400 transition-colors">
          <Users size={11} /> {project.members?.length || 0} members
        </button>
        {project.deadline && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)

  useEffect(() => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .finally(() => setLoading(false))
  }, [])

  const openMembers = async (projectId) => {
    setMembers([])
    setShowMembers(true)
    setMembersLoading(true)
    try {
      const { data } = await api.get(`/project/${projectId}/members`)
      setMembers(data)
    } catch {
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">{projects.length} total projects</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-300 font-medium">No projects yet</p>
          <p className="text-slate-500 text-sm mt-1">
            {user?.role === 'admin' ? 'Create your first project to start managing your team' : 'You have not been added to any projects yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p._id} project={p} onOpenMembers={openMembers} />)}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
      {showMembers && (
        <MembersModal
          members={members}
          loading={membersLoading}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  )
}

