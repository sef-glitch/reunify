import { useState } from "react";
import {
  Check,
  Plus,
  Calendar as CalendarIcon,
  UploadCloud,
  FileText,
  Briefcase,
  Home,
  Users,
  Gavel,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default function WeeklyPlanPage() {
  const queryClient = useQueryClient();

  // 1. Fetch User's Case
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await fetch("/api/cases");
      if (!res.ok) throw new Error("Failed to fetch cases");
      return res.json();
    },
  });

  const currentCase = cases && cases.length > 0 ? cases[0] : null;

  // 2. Fetch Plan Items if case exists
  const { data: planItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["plan-items", currentCase?.id],
    queryFn: async () => {
      const res = await fetch(`/api/plan-items?caseId=${currentCase.id}`);
      if (!res.ok) throw new Error("Failed to fetch plan items");
      return res.json();
    },
    enabled: !!currentCase?.id,
  });

  // 3. Mutation to update status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fetch("/api/plan-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-items", currentCase?.id] });
      toast.success("Task updated");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });

  if (casesLoading || (currentCase && itemsLoading)) {
    return <div className="p-8 text-center text-gray-500">Loading plan...</div>;
  }

  if (!currentCase) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="mb-6 bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <FileText className="text-gray-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif font-medium text-gray-900 mb-2">
          No Active Plan
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          You haven't set up your case plan yet. Complete the intake process to
          generate your weekly action plan.
        </p>
        <a href="/dashboard/intake">
          <button className="bg-[#121212] text-white font-medium px-6 py-3 rounded-xl hover:bg-black transition-colors">
            Start Case Intake
          </button>
        </a>
      </div>
    );
  }

  // Group items by category
  const groupedItems = {
    "Court prep": planItems?.filter((i) => i.category === "Court prep") || [],
    Services: planItems?.filter((i) => i.category === "Services") || [],
    Visits: planItems?.filter((i) => i.category === "Visits") || [],
    Stability: planItems?.filter((i) => i.category === "Stability") || [],
  };

  // Handle items that might have other categories or no category (fallback)
  const otherItems = planItems?.filter(
    (i) =>
      !["Court prep", "Services", "Visits", "Stability"].includes(i.category),
  );
  if (otherItems?.length > 0) {
    groupedItems["Other"] = otherItems;
  }

  const categoryIcons = {
    "Court prep": <Gavel size={18} className="text-blue-500" />,
    Services: <Users size={18} className="text-purple-500" />,
    Visits: <CalendarIcon size={18} className="text-green-500" />,
    Stability: <Home size={18} className="text-orange-500" />,
    Other: <Briefcase size={18} className="text-gray-500" />,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            Weekly Action Plan
          </h1>
          <p className="text-gray-500 mt-1">
            Week of {format(startDate, "MMMM d")} -{" "}
            {format(endDate, "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {planItems?.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 italic">
              No tasks found for this week.
            </p>
          </div>
        )}

        {Object.entries(groupedItems).map(([category, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                  {categoryIcons[category]}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {category}
                </h3>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-auto">
                  {items.length} tasks
                </span>
              </div>
              <div className="space-y-4">
                {items.map((item) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    onToggle={() => {
                      const newStatus =
                        item.status === "completed"
                          ? "not_started"
                          : "completed";
                      updateStatus.mutate({ id: item.id, status: newStatus });
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ item, onToggle }) {
  const completed = item.status === "completed";

  return (
    <div
      className={`
      group bg-white p-5 rounded-2xl border transition-all
      ${completed ? "border-gray-100 opacity-75" : "border-gray-200 shadow-sm hover:border-[#8B70F6]/50"}
    `}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={onToggle}
          className={`
          w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 cursor-pointer
          ${completed ? "bg-green-100 text-green-600" : "border-2 border-gray-300 hover:border-[#8B70F6]"}
        `}
        >
          {completed && <Check size={14} />}
        </button>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4
              className={`font-semibold text-base ${completed ? "text-gray-500 line-through" : "text-gray-900"}`}
            >
              {item.title}
            </h4>
          </div>

          <p className="text-gray-600 text-sm mt-1 leading-relaxed">
            {item.instructions}
          </p>

          {!completed && (
            <div className="mt-4 flex gap-3">
              {item.proof_needed && (
                <a
                  href={`/dashboard/vault?planItemId=${item.id}&caseId=${item.case_id}`}
                >
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-[#8B70F6] hover:border-[#8B70F6] transition-all">
                    <UploadCloud size={14} />
                    Upload Proof
                  </button>
                </a>
              )}

              <button
                onClick={onToggle}
                className="px-3 py-1.5 rounded-lg bg-[#121212] text-xs font-medium text-white hover:bg-black transition-colors"
              >
                Mark Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
