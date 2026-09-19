import { useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000'

type ScanResult = {
  status?: string
  target?: string
  summary?: string
  hosts?: Array<{
    ip?: string
    open_ports?: Array<{ port?: number; service?: string; status?: string }>
    vulnerabilities?: Array<{ title?: string; severity?: string; details?: string }>
  }>
  vulnerabilities?: Array<{ title?: string; severity?: string; details?: string }>
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

  if (!response.ok) throw new Error('Unable to authenticate')

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
      throw new Error(detail || 'Scan request failed')
    }

    return (await retryResponse.json()) as T
  }

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || 'Scan request failed')
  }

  return (await response.json()) as T
}

export default function ScanPanel() {
  const [target, setTarget] = useState('10.10.0.0/24')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await apiFetch<ScanResult>('/api/scans', {
        method: 'POST',
        body: JSON.stringify({ target }),
      })
      setResult(response)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-2 block text-sm text-slate-300">Target network or IP</label>
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="10.10.0.0/24 or 10.10.0.12"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={isLoading}
          className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Scanning…' : 'Run network scan'}
        </button>
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

      {result && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Scan result</h3>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">{result.status ?? 'completed'}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">Target: {result.target}</p>
            <p className="mt-1 text-sm text-slate-300">{result.summary}</p>
          </div>

          {result.hosts && result.hosts.length > 0 ? (
            result.hosts.map((host) => (
              <div key={host.ip} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-base font-medium text-white">Host {host.ip}</h4>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
                    {host.open_ports?.length ?? 0} open ports
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {(host.open_ports ?? []).length > 0 ? (
                    host.open_ports?.map((port) => (
                      <div key={`${host.ip}-${port.port}`} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                        Port {port.port} • {port.service} • {port.status}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No open ports detected.</div>
                  )}
                </div>

                {(host.vulnerabilities ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-white">Likely findings</p>
                    {host.vulnerabilities?.map((finding) => (
                      <div key={`${host.ip}-${finding.title}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-red-200">{finding.title}</span>
                          <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            finding.severity === 'high' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {finding.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-slate-300">{finding.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              No reachable hosts were found for the provided target.
            </div>
          )}
        </div>
      )}
    </section>
  )
}
