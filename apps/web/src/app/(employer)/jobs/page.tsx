/** F-030 / F-038 — Employer jobs list. */
export default function EmployerJobsPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <a href="/employer/jobs/new" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          + Create job
        </a>
      </div>
      <div className="mt-6 rounded-xl border bg-white p-8 text-center text-gray-400 text-sm">
        No jobs yet. Create your first JD — it&apos;s free. — TODO: Wire API — Sprint 1
      </div>
    </div>
  );
}
