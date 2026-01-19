"use client";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function TasksPage() {
  const [filter, setFilter] = useState("all");
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const filteredTasks =
    tasks && Array.isArray(tasks)
      ? tasks.filter((task) => {
          if (filter === "all") return true;
          if (filter === "active") return task.status !== "completed";
          if (filter === "due_soon") {
            if (!task.due_date || task.status === "completed") return false;
            const due = new Date(task.due_date);
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);
            return due >= now && due <= nextWeek;
          }
          return true;
        })
      : [];

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500">Loading tasks...</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          All Tasks
        </h1>
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          {["all", "active", "due_soon"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${filter === f ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks?.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl"
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${task.status === "completed" ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
            >
              {task.status === "completed" && <CheckSquare size={12} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  {task.case_title}
                </span>
                {task.priority === "High" && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    High Priority
                  </span>
                )}
              </div>
              <h4
                className={`font-medium ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}
              >
                {task.title}
              </h4>
              {task.due_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Due {format(new Date(task.due_date), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>
        ))}
        {filteredTasks?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CheckSquare size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
