/** F-032 — AI candidate matching (trust-wall safe). */
export default function MatchingPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Matched Candidates</h1>
      <p className="mt-2 text-gray-500">Ranked by fit. Every advance/reject requires your decision.</p>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <p className="text-sm text-gray-400">
          TODO: Candidate cards (trust-wall safe — anonymizedId only, no private data) — V1
        </p>
        {/* Each card shows: fit score, band, match factors, hidden-gem badge */}
        {/* Decision buttons: Shortlist | Pass — HUMAN decision required */}
      </div>
    </div>
  );
}
