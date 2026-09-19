import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Activity, Shield } from 'lucide-react'
import './App.css'

const queryClient = new QueryClient()

const DashboardOverview = lazy(() => import('./views/DashboardOverview'))
const AssetPanel = lazy(() => import('./views/AssetPanel'))
const ScanPanel = lazy(() => import('./views/ScanPanel'))
const ReportsPanel = lazy(() => import('./views/ReportsPanel'))
const AiAnalystPanel = lazy(() => import('./views/AiAnalystPanel'))

function DashboardView() {
  const [simulated, setSimulated] = useState(false)
  const [activeView, setActiveView] = useState<'dashboard' | 'assets' | 'scans' | 'reports' | 'ai'>('dashboard')

  useEffect(() => {
    document.title = 'CyberShield 360 | Dashboard'
  }, [])

  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'assets', label: 'Assets' },
      { id: 'scans', label: 'Scans' },
      { id: 'reports', label: 'Reports' },
      { id: 'ai', label: 'AI Analyst' },
    ] as const,
    [],
  )

  const renderContent = () => {
    if (activeView === 'assets') {
      return (
        <Suspense fallback={<PanelSkeleton label="Assets" />}>
          <AssetPanel />
        </Suspense>
      )
    }

    if (activeView === 'scans') {
      return (
        <Suspense fallback={<PanelSkeleton label="Scan workflow" />}>
          <ScanPanel />
        </Suspense>
      )
    }

    if (activeView === 'reports') {
      return (
        <Suspense fallback={<PanelSkeleton label="Reports" />}>
          <ReportsPanel />
        </Suspense>
      )
    }

    if (activeView === 'ai') {
      return (
        <Suspense fallback={<PanelSkeleton label="AI Analyst" />}>
          <AiAnalystPanel />
        </Suspense>
      )
    }

    return (
      <Suspense fallback={<PanelSkeleton label="Dashboard" />}>
        <DashboardOverview />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">CyberShield</div>
              <div className="font-semibold">360</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-300">DEMO ENVIRONMENT</span>
            <button
              type="button"
              onClick={() => setSimulated(true)}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Run Security Simulation
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                activeView === item.id ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-2">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Executive overview</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Security Command Dashboard</h1>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
            <span className="text-slate-500">Last update</span>
            <div className="mt-1 font-medium text-white">09:42 UTC</div>
          </div>
        </div>

        {renderContent()}

        {simulated && (
          <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 text-cyan-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Demo simulation</p>
                <h3 className="mt-2 text-xl font-semibold">Security event sequence triggered</h3>
              </div>
              <Activity className="h-5 w-5" />
            </div>
            <ol className="mt-4 space-y-2 text-sm text-cyan-50">
              <li>1. New workstation discovered on the authorised lab subnet.</li>
              <li>2. Critical vulnerability detected on SERVER-01.</li>
              <li>3. Failed login events produce a security alert.</li>
              <li>4. Security score updates and an incident is opened for investigation.</li>
            </ol>
          </div>
        )}
      </main>
    </div>
  )
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 animate-pulse">
      <div className="h-6 w-40 rounded bg-slate-800" />
      <div className="mt-4 space-y-3">
        <div className="h-16 rounded bg-slate-800" />
        <div className="h-16 rounded bg-slate-800" />
        <div className="h-16 rounded bg-slate-800" />
      </div>
      <div className="mt-4 text-sm text-slate-400">Loading {label}…</div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardView />
    </QueryClientProvider>
  )
}

export default App
