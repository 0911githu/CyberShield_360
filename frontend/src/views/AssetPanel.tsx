import { useEffect, useMemo, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000'

type AssetRow = {
  id?: string
  name: string
  type?: string
  asset_type?: string
  ip_address?: string
  hostname?: string
  owner?: string
  criticality?: string
  risk_level?: string
  environment?: string
  status?: string
  monitoring_enabled?: boolean
}

type NetworkRow = {
  id?: string
  name: string
  cidr?: string
  authorised?: boolean
}

type VulnerabilityRow = {
  id?: string
  title?: string
  severity?: string
  status?: string
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

export default function AssetPanel() {
  const [assets, setAssets] = useState<AssetRow[]>([])
  const [networks, setNetworks] = useState<NetworkRow[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityRow[]>([])
  const [scanMessage, setScanMessage] = useState('No scan run yet')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'server',
    ip_address: '',
    hostname: '',
    owner: 'Operations',
    environment: 'production',
    criticality: 'medium',
  })

  const vulnSummary = useMemo(
    () => ({
      critical: vulnerabilities.filter((item) => (item.severity || '').toLowerCase() === 'critical').length,
      high: vulnerabilities.filter((item) => (item.severity || '').toLowerCase() === 'high').length,
    }),
    [vulnerabilities],
  )

  const loadInventory = async () => {
    try {
      const [assetResponse, networkResponse, vulnerabilityResponse] = await Promise.all([
        apiFetch<AssetRow[]>('/api/assets'),
        apiFetch<NetworkRow[]>('/api/networks'),
        apiFetch<VulnerabilityRow[]>('/api/vulnerabilities'),
      ])

      setAssets(assetResponse)
      setNetworks(networkResponse)
      setVulnerabilities(vulnerabilityResponse)
    } catch (error) {
      console.error(error)
      setAssets([])
      setNetworks([])
      setVulnerabilities([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadInventory()
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name,
        type: form.type,
        ip_address: form.ip_address || '10.10.0.0',
        hostname: form.hostname || form.name,
        owner: form.owner,
        environment: form.environment,
        criticality: form.criticality,
        status: 'monitored',
        monitoring_enabled: true,
      }

      const response = await apiFetch<{ status: string; asset?: AssetRow }>('/api/assets/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.asset) {
        setAssets((current) => [response.asset as AssetRow, ...current])
      }

      setForm({
        name: '',
        type: 'server',
        ip_address: '',
        hostname: '',
        owner: 'Operations',
        environment: 'production',
        criticality: 'medium',
      })
    } catch (error) {
      console.error(error)
      setScanMessage(error instanceof Error ? error.message : 'Create asset failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScan = async () => {
    try {
      const result = await apiFetch<{ summary?: string; status?: string } | Array<{ summary?: string; status?: string }> >('/api/scans', {
        method: 'POST',
      })

      const scanSummary = Array.isArray(result) ? result[0]?.summary ?? result[0]?.status ?? 'Scan completed' : result.summary ?? result.status ?? 'Scan completed'
      setScanMessage(scanSummary)
    } catch (error) {
      console.error(error)
      setScanMessage(error instanceof Error ? error.message : 'Scan failed')
    }
  }

  const handleSeedData = async () => {
    try {
      const response = await apiFetch<{ status: string; count?: number; records?: AssetRow[] }>('/api/assets/seed', {
        method: 'POST',
      })

      if (response.count && response.records) {
        setAssets((current) => [...response.records as AssetRow[], ...current])
      }
      setScanMessage(response.status === 'seeded' ? `Inserted ${response.count ?? 0} records` : 'Seed completed')
      await loadInventory()
    } catch (error) {
      console.error(error)
      setScanMessage(error instanceof Error ? error.message : 'Seed failed')
    }
  }

  const handleDeleteAsset = async (assetId?: string) => {
    if (!assetId) {
      return
    }

    try {
      await apiFetch(`/api/assets/${assetId}`, { method: 'DELETE' })
      setAssets((current) => current.filter((asset) => (asset.id ?? '').toString() !== assetId))
      setScanMessage(`Deleted asset ${assetId}`)
    } catch (error) {
      console.error(error)
      setScanMessage(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">Asset inventory</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSeedData}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300"
          >
            Seed demo data
          </button>
          <button
            type="button"
            onClick={handleScan}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300"
          >
            Run network scan
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Monitored assets</div>
          <div className="mt-2 text-2xl font-semibold text-white">{assets.length}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Critical findings</div>
          <div className="mt-2 text-2xl font-semibold text-red-300">{vulnSummary.critical}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Network ranges</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-300">{networks.length}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
        <span className="text-slate-500">Latest scan result:</span> {scanMessage}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-2">
        <label className="text-sm text-slate-300">
          Asset name
          <input
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500"
            placeholder="SERVER-09"
          />
        </label>

        <label className="text-sm text-slate-300">
          Type
          <select
            value={form.type}
            onChange={(event) => handleChange('type', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
          >
            <option value="server">Server</option>
            <option value="endpoint">Endpoint</option>
            <option value="network">Network</option>
            <option value="cloud">Cloud</option>
          </select>
        </label>

        <label className="text-sm text-slate-300">
          IP address
          <input
            value={form.ip_address}
            onChange={(event) => handleChange('ip_address', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none placeholder:text-slate-500"
            placeholder="10.10.0.22"
          />
        </label>

        <label className="text-sm text-slate-300">
          Hostname
          <input
            value={form.hostname}
            onChange={(event) => handleChange('hostname', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none placeholder:text-slate-500"
            placeholder="server-09.local"
          />
        </label>

        <label className="text-sm text-slate-300">
          Owner
          <input
            value={form.owner}
            onChange={(event) => handleChange('owner', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <label className="text-sm text-slate-300">
          Environment
          <select
            value={form.environment}
            onChange={(event) => handleChange('environment', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Risk level
          <select
            value={form.criticality}
            onChange={(event) => handleChange('criticality', event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Register asset'}
          </button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h4 className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-400">Live asset list</h4>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-slate-400">Loading inventory…</div>
            ) : assets.length === 0 ? (
              <div className="text-sm text-slate-400">No assets available yet.</div>
            ) : (
              assets.map((asset) => (
                <div key={asset.id ?? `${asset.name}-${asset.ip_address}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <div>
                    <div className="font-medium text-white">{asset.name}</div>
                    <div className="text-sm text-slate-400">
                      {asset.ip_address || 'No IP'} • {asset.type || asset.asset_type || 'device'} • {asset.environment || 'production'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{asset.owner || 'Unassigned'}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        (asset.criticality || asset.risk_level || '').toLowerCase() === 'critical'
                          ? 'bg-red-500/15 text-red-300'
                          : (asset.criticality || asset.risk_level || '').toLowerCase() === 'high'
                            ? 'bg-orange-500/15 text-orange-300'
                            : (asset.criticality || asset.risk_level || '').toLowerCase() === 'medium'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {(asset.criticality || asset.risk_level || 'low').toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h4 className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-400">Network and risk posture</h4>
          <div className="space-y-3">
            {networks.length === 0 ? (
              <div className="text-sm text-slate-400">No protected network ranges found.</div>
            ) : (
              networks.map((network) => (
                <div key={network.id ?? network.name} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">{network.name}</div>
                    <span className={`rounded-full px-2 py-1 text-xs ${network.authorised ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                      {network.authorised ? 'Authorised' : 'Blocked'}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{network.cidr || 'No CIDR available'}</div>
                </div>
              ))
            )}

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Vulnerability summary</div>
              <div className="mt-2 text-sm text-slate-300">
                {vulnSummary.critical} critical, {vulnSummary.high} high priority findings
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
