import { reports } from '../data/seedData'

export default function ReportsPanel() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-xl font-semibold text-white">Executive & technical reporting</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <div key={report.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-white">{report.title}</div>
              <span className={`rounded-full px-2 py-1 text-xs ${report.status === 'Ready' ? 'bg-emerald-500/15 text-emerald-300' : report.status === 'Reviewed' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-amber-500/15 text-amber-300'}`}>{report.status}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">Audience: {report.audience}</p>
            <p className="mt-1 text-sm text-slate-400">Date: {report.date}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
