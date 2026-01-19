"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckSquare, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { createTask, createEvent } from "@/utils/caseApi";

export default function CaseDetailPage({ params }) {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const { data: caseDetail, isLoading: caseLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) throw new Error("Failed to fetch case");
      return res.json();
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?caseId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const res = await fetch(`/api/events?caseId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  // Task mutation
  const taskMutation = useMutation({
    mutationFn: (taskData) => createTask({ ...taskData, case_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setIsTaskModalOpen(false);
    },
  });

  // Event mutation
  const eventMutation = useMutation({
    mutationFn: (eventData) => createEvent({ ...eventData, case_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      setIsEventModalOpen(false);
    },
  });

  if (caseLoading)
    return <div className="p-8 text-center text-gray-500">Loading case...</div>;
  if (!caseDetail || caseDetail.error)
    return <div className="p-8 text-center text-gray-500">Case not found</div>;

  return (
    <div>
      <div className="mb-6">
        <a
          href="/dashboard/cases"
          className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Cases
        </a>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif font-medium text-gray-900">
              {caseDetail.title}
            </h1>
            <p className="text-gray-500 mt-1">
              {caseDetail.case_type} • {caseDetail.state}{" "}
              {caseDetail.county ? `• ${caseDetail.county} County` : ""}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              caseDetail.status === "Active"
                ? "bg-green-100 text-green-800"
                : caseDetail.status === "Paused"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {caseDetail.status}
          </span>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {["overview", "tasks", "events", "notes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm capitalize
                ${
                  activeTab === tab
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <OverviewTab caseDetail={caseDetail} tasks={tasks} events={events} />
      )}
      {activeTab === "tasks" && (
        <TasksTab
          caseId={id}
          tasks={tasks}
          onAddTask={() => setIsTaskModalOpen(true)}
        />
      )}
      {activeTab === "events" && (
        <EventsTab
          caseId={id}
          events={events}
          onAddEvent={() => setIsEventModalOpen(true)}
        />
      )}
      {activeTab === "notes" && <NotesTab caseDetail={caseDetail} />}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <AddTaskModal
          onClose={() => setIsTaskModalOpen(false)}
          onSubmit={(data) => taskMutation.mutate(data)}
          isLoading={taskMutation.isPending}
          error={taskMutation.error?.message}
        />
      )}

      {/* Add Event Modal */}
      {isEventModalOpen && (
        <AddEventModal
          onClose={() => setIsEventModalOpen(false)}
          onSubmit={(data) => eventMutation.mutate(data)}
          isLoading={eventMutation.isPending}
          error={eventMutation.error?.message}
        />
      )}
    </div>
  );
}

function OverviewTab({ caseDetail, tasks }) {
  const completedTasks =
    tasks?.filter((t) => t.status === "completed").length || 0;
  const totalTasks = tasks?.length || 0;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const nextHearing = caseDetail.next_hearing_date
    ? new Date(caseDetail.next_hearing_date)
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Progress</h3>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold text-gray-900">{progress}%</span>
          <span className="text-gray-500 mb-1">tasks completed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Next Hearing</h3>
        <p className="text-2xl font-bold text-gray-900">
          {nextHearing ? format(nextHearing, "MMMM d, yyyy") : "Not Scheduled"}
        </p>
        {nextHearing && (
          <p className="text-gray-500 mt-1">
            {Math.ceil((nextHearing - new Date()) / (1000 * 60 * 60 * 24))} days
            away
          </p>
        )}
      </div>
    </div>
  );
}

function TasksTab({ tasks, onAddTask }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
        <button
          onClick={onAddTask}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700 font-medium transition-colors"
        >
          + Add Task
        </button>
      </div>
      <div className="space-y-3">
        {tasks?.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl"
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${task.status === "completed" ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
            >
              {task.status === "completed" && <CheckSquare size={12} />}
            </div>
            <div className="flex-1">
              <h4
                className={`font-medium ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}
              >
                {task.title}
              </h4>
              {task.due_date && (
                <p className="text-xs text-gray-500">
                  Due {format(new Date(task.due_date), "MMM d")}
                </p>
              )}
            </div>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600">
              {task.priority}
            </span>
          </div>
        ))}
        {tasks?.length === 0 && (
          <p className="text-gray-500 text-center py-8">No tasks yet.</p>
        )}
      </div>
    </div>
  );
}

function EventsTab({ events, onAddEvent }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Events</h3>
        <button
          onClick={onAddEvent}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700 font-medium transition-colors"
        >
          + Add Event
        </button>
      </div>
      <div className="space-y-3">
        {events?.map((event) => (
          <div
            key={event.id}
            className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl"
          >
            <div className="text-center w-12">
              <div className="text-xs text-gray-500 uppercase">
                {format(new Date(event.event_date), "MMM")}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {format(new Date(event.event_date), "d")}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{event.event_type}</h4>
              <p className="text-sm text-gray-500">{event.description}</p>
            </div>
          </div>
        ))}
        {events?.length === 0 && (
          <p className="text-gray-500 text-center py-8">No events scheduled.</p>
        )}
      </div>
    </div>
  );
}

function NotesTab({ caseDetail }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Case Notes</h3>
      <p className="whitespace-pre-wrap text-gray-700">
        {caseDetail.notes || "No notes added."}
      </p>
    </div>
  );
}

function AddTaskModal({ onClose, onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "Medium",
    status: "Not Started",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit({
      ...formData,
      due_date: formData.due_date || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Add New Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter task title"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add details about this task"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddEventModal({ onClose, onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    event_type: "",
    event_date: "",
    description: "",
  });

  const eventTypes = [
    "Court Hearing",
    "Home Visit",
    "Drug Test",
    "Case Review",
    "Mediation",
    "Attorney Meeting",
    "Social Worker Visit",
    "Parenting Class",
    "Therapy Session",
    "Other",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.event_type || !formData.event_date) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Add New Event</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type *
            </label>
            <select
              value={formData.event_type}
              onChange={(e) =>
                setFormData({ ...formData, event_type: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none bg-white"
              required
            >
              <option value="">Select event type</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Date *
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add details about this event (location, notes, etc.)"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.event_type || !formData.event_date}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
