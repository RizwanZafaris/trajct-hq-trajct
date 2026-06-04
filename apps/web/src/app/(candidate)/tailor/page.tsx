/**
 * F-002 — Per-company tailored résumé (paid, post-paywall).
 * Shows after the candidate has seen their diagnosis and clicked "Fix it".
 */
export default function TailorPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Your Tailored Résumé</h1>
      <p className="mt-2 text-gray-500">Company-specific, grounded in real hiring signals. No generic AI fluff.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: original vs tailored diff */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-800">Original</h2>
          <div className="mt-4 text-sm text-gray-400">TODO: Resume text display — Sprint 1</div>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="font-semibold text-blue-800">Tailored for [Company]</h2>
          <div className="mt-4 text-sm text-gray-500">TODO: Tailored text + cite-markers — Sprint 1</div>
        </div>
      </div>

      {/* Download + regenerate actions */}
      <div className="mt-6 flex gap-4">
        <button className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Download PDF
        </button>
        <button className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Regenerate
        </button>
      </div>

      {/* Citations panel */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-700">Evidence — what drove each change</h2>
        <p className="mt-2 text-xs text-gray-400">TODO: Cite-markers panel — Sprint 1</p>
      </div>
    </div>
  );
}
