import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ArrowRight, Bell, Database, Shield, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000'

type DashboardSummary = {
  security_score?: number
  asset_count?: number
  critical_vulnerabilities?: number
  open_alerts?: number
  active_incidents?: number
  security_events?: number
  trend?: number[]
  risks?: Array<{ name?: string; value?: number; severity?: string }>
  recommendations?: Array<{ title?: string; priority?: number; status?: string }>
  alert_trend?: Array<{ day?: string; alerts?: number }>
}

type EventItem = {
  id?: string
  timestamp?: string
  event_type?: string
  severity?: string
  source?: string
  message?: string
}

type RecommendationItem = {
  title?: string
  priority?: number
  status?: string
}

const toneClasses: Record<string, string> = {
  cyan: 'bg-cyan-500/10 text-cyan-300',
  blue: 'bg-sky-500/10 text-sky-300',
  red: 'bg-red-500/10 text-red-300',
  amber: 'bg-amber-500/10 text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
  violet: 'bg-violet-500/10 text-violet-300',
}

async function getAuthToken() {
  const cached = localStorage.getItem('cybershield_token')
  if (cached) {
    try {
      const validation = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${cached}` },
      })
      if (validation.ok) {
        return cached
      }
    } catch {
      // fall through to fresh login below
    }
    localStorage.removeItem('cybershield_token')
  }

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@demo.cybershield.local',
      password: 'DemoPass123!',
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to authenticate with the demo account')
  }

  const payload = await response.json()
  const token = payload.access_token as string
  localStorage.setItem('cybershield_token', token)
  return token
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401) {
    localStorage.removeItem('cybershield_token')
    const refreshed = await getAuthToken()
    const retryResponse = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${refreshed}`,
        'Content-Type': 'application/json',
      },
    })

    if (!retryResponse.ok) {
      const detail = await retryResponse.text()
      throw new Error(detail || 'Request failed')
    }

    return (await retryResponse.json()) as T
  }

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || 'Request failed')
  }

  return (await response.json()) as T
}

const fallbackTrend = [62, 66, 70, 74, 78, 82]
const fallbackRiskData = [
  { name: 'Critical', value: 8 },
  { name: 'High', value: 6 },
  { name: 'Medium', value: 5 },
  { name: 'Low', value: 3 },
]

export default function DashboardOverview() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [recommendationsList, setRecommendationsList] = useState<RecommendationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      try {
        const [dashboardResponse, eventsResponse, recommendationsResponse] = await Promise.all([
          apiFetch<DashboardSummary>('/api/dashboard'),
          apiFetch<EventItem[]>('/api/events'),
          apiFetch<RecommendationItem[]>('/api/recommendations'),
        ])

        if (!isMounted) {
          return
        }

        setDashboard(dashboardResponse)
        setEvents(eventsResponse)
        setRecommendationsList(recommendationsResponse)
      } catch (error) {
        console.error('Dashboard load failed', error)
        setDashboard(null)
        setEvents([])
        setRecommendationsList([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const healthScore = dashboard?.security_score ?? 74
  const trendData = useMemo(
    () => (dashboard?.trend && dashboard.trend.length > 0 ? dashboard.trend : fallbackTrend).map((score, index) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] ?? `D${index + 1}`,
      score,
    })),
    [dashboard],
  )

  const riskData = useMemo(
    () =>
      (dashboard?.risks && dashboard.risks.length > 0 ? dashboard.risks : fallbackRiskData).map((risk) => ({
        name: risk.name ?? 'Risk',
        value: Math.min(Math.max(Number(risk.value ?? 0), 0), 100),
      })),
    [dashboard],
  )

  const metricCards = useMemo(
    () => [
      { label: 'Security score', value: `${healthScore}`, change: '+2.4%', tone: 'cyan' },
      { label: 'Monitored assets', value: `${dashboard?.asset_count ?? 0}`, change: '+3 new', tone: 'blue' },
      { label: 'Critical vulnerabilities', value: `${dashboard?.critical_vulnerabilities ?? 0}`, change: '-1 this week', tone: 'red' },
      { label: 'Open alerts', value: `${dashboard?.open_alerts ?? 0}`, change: '12 pending review', tone: 'amber' },
    ],
    [dashboard, healthScore],
  )

  const executiveHighlights = useMemo(
    () => [
      { label: 'Incidents', value: `${dashboard?.active_incidents ?? 0}`, description: 'Open investigations', tone: 'violet' },
      { label: 'log events', value: `${dashboard?.security_events ?? 0}`, description: 'System activity streams', tone: 'cyan' },
      { label: 'Risk posture', value: `${healthScore}/100`, description: 'Current security posture', tone: 'emerald' },
      { label: 'Threat feed', value: `${dashboard?.alert_trend?.length ?? 6}d`, description: 'Rolling alert snapshot', tone: 'blue' },
    ],
    [dashboard, healthScore],
  )

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 animate-pulse">
        <div className="h-6 w-40 rounded bg-slate-800" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, change, tone }) => (
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
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-sky-300" style={{ height: `${Math.max(point.score, 10)}%` }} />
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
                  <span>{risk.value}%</span>
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
                    style={{ width: `${Math.min(risk.value, 100)}%` }}
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
            {(events.length > 0 ? events : [{ id: 'event-demo', event_type: 'monitoring', severity: 'Low', message: 'No new events reported yet.', timestamp: new Date().toISOString() }]).map((event) => (
              <div key={event.id ?? event.message ?? event.event_type} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">{event.event_type ?? 'monitoring'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{event.message ?? 'Monitoring event received'}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${event.severity === 'Critical' ? 'bg-red-500/15 text-red-300' : event.severity === 'High' ? 'bg-orange-500/15 text-orange-300' : 'bg-slate-700 text-slate-300'}`}>
                  {event.severity ?? 'Info'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recommended actions</p>
          <div className="mt-4 space-y-3">
            {(recommendationsList.length > 0 ? recommendationsList : [{ title: 'Review the latest assets and vulnerabilities.', priority: 1, status: 'open' }]).map((item, index) => (
              <div key={`${item.title ?? 'recommendation'}-${index}`} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-300">
                  {index + 1}
                </div>
                <div className="text-sm text-slate-200">{item.title ?? 'Review your active security posture.'}</div>
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
