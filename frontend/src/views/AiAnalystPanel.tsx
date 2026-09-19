import { aiAnalysis } from '../data/seedData'

export default function AiAnalystPanel() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-xl font-semibold text-white">AI Security Analyst</h3>
      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
        <p className="font-medium text-white">Question: {aiAnalysis.question}</p>
        <p className="mt-3">{aiAnalysis.answer}</p>
        <div className="mt-4 space-y-2">
          {aiAnalysis.facts.map((fact) => (
            <div key={fact} className="rounded-lg bg-slate-900/80 p-2 text-slate-200">• {fact}</div>
          ))}
        </div>
      </div>
    </section>
  )
}
