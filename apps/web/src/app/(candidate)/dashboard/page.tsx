export default function CandidateDashboard(): JSX.Element {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Candidate Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to your Trajct candidate portal. Features coming in Sprint 1.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardCard title="Resume Diagnostic" description="Upload your resume for AI analysis (F-001)" href="/candidate/diagnostic" disabled />
        <DashboardCard title="Tailored Resume" description="Get a targeted resume (F-002)" href="/candidate/tailor" disabled />
        <DashboardCard title="Job Tracker" description="Track your applications (F-018)" href="/candidate/tracker" disabled />
      </div>
    </div>
  );
}

function DashboardCard({ title, description, href, disabled }: { title: string; description: string; href: string; disabled?: boolean }): JSX.Element {
  return (
    <a
      href={disabled ? "#" : href}
      className={`block rounded-lg border p-6 transition ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-blue-500 hover:shadow"}`}
    >
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {disabled && <span className="mt-2 inline-block text-xs text-gray-400">Coming in Sprint 1</span>}
    </a>
  );
}
