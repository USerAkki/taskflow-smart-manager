import { useState } from 'react'
import { Zap, X, Clock, AlertTriangle, CheckCircle, Loader, Lightbulb } from 'lucide-react'
import api from '../services/api'

const PRIORITY_ICON = {
  high: <span className="badge-high">High</span>,
  medium: <span className="badge-medium">Medium</span>,
  low: <span className="badge-low">Low</span>
}

const RISK_COLORS = {
  low: 'text-green-400 bg-green-500/10 border-green-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-red-400 bg-red-500/10 border-red-500/20'
}

export default function AIBreakdownModal({ onClose, onApply }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!title.trim()) return
    setError(''); setResult(null); setLoading(true)
    try {
      const { data } = await api.post('/tasks/ai-breakdown', { title, description })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'AI analysis failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161b27] border border-[#2d3748] rounded-2xl w-full max-w-lg shadow-2xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d3748]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <Zap size={15} className="text-brand-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">AI Task Breakdown</h2>
              <p className="text-slate-500 text-xs">Get smart subtasks + time estimates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Input */}
          <div>
            <label className="label">Task Title *</label>
            <input className="input" placeholder='e.g. "Build login system with JWT"'
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()} />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input resize-none" rows={2}
              placeholder="Add context for better breakdown..."
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={!title.trim() || loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            {loading ? (
              <><Loader size={14} className="animate-spin" /> Analyzing...</>
            ) : (
              <><Zap size={14} /> Analyze Task</>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="space-y-3 fade-in">
              {/* Tip */}
              {result.suggestion && (
                <div className="flex items-start gap-2.5 bg-brand-500/5 border border-brand-500/15 rounded-xl px-4 py-3">
                  <Lightbulb size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-xs leading-relaxed">{result.suggestion}</p>
                </div>
              )}

              {/* Metrics */}
              <div className="flex gap-3">
                <div className="flex-1 bg-[#1a1f2e] rounded-xl px-4 py-3 text-center">
                  <div className="text-white font-bold text-lg">{result.totalEstimatedHours ?? '—'}h</div>
                  <div className="text-slate-500 text-xs mt-0.5">Est. Total</div>
                </div>
                <div className={`flex-1 rounded-xl px-4 py-3 text-center border ${RISK_COLORS[result.riskLevel] || RISK_COLORS.low}`}>
                  <div className="font-bold text-lg capitalize">{result.riskLevel || 'low'}</div>
                  <div className="text-xs opacity-70 mt-0.5">Risk Level</div>
                </div>
                <div className="flex-1 bg-[#1a1f2e] rounded-xl px-4 py-3 text-center">
                  <div className="text-white font-bold text-lg">{(result.subtasks || []).length}</div>
                  <div className="text-slate-500 text-xs mt-0.5">Subtasks</div>
                </div>
              </div>

              {/* Subtasks */}
              <div className="bg-[#1a1f2e] rounded-xl divide-y divide-[#2d3748] overflow-hidden">
                {(result.subtasks || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-5 h-5 rounded-full border border-[#2d3748] flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-600 text-[10px]">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm">{s.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock size={11} />{s.estimatedHours}h
                      </span>
                      {PRIORITY_ICON[s.priority] || PRIORITY_ICON.low}
                    </div>
                  </div>
                ))}
              </div>

              {/* Apply */}
              <button onClick={() => onApply(result)} className="btn-primary w-full flex items-center justify-center gap-2">
                <CheckCircle size={14} /> Apply to Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

