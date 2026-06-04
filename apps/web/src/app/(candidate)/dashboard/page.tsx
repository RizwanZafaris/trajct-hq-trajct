const features = [
  { title: "Resume Diagnostic", description: "Honest score + reasons (F-001)", href: "/candidate/diagnostic", release: "Sprint 1", p: "P0" },
  { title: "Tailored Résumé",   description: "Per-company targeted resume (F-002)", href: "/candidate/tailor",     release: "Sprint 1", p: "P0" },
  { title: "Interview Prep",    description: "Company-specific questions (F-007)",   href: "/candidate/prep",       release: "V1",      p: "P0" },
  { title: "Mock Interview",    description: "Practice with AI (F-008)",             href: "/candidate/mock",       release: "V1",      p: "P1" },
  { title: "Job Tracker",       description: "Track all applications (F-018)",       href: "/candidate/tracker",    release: "V1",      p: "P1" },
  { title: "Job Alerts",        description: "Monitor companies & roles (F-015)",    href: "/candidate/monitoring", release: "V1",      p: "P0" },
  { title: "Rate a Job",        description: "Fit score by URL/JD (F-005)",          href: "/candidate/tracker",    release: "V1",      p: "P0" },
  { title: "LinkedIn Tools",    description: "Profile + post generation (F-011/012)",href: "/candidate/linkedin",   release: "V1",      p: "P1" },
  { title: "Offer Evaluation",  description: "Is this offer fair? (F-022)",          href: "/candidate/offer",      release: "V1",      p: "P1" },
  { title: "Follow-up Cadence", description: "Auto-drafted follow-ups (F-020)",      href: "/candidate/tracker",    release: "V1",      p: "P1" },
  { title: "Career Coach",      description: "Personalized coaching (F-027)",        href: "/candidate/coaching",   release: "V2",      p: "P2" },
];

export default function CandidateDashboard(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Candidate Dashboard</h1>
      <p className="mt-1 text-gray-500">Your AI-powered job search accelerator.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <a
            key={f.href + f.title}
            href={f.href}
            className="group block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-700">{f.title}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                f.p === "P0" ? "bg-blue-100 text-blue-700" :
                f.p === "P1" ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-400"
              }`}>{f.p}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{f.description}</p>
            <p className="mt-2 text-xs text-gray-400">{f.release}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
