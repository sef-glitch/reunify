"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Calendar,
  CheckSquare,
  Plus,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => fetch("/api/cases").then((res) => res.json()),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then((res) => res.json()),
  });

  const activeCases = Array.isArray(cases)
    ? cases.filter((c) => c.status === "Active")
    : [];

  const dueSoonTasks = Array.isArray(tasks)
    ? tasks.filter((t) => {
        if (t.status === "completed" || !t.due_date) return false;
        const due = new Date(t.due_date);
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        return due >= now && due <= nextWeek;
      })
    : [];

  let nextHearing = null;
  if (Array.isArray(cases)) {
    const hearingDates = cases
      .map((c) => (c.next_hearing_date ? new Date(c.next_hearing_date) : null))
      .filter((d) => d && d >= new Date())
      .sort((a, b) => a - b);
    if (hearingDates.length > 0) nextHearing = hearingDates[0];
  }

  if (casesLoading || tasksLoading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-medium text-gray-900">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Briefcase size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Active Cases</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {activeCases.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <CheckSquare size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              Tasks Due Soon
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {dueSoonTasks.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Next Hearing</h3>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {nextHearing
              ? format(nextHearing, "MMM d, yyyy")
              : "None Scheduled"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/dashboard/cases/create"
          className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 transition-colors flex items-center gap-4"
        >
          <div className="p-4 bg-gray-50 group-hover:bg-purple-50 text-gray-600 group-hover:text-purple-600 rounded-full transition-colors">
            <Plus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Case
            </h3>
            <p className="text-sm text-gray-500">
              Start a new reunification plan
            </p>
          </div>
        </a>

        <a
          href="/dashboard/chat"
          className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 transition-colors flex items-center gap-4"
        >
          <div className="p-4 bg-gray-50 group-hover:bg-purple-50 text-gray-600 group-hover:text-purple-600 rounded-full transition-colors">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ask AI Assistant
            </h3>
            <p className="text-sm text-gray-500">Get information and support</p>
          </div>
        </a>
      </div>
    </div>
  );
}
