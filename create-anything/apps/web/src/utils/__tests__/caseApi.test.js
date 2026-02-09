import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTask, createEvent, fetchTasks, fetchEvents } from '../caseApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('caseApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createTask', () => {
    const validTaskData = {
      case_id: 'case-123',
      title: 'Complete paperwork',
      description: 'Fill out form A',
      due_date: '2024-12-31',
      priority: 'High',
      status: 'not_started',
    };

    describe('validation', () => {
      it('throws error when taskData is null', async () => {
        await expect(createTask(null)).rejects.toThrow('Task data is required');
      });

      it('throws error when taskData is undefined', async () => {
        await expect(createTask(undefined)).rejects.toThrow('Task data is required');
      });

      it('throws error when case_id is missing', async () => {
        await expect(createTask({ title: 'Test' })).rejects.toThrow('Case ID is required');
      });

      it('throws error when case_id is empty string', async () => {
        await expect(createTask({ case_id: '', title: 'Test' })).rejects.toThrow('Case ID is required');
      });

      it('throws error when title is missing', async () => {
        await expect(createTask({ case_id: 'case-123' })).rejects.toThrow('Task title is required');
      });

      it('throws error when title is empty string', async () => {
        await expect(createTask({ case_id: 'case-123', title: '' })).rejects.toThrow('Task title is required');
      });

      it('throws error when title is only whitespace', async () => {
        await expect(createTask({ case_id: 'case-123', title: '   ' })).rejects.toThrow('Task title is required');
      });
    });

    describe('successful creation', () => {
      it('creates task with all fields', async () => {
        const mockResponse = { id: 1, ...validTaskData };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await createTask(validTaskData);

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: 'case-123',
            title: 'Complete paperwork',
            description: 'Fill out form A',
            due_date: '2024-12-31',
            priority: 'High',
            status: 'not_started',
          }),
        });
      });

      it('creates task with minimal fields and applies defaults', async () => {
        const minimalTask = { case_id: 'case-123', title: 'Test task' };
        const mockResponse = { id: 1, ...minimalTask, priority: 'Medium', status: 'not_started' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        await createTask(minimalTask);

        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: 'case-123',
            title: 'Test task',
            description: null,
            due_date: null,
            priority: 'Medium',
            status: 'not_started',
          }),
        });
      });

      it('trims whitespace from title', async () => {
        const taskWithWhitespace = { case_id: 'case-123', title: '  Test task  ' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        });

        await createTask(taskWithWhitespace);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.title).toBe('Test task');
      });

      it('handles null due_date', async () => {
        const taskWithNullDate = { case_id: 'case-123', title: 'Test', due_date: null };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        });

        await createTask(taskWithNullDate);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.due_date).toBeNull();
      });
    });

    describe('error handling', () => {
      it('throws error on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

        await expect(createTask(validTaskData)).rejects.toThrow('Unauthorized');
      });

      it('throws default error when response has no error message', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({}),
        });

        await expect(createTask(validTaskData)).rejects.toThrow('Failed to create task');
      });

      it('throws default error when response JSON parsing fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.reject(new Error('Invalid JSON')),
        });

        await expect(createTask(validTaskData)).rejects.toThrow('Failed to create task');
      });

      it('propagates network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(createTask(validTaskData)).rejects.toThrow('Network error');
      });
    });
  });

  describe('createEvent', () => {
    const validEventData = {
      case_id: 'case-123',
      event_type: 'Court Hearing',
      event_date: '2024-12-15',
      description: 'Initial hearing',
    };

    describe('validation', () => {
      it('throws error when eventData is null', async () => {
        await expect(createEvent(null)).rejects.toThrow('Event data is required');
      });

      it('throws error when eventData is undefined', async () => {
        await expect(createEvent(undefined)).rejects.toThrow('Event data is required');
      });

      it('throws error when case_id is missing', async () => {
        await expect(createEvent({ event_type: 'Hearing', event_date: '2024-12-15' }))
          .rejects.toThrow('Case ID is required');
      });

      it('throws error when event_type is missing', async () => {
        await expect(createEvent({ case_id: 'case-123', event_date: '2024-12-15' }))
          .rejects.toThrow('Event type is required');
      });

      it('throws error when event_type is empty string', async () => {
        await expect(createEvent({ case_id: 'case-123', event_type: '', event_date: '2024-12-15' }))
          .rejects.toThrow('Event type is required');
      });

      it('throws error when event_type is only whitespace', async () => {
        await expect(createEvent({ case_id: 'case-123', event_type: '   ', event_date: '2024-12-15' }))
          .rejects.toThrow('Event type is required');
      });

      it('throws error when event_date is missing', async () => {
        await expect(createEvent({ case_id: 'case-123', event_type: 'Hearing' }))
          .rejects.toThrow('Event date is required');
      });

      it('throws error when event_date is empty string', async () => {
        await expect(createEvent({ case_id: 'case-123', event_type: 'Hearing', event_date: '' }))
          .rejects.toThrow('Event date is required');
      });
    });

    describe('successful creation', () => {
      it('creates event with all fields', async () => {
        const mockResponse = { id: 1, ...validEventData };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await createEvent(validEventData);

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: 'case-123',
            event_type: 'Court Hearing',
            event_date: '2024-12-15',
            description: 'Initial hearing',
          }),
        });
      });

      it('creates event without description', async () => {
        const eventWithoutDesc = {
          case_id: 'case-123',
          event_type: 'Drug Test',
          event_date: '2024-12-20',
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        });

        await createEvent(eventWithoutDesc);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.description).toBeNull();
      });

      it('trims whitespace from event_type', async () => {
        const eventWithWhitespace = {
          case_id: 'case-123',
          event_type: '  Court Hearing  ',
          event_date: '2024-12-15',
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        });

        await createEvent(eventWithWhitespace);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.event_type).toBe('Court Hearing');
      });
    });

    describe('error handling', () => {
      it('throws error on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Case not found' }),
        });

        await expect(createEvent(validEventData)).rejects.toThrow('Case not found');
      });

      it('throws default error when response has no error message', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({}),
        });

        await expect(createEvent(validEventData)).rejects.toThrow('Failed to create event');
      });

      it('propagates network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

        await expect(createEvent(validEventData)).rejects.toThrow('Connection refused');
      });
    });
  });

  describe('fetchTasks', () => {
    describe('validation', () => {
      it('throws error when caseId is null', async () => {
        await expect(fetchTasks(null)).rejects.toThrow('Case ID is required');
      });

      it('throws error when caseId is undefined', async () => {
        await expect(fetchTasks(undefined)).rejects.toThrow('Case ID is required');
      });

      it('throws error when caseId is empty string', async () => {
        await expect(fetchTasks('')).rejects.toThrow('Case ID is required');
      });
    });

    describe('successful fetch', () => {
      it('fetches tasks for a case', async () => {
        const mockTasks = [
          { id: 1, title: 'Task 1', status: 'not_started' },
          { id: 2, title: 'Task 2', status: 'completed' },
        ];
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        });

        const result = await fetchTasks('case-123');

        expect(result).toEqual(mockTasks);
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks?caseId=case-123');
      });

      it('encodes special characters in caseId', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

        await fetchTasks('case-123&foo=bar');

        expect(mockFetch).toHaveBeenCalledWith('/api/tasks?caseId=case-123%26foo%3Dbar');
      });

      it('returns empty array when no tasks exist', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

        const result = await fetchTasks('case-123');

        expect(result).toEqual([]);
      });
    });

    describe('error handling', () => {
      it('throws error on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
        });

        await expect(fetchTasks('case-123')).rejects.toThrow('Failed to fetch tasks');
      });

      it('propagates network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

        await expect(fetchTasks('case-123')).rejects.toThrow('Network timeout');
      });
    });
  });

  describe('fetchEvents', () => {
    describe('validation', () => {
      it('throws error when caseId is null', async () => {
        await expect(fetchEvents(null)).rejects.toThrow('Case ID is required');
      });

      it('throws error when caseId is undefined', async () => {
        await expect(fetchEvents(undefined)).rejects.toThrow('Case ID is required');
      });

      it('throws error when caseId is empty string', async () => {
        await expect(fetchEvents('')).rejects.toThrow('Case ID is required');
      });
    });

    describe('successful fetch', () => {
      it('fetches events for a case', async () => {
        const mockEvents = [
          { id: 1, event_type: 'Court Hearing', event_date: '2024-12-15' },
          { id: 2, event_type: 'Home Visit', event_date: '2024-12-20' },
        ];
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEvents),
        });

        const result = await fetchEvents('case-123');

        expect(result).toEqual(mockEvents);
        expect(mockFetch).toHaveBeenCalledWith('/api/events?caseId=case-123');
      });

      it('encodes special characters in caseId', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

        await fetchEvents('case/123');

        expect(mockFetch).toHaveBeenCalledWith('/api/events?caseId=case%2F123');
      });

      it('returns empty array when no events exist', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

        const result = await fetchEvents('case-123');

        expect(result).toEqual([]);
      });
    });

    describe('error handling', () => {
      it('throws error on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
        });

        await expect(fetchEvents('case-123')).rejects.toThrow('Failed to fetch events');
      });

      it('propagates network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('DNS lookup failed'));

        await expect(fetchEvents('case-123')).rejects.toThrow('DNS lookup failed');
      });
    });
  });
});
