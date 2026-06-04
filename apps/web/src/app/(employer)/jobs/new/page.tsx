/**
 * F-030 — AI JD generation (free front door, W-201).
 * No auth required to generate. Auth required to save/publish.
 */
export default function NewJobPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Create a Job Description</h1>
      <p className="mt-2 text-gray-500">Free forever. AI-powered, bias-checked, ready in 20 seconds.</p>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Product Manager"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Level</label>
              <select className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm">
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="staff">Staff</option>
                <option value="junior">Junior</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Must-haves (one per line)</label>
            <textarea
              rows={4}
              placeholder="5+ years experience in payments&#10;SQL proficiency&#10;Fintech background"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-700"
          >
            Generate JD →
          </button>
        </form>
      </div>

      {/* Generated JD panel */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Generated JD</h2>
          <div className="flex gap-2">
            <button className="rounded border border-gray-300 px-3 py-1 text-xs">Copy</button>
            <button className="rounded bg-emerald-600 px-3 py-1 text-xs text-white">Publish →</button>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-400">TODO: Wire JD generation — Sprint 1 (W10)</p>
      </div>

      {/* Inclusivity flags panel */}
      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-800">Inclusivity check (F-031)</h3>
        <p className="mt-1 text-xs text-amber-700">TODO: Wire inclusivity flag display — Sprint 1</p>
      </div>
    </div>
  );
}
