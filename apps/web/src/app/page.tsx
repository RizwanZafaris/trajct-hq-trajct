export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Trajct</h1>
      <p className="mt-4 text-xl text-gray-600">AI Hiring & Career Acceleration</p>
      <div className="mt-8 flex gap-4">
        <a href="/(candidate)/dashboard" className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          Candidate Portal
        </a>
        <a href="/(employer)/dashboard" className="rounded bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700">
          Employer Portal
        </a>
      </div>
    </main>
  );
}
