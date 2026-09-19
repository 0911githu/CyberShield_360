import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ArrowRight, Bell, Database, Shield, TrendingUp } from 'lucide-react'
import { executiveHighlights, recentEvents, recommendations, riskData, securityMetrics, trendData } from '../data/seedData'

const toneClasses: Record<string, string> = {
  cyan: 'bg-cyan-500/10 text-cyan-300',
  blue: 'bg-sky-500/10 text-sky-300',
  red: 'bg-red-500/10 text-red-300',
  amber: 'bg-amber-500/10 text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
  violet: 'bg-violet-500/10 text-violet-300',
}

export default function DashboardOverview() {
  const healthScore = 74

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {securityMetrics.map(({ label, value, change, tone }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{label}</span>
              <span className={`rounded-lg p-2 ${toneClasses[tone]}`}>
                {label === 'Security score' && <Shield className="h-4 w-4" />}
                {label === 'Monitored assets' && <Database className="h-4 w-4" />}
                {label === 'Critical vulnerabilities' && <AlertTriangle className="h-4 w-4" />}
                {label === 'Open alerts' && <Bell className="h-4 w-4" />}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <strong className="text-3xl font-semibold text-white">{value}</strong>
              <span className="text-xs text-emerald-300">{change}</span>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">CyberShield Security Health Score</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{healthScore} / 100</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              Stable trend
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {trendData.map((point) => (
              <div key={point.day} className="flex flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end justify-center rounded-xl bg-slate-800 p-1">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-sky-300" style={{ height: `${point.score}%` }} />
                </div>
                <span className="text-xs text-slate-400">{point.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Risk distribution</p>
          <div className="mt-6 space-y-4">
            {riskData.map((risk) => (
              <div key={risk.name}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{risk.name}</span>
                  <span>{risk.value}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      risk.name === 'Critical'
                        ? 'bg-red-500'
                        : risk.name === 'High'
                          ? 'bg-orange-400'
                          : risk.name === 'Medium'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(risk.value / 12) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recent security events</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Live monitoring</h3>
            </div>
            <button type="button" className="flex items-center gap-2 text-sm text-cyan-300">
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.time} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{event.time}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">{event.type}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{event.message}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${event.severity === 'Critical' ? 'bg-red-500/15 text-red-300' : event.severity === 'High' ? 'bg-orange-500/15 text-orange-300' : 'bg-slate-700 text-slate-300'}`}>
                  {event.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recommended actions</p>
          <div className="mt-4 space-y-3">
            {recommendations.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-300">
                  {index + 1}
                </div>
                <div className="text-sm text-slate-200">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {executiveHighlights.map(({ label, value, description, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-cyan-300">
              <Activity className="h-4 w-4" />
              <span className="text-sm uppercase tracking-[0.25em]">{label}</span>
            </div>
            <div className="mt-4 text-2xl font-semibold text-white">{value}</div>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
            <div className={`mt-4 inline-flex rounded-full px-2 py-1 text-xs ${toneClasses[tone]}`}>{tone}</div>
          </div>
        ))}
      </section>
    </>
  )
}

export const dashboardLabel = 'Dashboard'
