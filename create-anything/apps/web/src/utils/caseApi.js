/**
 * Case API utilities for tasks and events
 *
 * Provides functions for creating, updating, and fetching tasks and events.
 */

/**
 * Creates a new task for a case
 *
 * @param {Object} taskData - Task data
 * @param {string} taskData.case_id - The case ID
 * @param {string} taskData.title - Task title (required)
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.due_date] - Due date (ISO string or null)
 * @param {string} [taskData.priority] - Priority level (Low, Medium, High)
 * @param {string} [taskData.status] - Task status
 * @returns {Promise<Object>} The created task
 * @throws {Error} If the request fails or validation fails
 */
export async function createTask(taskData) {
  if (!taskData) {
    throw new Error("Task data is required");
  }

  if (!taskData.case_id) {
    throw new Error("Case ID is required");
  }

  if (!taskData.title || (typeof taskData.title === "string" && !taskData.title.trim())) {
    throw new Error("Task title is required");
  }

  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      case_id: taskData.case_id,
      title: taskData.title.trim(),
      description: taskData.description ?? null,
      due_date: taskData.due_date ?? null,
      priority: taskData.priority ?? "Medium",
      status: taskData.status ?? "Not Started",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create task");
  }

  return response.json();
}

/**
 * Creates a new event for a case
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.case_id - The case ID
 * @param {string} eventData.event_type - Event type (required)
 * @param {string} eventData.event_date - Event date (required, ISO string)
 * @param {string} [eventData.description] - Event description
 * @returns {Promise<Object>} The created event
 * @throws {Error} If the request fails or validation fails
 */
export async function createEvent(eventData) {
  if (!eventData) {
    throw new Error("Event data is required");
  }

  if (!eventData.case_id) {
    throw new Error("Case ID is required");
  }

  if (!eventData.event_type || (typeof eventData.event_type === "string" && !eventData.event_type.trim())) {
    throw new Error("Event type is required");
  }

  if (!eventData.event_date) {
    throw new Error("Event date is required");
  }

  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      case_id: eventData.case_id,
      event_type: eventData.event_type.trim(),
      event_date: eventData.event_date,
      description: eventData.description ?? null,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create event");
  }

  return response.json();
}

/**
 * Fetches tasks for a case
 *
 * @param {string} caseId - The case ID
 * @returns {Promise<Array>} Array of tasks
 * @throws {Error} If the request fails
 */
export async function fetchTasks(caseId) {
  if (!caseId) {
    throw new Error("Case ID is required");
  }

  const response = await fetch(`/api/tasks?caseId=${encodeURIComponent(caseId)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

/**
 * Fetches events for a case
 *
 * @param {string} caseId - The case ID
 * @returns {Promise<Array>} Array of events
 * @throws {Error} If the request fails
 */
export async function fetchEvents(caseId) {
  if (!caseId) {
    throw new Error("Case ID is required");
  }

  const response = await fetch(`/api/events?caseId=${encodeURIComponent(caseId)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}

export default {
  createTask,
  createEvent,
  fetchTasks,
  fetchEvents,
};
