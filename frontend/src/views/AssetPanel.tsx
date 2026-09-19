import { assetInventory } from '../data/seedData'

export default function AssetPanel() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-xl font-semibold text-white">Assets</h3>
      <div className="mt-5 space-y-3">
        {assetInventory.map((asset) => (
          <div key={asset.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div>
              <div className="font-medium text-white">{asset.name}</div>
              <div className="text-sm text-slate-400">{asset.ip} • {asset.type} • {asset.region}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{asset.owner}</span>
              <span className={`rounded-full px-2 py-1 text-xs ${asset.risk === 'Critical' ? 'bg-red-500/15 text-red-300' : asset.risk === 'High' ? 'bg-orange-500/15 text-orange-300' : asset.risk === 'Medium' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                {asset.risk}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
