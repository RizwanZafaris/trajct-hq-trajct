const features = [
  { title: "Create a JD",           description: "Free AI JD generation (F-030)",     href: "/employer/jobs/new",  release: "Sprint 1", p: "P0" },
  { title: "Jobs",                  description: "All your job postings (F-030)",      href: "/employer/jobs",      release: "Sprint 1", p: "P0" },
  { title: "Candidate Matching",    description: "AI-ranked, trust-wall safe (F-032)", href: "/employer/matching",  release: "V1",       p: "P1" },
  { title: "Pipeline",              description: "Kanban workflow + scorecards (F-038)",href: "/employer/pipeline", release: "V1",       p: "P1" },
  { title: "Analytics",             description: "TTH, CPH, funnel, bias (F-039)",     href: "/employer/analytics", release: "V2",       p: "P2" },
  { title: "Org Settings",          description: "Team, RBAC, billing (F-070e/072e)",  href: "/employer/settings",  release: "Sprint 1", p: "P0" },
];

export default function EmployerDashboard(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
      <p className="mt-1 text-gray-500">Hire on demonstrated ability, not polished résumés.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <a
            key={f.href + f.title}
            href={f.href}
            className="group block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-gray-900 group-hover:text-emerald-700">{f.title}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                f.p === "P0" ? "bg-emerald-100 text-emerald-700" :
                f.p === "P1" ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-400"
              }`}>{f.p}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{f.description}</p>
            <p className="mt-2 text-xs text-gray-400">{f.release}</p>
          </a>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm">
        <strong className="text-amber-800">Screening (F-034) is off</strong>
        <span className="ml-2 text-amber-700">— launch gate checklist must be completed before enabling. See docs/runbooks/screening-launch-gate.md.</span>
      </div>
    </div>
  );
}
