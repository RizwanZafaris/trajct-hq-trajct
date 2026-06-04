/**
 * F-018 — Application tracker + analytics (W-107).
 */
export default function TrackerPage(): JSX.Element {
  const statusColors: Record<string, string> = {
    wishlist:     "bg-gray-100 text-gray-600",
    applied:      "bg-blue-100 text-blue-700",
    phone_screen: "bg-yellow-100 text-yellow-700",
    interview:    "bg-purple-100 text-purple-700",
    offer:        "bg-green-100 text-green-700",
    rejected:     "bg-red-100 text-red-700",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Applications</h1>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          + Add application
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3 text-left">Company</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Applied</th>
              <th className="px-6 py-3 text-left">Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="text-gray-400">
              <td colSpan={5} className="px-6 py-8 text-center">
                No applications yet. Add your first! — TODO: Wire API — V1
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
