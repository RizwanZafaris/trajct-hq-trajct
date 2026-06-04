/** F-011 / F-012 — LinkedIn optimization + post generation. */
export default function LinkedInPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">LinkedIn</h1>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Profile Optimization</h2>
          <p className="mt-2 text-sm text-gray-400">F-011 — TODO V1</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Post Generator</h2>
          <p className="mt-2 text-sm text-gray-400">F-012 — TODO V1</p>
        </div>
      </div>
    </div>
  );
}
