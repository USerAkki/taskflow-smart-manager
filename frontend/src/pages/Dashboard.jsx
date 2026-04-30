import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import {
  AlertTriangle, Flame, Activity, Users, Shield, User,
  Loader, Plus, Clock, CalendarDays, LayoutDashboard,
  CircleDot, Zap, ArrowUpRight, TrendingUp, CheckCircle, 
  Target, ArrowRight, Play, Check, EyeOff, RotateCcw
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#64748b'
}

// ── Number Animation Component ───────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value, 10) || 0
    if (start === end) {
      setDisplayValue(end)
      return
    }
    const duration = 1000
    const incrementTime = 30
    const steps = Math.abs(end - start)
    const stepTime = Math.max(incrementTime, Math.floor(duration / steps))
    const stepAmount = Math.ceil((end - start) / (duration / stepTime))

    const timer = setInterval(() => {
      start += stepAmount
      if ((stepAmount > 0 && start >= end) || (stepAmount < 0 && start <= end)) {
        start = end
        clearInterval(timer)
      }
      setDisplayValue(start)
    }, stepTime)

    return () => clearInterval(timer)
  }, [value])

  return <span>{displayValue}</span>
}

// ── Circular Progress ─────────────────────────────────────────────────────────
function CircularProgress({ score }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  let colorClass = 'text-emerald-400'
  if (score < 50) colorClass = 'text-rose-400'
  else if (score < 80) colorClass = 'text-amber-400'

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24 drop-shadow-md">
        <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#1e2535]" />
        <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`${colorClass} transition-all duration-1000 ease-out`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${colorClass}`}>{score}</span>
      </div>
    </div>
  )
}

// ── Dashboard Component ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(null)

  // Simulation states
  const [hiddenOverdue, setHiddenOverdue] = useState(false)
  const [isRebalancing, setIsRebalancing] = useState(false)

  // Modals state
  const [showDirectory, setShowDirectory] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberTasks, setMemberTasks] = useState([])
  const [loadingMemberTasks, setLoadingMemberTasks] = useState(false)

  const [isFocusMode, setIsFocusMode] = useState(false)
  const [showExplainableAI, setShowExplainableAI] = useState(false)

  const handleOpenDirectory = async () => {
    setShowDirectory(true)
    setLoadingMembers(true)
    try {
      const res = await api.get('/dashboard/members')
      setMembers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setMembers([])
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchInsights = useCallback(() => {
    api.get('/dashboard/insights')
      .then(res => { setData(res.data); setError(null) })
      .catch(err => {
        console.error('[Dashboard] Failed to load insights:', err.message || err)
        setError('System anomaly detected. Please reload interface.')
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  // Real-time ping simulation
  const [ping, setPing] = useState(false)
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(true)
      setTimeout(() => setPing(false), 2000)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const updateTaskStatus = async (e, taskId, status) => {
    e.stopPropagation()
    setUpdating(taskId)
    try {
      await api.patch(`/tasks/${taskId}/status`, { status })
      fetchInsights()
    } catch (err) {
      console.error('Failed to update task:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleMemberClick = async (member) => {
    setShowDirectory(false)
    setSelectedMember(member)
    setLoadingMemberTasks(true)
    try {
      const res = await api.get(`/tasks?assignedTo=${member._id}`)
      setMemberTasks(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setMemberTasks([])
    } finally {
      setLoadingMemberTasks(false)
    }
  }

  const simulateRebalance = () => {
    setIsRebalancing(true)
    setTimeout(() => {
      setIsRebalancing(false)
      fetchInsights() // Refetch just to simulate a network cycle
    }, 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader size={32} className="animate-spin text-brand-500" />
        <p className="text-slate-400 font-medium tracking-wide">Initializing Command Center...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6 h-full flex flex-col items-center justify-center">
      <AlertTriangle size={48} className="text-rose-400 mb-4" />
      <h2 className="text-white text-lg font-semibold mb-2">System Interruption</h2>
      <p className="text-slate-400 text-sm mb-6">{error}</p>
      <Button onClick={() => window.location.reload()}>Reinitialize</Button>
    </div>
  )

  const summary = data?.summary || {}
  const statusBreakdown = Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : []
  const priorityBreakdown = data?.priorityBreakdown || {}
  
  // Apply hiddenOverdue simulation to lists
  const overdueTasksRaw = Array.isArray(data?.overdueTasks) ? data.overdueTasks : []
  const overdueTasks = hiddenOverdue ? [] : overdueTasksRaw
  
  const criticalTasks = Array.isArray(data?.criticalTasks) ? data.criticalTasks : []
  const upcoming48h = Array.isArray(data?.upcoming48h) ? data.upcoming48h : []
  const workloadByMember = Array.isArray(data?.workloadByMember) ? data.workloadByMember : []

  const completionRate = summary.completionRate ?? 0
  const overdueCount = summary.overdueCount ?? 0
  const criticalCount = summary.criticalCount ?? 0

  const backendScore = summary.score ?? 0
  const breakdown = summary.breakdown || {}
  const velocity = breakdown.velocity || 0
  const overduePenalty = breakdown.overduePenalty || 0
  const criticalPenalty = breakdown.criticalPenalty || 0

  // Smart Insights Generation
  const insights = []
  if (criticalCount > 0) {
    insights.push({
      id: 'critical', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-500/10 hover:bg-rose-500/20', border: 'border-rose-500/30',
      message: `${criticalCount} critical task${criticalCount > 1 ? 's require' : ' requires'} action.`,
      action: 'View Critical',
      onClick: () => navigate('/tasks', { state: { filterPriority: 'critical' } })
    })
  }
  if (overdueCount > 0) {
    insights.push({
      id: 'overdue', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20', border: 'border-amber-500/30',
      message: `${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue.`,
      action: 'Clear Backlog',
      onClick: () => navigate('/tasks', { state: { filterStatus: 'todo' } })
    })
  }
  if (completionRate >= 80) {
    insights.push({
      id: 'completion', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', border: 'border-emerald-500/30',
      message: `High velocity detected (${completionRate}%).`,
      action: 'View Analytics',
      onClick: () => {} // Stays on dashboard
    })
  } else if (completionRate < 50 && summary.totalTasks > 0) {
    insights.push({
      id: 'completion', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20', border: 'border-blue-500/30',
      message: `Velocity at ${completionRate}%. Needs attention.`,
      action: 'View Pending',
      onClick: () => navigate('/tasks', { state: { filterStatus: 'todo' } })
    })
  }

  let overloadedMember = null
  let availableMember = null
  if (workloadByMember.length > 0) {
    const sortedWorkload = [...workloadByMember].sort((a, b) => b.count - a.count)
    overloadedMember = sortedWorkload[0]
    if (sortedWorkload.length > 1) availableMember = sortedWorkload[sortedWorkload.length - 1]
  }

  if (overloadedMember && overloadedMember.count >= 5 && insights.length < 4) {
    insights.push({
      id: 'workload', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 hover:bg-purple-500/20', border: 'border-purple-500/30',
      message: `${overloadedMember.name} has peak workload (${overloadedMember.count}).`,
      action: 'Reassign Load',
      onClick: () => handleMemberClick({ _id: overloadedMember._id, name: overloadedMember.name, role: 'member' })
    })
  }

  const safeStatusData = statusBreakdown.length > 0 ? statusBreakdown : [{ label: 'No Data', count: 0, color: '#2d3748' }]
  const priorityChartData = Object.entries(priorityBreakdown).map(([key, val]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1), value: typeof val === 'number' ? val : 0, color: PRIORITY_COLORS[key] || '#64748b'
  }))
  const totalPriorityValue = priorityChartData.reduce((acc, curr) => acc + curr.value, 0)
  const safePriorityData = totalPriorityValue > 0 ? priorityChartData : [{ name: 'None', value: 1, color: '#2d3748' }]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#161b27] border border-[#2d3748] rounded-lg p-3 shadow-2xl">
          <p className="text-slate-200 text-sm font-medium mb-1">{payload[0].name || payload[0].payload.label}</p>
          <p className="text-slate-400 text-xs font-semibold">Volume: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  const allUrgent = [...criticalTasks, ...overdueTasksRaw]
  const uniqueUrgent = Array.from(new Map(allUrgent.map(item => [item._id, item])).values())
  const recommendedTask = uniqueUrgent.length > 0 ? uniqueUrgent[0] : null

  // ── Render Task Card (used in lists & hover actions) ───────────────────────
  const TaskItem = ({ t, type }) => {
    const isCritical = type === 'critical' || t.priorityLabel === 'critical'
    return (
      <div className="relative group/task overflow-hidden bg-[#1a1f2e] border border-[#2d3748] p-3 rounded-xl shadow-sm hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 transition-all">
        <div className={`absolute top-0 left-0 w-1 h-full ${isCritical ? 'bg-rose-500' : type==='overdue' ? 'bg-amber-500' : 'bg-brand-500'}`}></div>
        
        <div className="flex items-start justify-between mb-1 pl-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isCritical ? 'text-rose-400' : type==='overdue' ? 'text-amber-400' : 'text-brand-400'}`}>
            {type}
          </span>
          {t.deadline && <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1"><Clock size={10}/>{new Date(t.deadline).toLocaleDateString()}</span>}
        </div>
        
        <p className="text-slate-200 text-sm font-medium leading-snug pl-1 mb-2 group-hover/task:text-white transition-colors">{t.title || 'Untitled'}</p>
        
        <div className="flex items-center justify-between pl-1">
          {t.projectId?.name ? (
            <p className="text-xs text-slate-500 flex items-center gap-1"><ArrowUpRight size={10} />{t.projectId.name}</p>
          ) : <span/>}
          {t.assignedTo && <p className="text-xs text-slate-500 flex items-center gap-1"><User size={10}/>{t.assignedTo.name}</p>}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-y-0 right-0 left-8 bg-gradient-to-l from-[#1a1f2e] via-[#1a1f2e]/90 to-transparent opacity-0 group-hover/task:opacity-100 flex items-center justify-end pr-3 gap-2 transition-opacity duration-200 translate-x-4 group-hover/task:translate-x-0">
          {t.status === 'todo' && (
            <button onClick={(e) => updateTaskStatus(e, t._id, 'in-progress')} className="btn-secondary !px-2 !py-1 !text-xs flex items-center gap-1 hover:border-brand-500/50 hover:text-brand-400">
              <Play size={10} /> Start
            </button>
          )}
          {t.status !== 'done' && (
            <button onClick={(e) => updateTaskStatus(e, t._id, 'done')} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
              <Check size={10} /> Done
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 max-w-[1400px] mx-auto space-y-8 fade-in text-slate-200 transition-colors duration-500 ${isFocusMode ? 'bg-[#0f1117]' : ''}`}>
      
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2d3748]/50">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight flex items-center gap-3">
            Command Center
            <span className={`w-2 h-2 rounded-full ${ping ? 'bg-emerald-400 scale-150 shadow-[0_0_8px_#34d399]' : 'bg-brand-500'} transition-all duration-300`}></span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Live system intelligence and productivity controls.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* ── Quick Actions Sidebar (Left) ─────────────────────────────────────────────── */}
        <div className="lg:w-64 flex flex-col gap-4 shrink-0">
          <Button variant={isFocusMode ? 'primary' : 'secondary'} onClick={() => setIsFocusMode(!isFocusMode)} className={`w-full justify-start h-12 shadow-lg ${isFocusMode ? 'shadow-brand-500/20 ring-1 ring-brand-500/50' : ''}`}>
            <Target size={16} className={isFocusMode ? 'animate-pulse' : ''} /> {isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          </Button>

          {!isFocusMode && (
            <Card className="p-4 bg-gradient-to-b from-[#1a1f2e] to-[#161b27] border-[#2d3748]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="w-full justify-start text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1e2535] bg-transparent" onClick={() => navigate('/tasks')}>
                  <Plus size={14} className="text-brand-400" /> Create Task
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1e2535] bg-transparent" onClick={() => setHiddenOverdue(!hiddenOverdue)}>
                  <EyeOff size={14} className="text-amber-400" /> {hiddenOverdue ? 'Show Overdue' : 'Hide Overdue Alerts'}
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1e2535] bg-transparent" onClick={simulateRebalance} loading={isRebalancing}>
                  <RotateCcw size={14} className="text-blue-400" /> Rebalance Workload
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1e2535] bg-transparent" onClick={handleOpenDirectory}>
                  <Users size={14} className="text-purple-400" /> Team Directory
                </Button>
              </div>
            </Card>
          )}

          {/* Productivity Mini */}
          {!isFocusMode && (
            <Card className="p-4 bg-gradient-to-br from-[#1e2535] to-[#161b27] group">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Productivity</h3>
              <div className="flex items-center justify-center mb-4">
                <CircularProgress score={backendScore} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium border-b border-[#2d3748] pb-1"><span className="text-emerald-400">Velocity</span><span className="text-slate-300">+{velocity}</span></div>
                <div className="flex justify-between text-[11px] font-medium border-b border-[#2d3748] pb-1"><span className="text-amber-400">Overdue</span><span className="text-slate-300">-{overduePenalty}</span></div>
                <div className="flex justify-between text-[11px] font-medium"><span className="text-rose-400">Critical</span><span className="text-slate-300">-{criticalPenalty}</span></div>
              </div>
            </Card>
          )}
        </div>

        {/* ── Main Content Area ─────────────────────────────────────────────── */}
        <div className="flex-1 space-y-6 min-w-0">
          
          {/* Actionable Insights Panel */}
          {insights.length > 0 && (!isFocusMode || insights.some(i => i.id === 'critical' || i.id === 'overdue')) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.filter(i => !isFocusMode || i.id === 'critical' || i.id === 'overdue').map(insight => (
                <Card key={insight.id} onClick={insight.onClick} className={`p-4 flex flex-col justify-between h-32 border cursor-pointer ${insight.bg} ${insight.border} hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] group transition-all duration-300 hover:-translate-y-1`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-[#161b27] ${insight.color} shrink-0 shadow-inner`}>
                      <insight.icon size={16} />
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-snug">{insight.message}</p>
                  </div>
                  <div className={`flex items-center justify-end text-[11px] font-bold uppercase tracking-wider ${insight.color} opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0`}>
                    {insight.action} <ArrowRight size={12} className="ml-1" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Recommended Focus (Smart Task Highlight) */}
          {recommendedTask && (
            <Card className="p-0 bg-[#161b27] border-[#2d3748] group relative overflow-hidden ring-1 ring-brand-500/20 hover:ring-brand-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-brand-500 to-transparent"></div>
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-10 gap-4">
                <div className="flex flex-col gap-2 w-full sm:w-auto flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-400 bg-brand-400/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap size={10}/> AI Recommended Focus
                    </span>
                    {recommendedTask.deadline && <span className="text-xs text-rose-400 font-semibold flex items-center gap-1"><Clock size={12}/> Due {new Date(recommendedTask.deadline).toLocaleDateString()}</span>}
                  </div>
                  <h3 className="text-xl font-bold text-white">{recommendedTask.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400 font-medium">
                    {recommendedTask.projectId?.name && <span className="flex items-center gap-1"><LayoutDashboard size={14}/> {recommendedTask.projectId.name}</span>}
                    {recommendedTask.assignedTo?.name && <span className="flex items-center gap-1 text-slate-300"><User size={14}/> {recommendedTask.assignedTo.name}</span>}
                  </div>

                  <div className="mt-2">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1" onClick={() => setShowExplainableAI(!showExplainableAI)}>
                      {showExplainableAI ? 'Hide AI Reasoning' : 'Why this task?'}
                    </button>
                    {showExplainableAI && (
                      <div className="mt-3 p-3 bg-[#121620]/80 border border-[#2d3748] rounded-lg space-y-2 fade-in max-w-lg">
                        {recommendedTask.priorityLabel === 'critical' && (
                          <p className="text-xs text-slate-300 flex items-center gap-2">
                            <Flame size={12} className="text-rose-400 shrink-0" /> System flagged as <strong>CRITICAL</strong> priority.
                          </p>
                        )}
                        {recommendedTask.deadline && new Date(recommendedTask.deadline) < new Date() && (
                          <p className="text-xs text-slate-300 flex items-center gap-2">
                            <Clock size={12} className="text-amber-400 shrink-0" /> Task is currently overdue by {Math.floor((new Date() - new Date(recommendedTask.deadline)) / (1000 * 60 * 60 * 24))} days.
                          </p>
                        )}
                        {recommendedTask.assignedTo && (
                          <p className="text-xs text-slate-300 flex items-center gap-2">
                            <Activity size={12} className="text-purple-400 shrink-0" /> Assigned to {recommendedTask.assignedTo.name}, managing workload effectively.
                          </p>
                        )}
                        <p className="text-xs text-slate-300 flex items-center gap-2">
                          <CircleDot size={12} className="text-emerald-400 shrink-0" /> High impact on project velocity.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                  <Button variant="secondary" onClick={() => navigate('/tasks')} className="w-full sm:w-auto">Open Task</Button>
                  <Button variant="primary" onClick={(e) => updateTaskStatus(e, recommendedTask._id, 'done')} loading={updating === recommendedTask._id} className="w-full sm:w-auto shadow-lg shadow-brand-500/20">
                    <Check size={16} /> Mark Resolved
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Analytics & Timeline */}
          {!isFocusMode && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="space-y-6">
                <Card className="flex flex-col h-[320px] p-5 bg-gradient-to-br from-[#1e2535] to-[#161b27] border-[#2d3748] shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                      <CircleDot size={16} className="text-brand-400" /> Active System Status
                    </h3>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={safeStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#1e2535' }} content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1000} barSize={40}>
                          {safeStatusData.map((entry, i) => <Cell key={i} fill={entry.color || '#6366f1'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Workload Mini */}
                <Card className="p-5 bg-gradient-to-br from-[#1e2535] to-[#161b27] border-[#2d3748]">
                  <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
                    <Users size={16} className="text-purple-400" /> Interactive Workload
                  </h3>
                  <div className="space-y-3">
                    {overloadedMember && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/40 cursor-pointer transition-all shadow-sm hover:shadow-rose-500/10" onClick={() => handleMemberClick({ _id: overloadedMember._id, name: overloadedMember.name, role: 'member' })}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-rose-500/10 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-500/20">{overloadedMember.name.substring(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="text-sm font-medium text-white">{overloadedMember.name}</p>
                            <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Overloaded</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-200"><AnimatedNumber value={overloadedMember.count} /></span>
                          <p className="text-[10px] text-slate-500 uppercase">Tasks</p>
                        </div>
                      </div>
                    )}
                    {availableMember && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/40 cursor-pointer transition-all shadow-sm hover:shadow-emerald-500/10" onClick={() => handleMemberClick({ _id: availableMember._id, name: availableMember.name, role: 'member' })}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20">{availableMember.name.substring(0, 2).toUpperCase()}</div>
                          <div>
                            <p className="text-sm font-medium text-white">{availableMember.name}</p>
                            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Available</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-200"><AnimatedNumber value={availableMember.count} /></span>
                          <p className="text-[10px] text-slate-500 uppercase">Tasks</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Live Activity Feed */}
              <Card className="flex flex-col h-[600px] p-0 overflow-hidden bg-gradient-to-b from-[#1e2535] to-[#161b27] border-[#2d3748] shadow-lg">
                <div className="p-4 border-b border-[#2d3748]/50 bg-[#161b27]/80 backdrop-blur flex justify-between items-center">
                  <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                    <Activity size={16} className="text-brand-400" /> Live Feed
                  </h3>
                  {ping && <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">Syncing...</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#121620]">
                  {overdueTasks.length === 0 && criticalTasks.length === 0 && upcoming48h.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-70">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 ring-8 ring-[#161b27]">
                        <CheckCircle size={32} className="text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">You're all caught up 🚀</h3>
                      <p className="text-slate-400 text-sm mt-1 mb-6">No impending deadlines or critical events.</p>
                      <Button onClick={() => navigate('/tasks')} variant="secondary">Create new task</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {overdueTasks.slice(0, 4).map(t => <TaskItem key={t._id} t={t} type="overdue" />)}
                      {criticalTasks.slice(0, 3).map(t => <TaskItem key={t._id} t={t} type="critical" />)}
                      {upcoming48h.slice(0, 3).map(t => <TaskItem key={t._id} t={t} type="upcoming" />)}
                    </div>
                  )}
                </div>
              </Card>

            </div>
          )}

          {/* Focus Mode List */}
          {isFocusMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {overdueTasks.map(t => (
                <Card key={t._id} className="p-6 bg-gradient-to-br from-[#1a1f2e] to-[#121620] border-rose-500/30 flex flex-col justify-between shadow-[0_0_20px_rgba(244,63,94,0.05)] hover:shadow-[0_0_25px_rgba(244,63,94,0.1)] transition-shadow">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded tracking-wider">Overdue</span>
                    <h3 className="text-xl font-bold text-white mt-4">{t.title}</h3>
                    {t.deadline && <p className="text-sm text-rose-400/80 font-medium mt-2 flex items-center gap-1"><Clock size={14}/> {new Date(t.deadline).toLocaleDateString()}</p>}
                    {t.projectId?.name && <p className="text-sm text-slate-400 mt-2 flex items-center gap-1"><LayoutDashboard size={14}/> {t.projectId.name}</p>}
                  </div>
                  <Button variant="danger" className="mt-8 w-full shadow-lg shadow-rose-500/10" onClick={(e) => updateTaskStatus(e, t._id, 'done')} loading={updating === t._id}>
                    Mark Resolved
                  </Button>
                </Card>
              ))}
              {criticalTasks.map(t => (
                <Card key={t._id} className="p-6 bg-gradient-to-br from-[#1a1f2e] to-[#121620] border-amber-500/30 flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:shadow-[0_0_25px_rgba(245,158,11,0.1)] transition-shadow">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded tracking-wider">Critical</span>
                    <h3 className="text-xl font-bold text-white mt-4">{t.title}</h3>
                    {t.projectId?.name && <p className="text-sm text-slate-400 mt-2 flex items-center gap-1"><LayoutDashboard size={14}/> {t.projectId.name}</p>}
                  </div>
                  <Button variant="secondary" className="mt-8 w-full text-amber-400 border-amber-500/20 hover:bg-amber-500/10" onClick={(e) => updateTaskStatus(e, t._id, 'done')} loading={updating === t._id}>
                    Mark Resolved
                  </Button>
                </Card>
              ))}
              {overdueTasks.length === 0 && criticalTasks.length === 0 && (
                <div className="col-span-full py-32 text-center fade-in">
                   <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-8 ring-[#0f1117]">
                     <CheckCircle className="text-emerald-400" size={48} />
                   </div>
                   <h2 className="text-3xl font-bold text-white mb-3">Focus Queue Cleared</h2>
                   <p className="text-slate-400 text-lg">You have no critical or overdue tasks remaining.</p>
                   <Button onClick={() => setIsFocusMode(false)} className="mt-8 px-8 py-3 text-base">Exit Focus Mode</Button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Team Directory Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={showDirectory} onClose={() => setShowDirectory(false)} title="Team Directory" icon={Users} footer={<Button variant="secondary" className="w-full" onClick={() => setShowDirectory(false)}>Close Directory</Button>}>
        {loadingMembers ? (
          <div className="py-12 flex justify-center"><Loader className="animate-spin text-brand-500" /></div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No directory found.</div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member._id} className="flex items-center gap-4 p-3 bg-[#1a1f2e] border border-[#2d3748] rounded-xl hover:border-brand-500/50 cursor-pointer transition-all shadow-sm" onClick={() => handleMemberClick(member)}>
                <div className="w-10 h-10 rounded-lg bg-[#1e2535] border border-[#2d3748] text-brand-400 flex items-center justify-center font-bold text-sm">
                  {(member.name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-200 text-sm font-semibold">{member.name || 'Unnamed'}</p>
                  <p className="text-slate-500 text-xs truncate">{member.email}</p>
                </div>
                <Button variant="ghost" className="text-xs">View Workload</Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Member Tasks Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} title={`${selectedMember?.name}'s Workload`} icon={Activity} footer={<Button variant="secondary" className="w-full" onClick={() => setSelectedMember(null)}>Close View</Button>}>
        {loadingMemberTasks ? (
          <div className="py-12 flex justify-center"><Loader className="animate-spin text-brand-500" /></div>
        ) : memberTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No active tasks assigned to this user.</div>
        ) : (
          <div className="space-y-3">
            {memberTasks.map(t => (
              <div key={t._id} className="p-3 bg-[#1a1f2e] border border-[#2d3748] rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t.status}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.priorityLabel === 'critical' ? 'text-rose-400 bg-rose-400/10' : 'text-brand-400 bg-brand-400/10'}`}>
                    {t.priorityLabel}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">{t.title}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  )
}
