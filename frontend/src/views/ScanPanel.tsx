import { scanHistory } from '../data/seedData'

export default function ScanPanel() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-xl font-semibold text-white">Authorised scan workflow</h3>
      <div className="mt-5 space-y-4 text-sm text-slate-300">
        {scanHistory.map((scan) => (
          <div key={scan.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-white">{scan.id}</div>
              <span className={`rounded-full px-2 py-1 text-xs ${scan.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-cyan-500/15 text-cyan-300'}`}>{scan.status}</span>
            </div>
            <p className="mt-2">Target: {scan.target}</p>
            <p className="mt-1">Findings: {scan.findings} • Owner: {scan.owner}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
