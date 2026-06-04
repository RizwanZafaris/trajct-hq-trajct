/** F-038 — Hiring pipeline / kanban board. */
export default function PipelinePage(): JSX.Element {
  const stages = ["Applied", "Phone Screen", "Interview", "Offer", "Hired"];

  return (
    <div className="px-4 py-10">
      <h1 className="text-3xl font-bold">Pipeline</h1>
      <p className="mt-2 text-gray-500">Drag candidates across stages. Every move is logged.</p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage} className="min-w-[220px] rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700">{stage}</h3>
            <div className="mt-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-xs text-gray-400">
              Drop candidates here — TODO: V1
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
