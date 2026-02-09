"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TaskModal from "@/components/TaskModal";

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || text || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function formatDue(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString();
}

export default function TasksPage() {
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalError, setModalError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => fetchJSON("/api/tasks"),
  });

  const tasks = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (statusFilter === "all") return true;
        return String(t.status || "").toLowerCase() === statusFilter;
      })
      .filter((t) => {
        if (!q) return true;
        const hay = `${t.title ?? ""} ${t.description ?? ""} ${t.notes ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [tasks, statusFilter, search]);

  const saveTask = useMutation({
    mutationFn: async (payload) => fetchJSON("/api/tasks", { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      setModalError("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
      // also refresh case detail if it uses case_id keyed tasks
      if (selected?.case_id) qc.invalidateQueries({ queryKey: ["tasks", selected.case_id] });
      setSelected(null);
    },
    onError: (e) => setModalError(e?.message || "Failed to save task"),
  });

  const deleteTask = useMutation({
    mutationFn: async (task) => fetchJSON(`/api/tasks?id=${encodeURIComponent(task.id)}`, { method: "DELETE" }),
    onSuccess: () => {
      setModalError("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
      if (selected?.case_id) qc.invalidateQueries({ queryKey: ["tasks", selected.case_id] });
      setSelected(null);
    },
    onError: (e) => setModalError(e?.message || "Failed to delete task"),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold">Tasks</div>
          <div className="text-sm text-gray-600">Click a task to open and edit it.</div>
        </div>

        <div className="flex gap-2">
          <input
            className="w-full rounded border px-3 py-2 text-sm md:w-64"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded border px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {isLoading ? <div className="text-sm text-gray-600">Loading…</div> : null}
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="grid grid-cols-12 border-b bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
          <div className="col-span-5">Task</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-3">Due</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No tasks found.</div>
        ) : (
          filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              className="grid w-full cursor-pointer grid-cols-12 items-center border-b px-3 py-3 text-left text-sm hover:bg-gray-50"
              onClick={() => {
                setModalError("");
                setSelected(t);
              }}
            >
              <div className="col-span-5 font-medium">{t.title ?? "(untitled)"}</div>
              <div className="col-span-2 capitalize">{String(t.status || "").replaceAll("_", " ")}</div>
              <div className="col-span-2">{t.priority ?? "—"}</div>
              <div className="col-span-3">{formatDue(t.due_date)}</div>
            </button>
          ))
        )}
      </div>

      <TaskModal
        open={!!selected}
        task={selected}
        onClose={() => setSelected(null)}
        onSave={(payload) => saveTask.mutate(payload)}
        onDelete={(task) => deleteTask.mutate(task)}
        saving={saveTask.isPending}
        deleting={deleteTask.isPending}
        error={modalError}
      />
    </div>
  );
}
