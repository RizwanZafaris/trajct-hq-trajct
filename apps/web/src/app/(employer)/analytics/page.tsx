/** F-039 — Recruiting analytics (TTH, CPH, funnel, bias). */
export default function AnalyticsPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Recruiting Analytics</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {["Time to Fill", "Cost per Hire", "Offer Acceptance", "Bias Flags"].map((metric) => (
          <div key={metric} className="rounded-xl border bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{metric}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400">TODO V2</p>
          </div>
        ))}
      </div>
    </div>
  );
}
