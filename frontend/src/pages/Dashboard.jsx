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
return ( <div className="card"> <div className="flex items-start justify-between"> <div> <p className="text-slate-500 text-xs">{label}</p> <p className="text-white text-2xl font-bold">{value ?? 0}</p> </div> <Icon size={18} /> </div> </div>
)
}

function TaskRow({ task }) {
if (!task) return null
return ( <div className="py-2 border-b border-[#1e2535]"> <p className="text-white text-sm">{task.title || 'Untitled'}</p> </div>
)
}

export default function Dashboard() {
const { user } = useAuth()
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
api.get('/dashboard/insights')
.then(res => {
console.log("DASHBOARD DATA:", res.data) // DEBUG
setData(res.data)
})
.catch(err => {
console.error("DASHBOARD ERROR:", err)
setData(null)
})
.finally(() => setLoading(false))
}, [])

if (loading) return <div className="text-white p-10">Loading...</div>
if (!data) return <div className="text-red-400 p-10">Failed to load dashboard</div>

// ✅ SAFE DATA HANDLING
const summary = data?.summary || {}

const statusBreakdown = Array.isArray(data?.statusBreakdown)
? data.statusBreakdown
: []

const priorityBreakdown = data?.priorityBreakdown || {}
const overdueTasks = Array.isArray(data?.overdueTasks)
? data.overdueTasks
: []

// ✅ SAFE CHART DATA
const safeStatusData = statusBreakdown.length
? statusBreakdown
: [{ label: 'None', count: 0, color: '#8884d8' }]

const priorityChartData = Object.entries(priorityBreakdown || {}).map(([key, val]) => ({
name: key,
value: val,
color: PRIORITY_COLORS[key] || '#999'
}))

const safePriorityData = priorityChartData.length
? priorityChartData
: [{ name: 'none', value: 1, color: '#999' }]

return ( <div className="p-6 space-y-6"> <h1 className="text-white text-2xl font-bold">
Welcome {user?.name || 'User'} </h1>

```
  {/* Stats */}
  <div className="grid grid-cols-2 gap-4">
    <StatCard label="Total Tasks" value={summary.totalTasks || 0} icon={Activity} />
    <StatCard label="Completed" value={summary.doneTasks || 0} icon={CheckCircle2} />
    <StatCard label="Overdue" value={summary.overdueCount || 0} icon={AlertTriangle} />
    <StatCard label="Critical" value={summary.criticalCount || 0} icon={Flame} />
  </div>

  {/* Charts */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

    {/* Status Chart */}
    <div className="card p-4">
      <h3 className="text-white mb-2">Status</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={safeStatusData}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count">
            {safeStatusData.map((entry, i) => (
              <Cell key={i} fill={entry.color || '#8884d8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Priority Chart */}
    <div className="card p-4">
      <h3 className="text-white mb-2">Priority</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={safePriorityData} dataKey="value">
            {safePriorityData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>

  </div>

  {/* Overdue Tasks */}
  <div className="card p-4">
    <h3 className="text-white mb-2">Overdue Tasks</h3>
    {overdueTasks.length === 0 ? (
      <p className="text-gray-400">No overdue tasks</p>
    ) : (
      overdueTasks.map(t => <TaskRow key={t._id} task={t} />)
    )}
  </div>
</div>

)
}
