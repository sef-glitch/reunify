"use client";
import React, { useMemo, useState } from "react";

function formatDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

export default function TaskModal({
  open,
  task,
  onClose,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
  error = "",
}) {
  const initial = useMemo(() => {
    if (!task) return null;
    return {
      title: task.title ?? "",
      description: task.description ?? "",
      due_date: formatDateInput(task.due_date),
      priority: task.priority ?? "Medium",
      status: task.status ?? "not_started",
      notes: task.notes ?? "",
    };
  }, [task]);

  const [form, setForm] = useState(initial);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  if (!open || !task) return null;

  const update = (k, v) => setForm((prev) => ({ ...(prev ?? {}), [k]: v }));

  const handleSave = () => {
    if (!form) return;
    // normalize status casing to your backend expectation
    const status = String(form.status || "").toLowerCase();
    const payload = {
      id: task.id,
      title: form.title?.trim(),
      description: form.description?.trim() || null,
      due_date: form.due_date || null,
      priority: form.priority || "Medium",
      status,
      notes: form.notes ?? "",
      case_id: task.case_id, // keep context if backend requires it
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">Task Details</div>
          <button
            className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            onClick={onClose}
            disabled={saving || deleting}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={form?.title ?? ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded border px-3 py-2 text-sm"
              rows={3}
              value={form?.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional details"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Due date</label>
              <input
                type="date"
                className="w-full rounded border px-3 py-2 text-sm"
                value={form?.due_date ?? ""}
                onChange={(e) => update("due_date", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={form?.priority ?? "Medium"}
                onChange={(e) => update("priority", e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={form?.status ?? "not_started"}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              className="w-full rounded border px-3 py-2 text-sm"
              rows={4}
              value={form?.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Add notes, proof, what happened, etc."
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <button
            className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            onClick={() => onDelete(task)}
            disabled={saving || deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

          <div className="flex gap-2">
            <button
              className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              onClick={onClose}
              disabled={saving || deleting}
            >
              Cancel
            </button>
            <button
              className="rounded bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving || deleting}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
