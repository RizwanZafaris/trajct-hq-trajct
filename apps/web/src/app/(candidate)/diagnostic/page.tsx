/**
 * F-001 — Honest Diagnostic page (W-101)
 * Free, no signup required before seeing results.
 * The primary acquisition surface.
 */
export default function DiagnosticPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Get Your Honest Score</h1>
        <p className="mt-3 text-xl text-gray-500">
          Find out exactly why you&apos;re not getting callbacks — in 8 seconds.
        </p>
      </div>

      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* TODO Sprint 1: Wire upload form + polling */}
        <DiagnosticUploadForm />
      </div>

      {/* Results panel — shown after diagnosis */}
      <div className="mt-8 hidden" id="results-panel">
        <DiagnosticResultPanel />
      </div>
    </main>
  );
}

function DiagnosticUploadForm(): JSX.Element {
  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700">Your Résumé</label>
        <div className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 hover:border-blue-400">
          <div className="text-center">
            <p className="text-sm text-gray-600">Drop your PDF/DOCX here, or <span className="text-blue-600 cursor-pointer">browse</span></p>
            <p className="mt-1 text-xs text-gray-400">Max 5 MB · PDF, DOCX, TXT</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700">Target Job</label>
        <input
          type="url"
          placeholder="Paste job URL or JD text below..."
          className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-6 py-4 text-base font-semibold text-white hover:bg-blue-700"
      >
        Diagnose my résumé →
      </button>
      <p className="text-center text-xs text-gray-400">Free · No signup required · Results in ~8 seconds</p>
    </form>
  );
}

function DiagnosticResultPanel(): JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">TODO: Wire diagnostic results — Sprint 1</p>
    </div>
  );
}
