"use client";
import { useQuery } from "@tanstack/react-query";
import { Plus, ChevronRight, Briefcase } from "lucide-react";
import { format } from "date-fns";

export default function CasesPage() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => fetch("/api/cases").then((res) => res.json()),
  });

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">Loading cases...</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          My Cases
        </h1>
        <a href="/dashboard/cases/create">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
            <Plus size={18} />
            <span>Create Case</span>
          </button>
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">State</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Next Hearing</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cases && cases.length > 0 ? (
              cases.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <a href={`/dashboard/cases/${c.id}`} className="block">
                      {c.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <a href={`/dashboard/cases/${c.id}`} className="block">
                      {c.state}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`/dashboard/cases/${c.id}`} className="block">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : c.status === "Paused"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </a>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <a href={`/dashboard/cases/${c.id}`} className="block">
                      {c.next_hearing_date
                        ? format(new Date(c.next_hearing_date), "MMM d, yyyy")
                        : "—"}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/dashboard/cases/${c.id}`}>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-purple-500 inline-block"
                      />
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Briefcase className="text-gray-300" size={32} />
                    <p>No cases found.</p>
                    <a
                      href="/dashboard/cases/create"
                      className="text-purple-600 hover:underline"
                    >
                      Create your first case
                    </a>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
