import axios from "axios";

import {
  CreateTaskInput,
  isTaskColumn,
  isTaskPriority,
  Task,
  TaskColumn,
  TaskPage,
  UpdateTaskInput,
} from "@/types/task";

export const apiClient = axios.create({
  baseURL: "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

interface FetchTasksPageInput {
  column: TaskColumn;
  searchTerm: string;
  page: number;
  limit: number;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeTask(value: unknown): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = parseNumber(value.id);
  const order = parseNumber(value.order);
  if (id === null || order === null) {
    return null;
  }

  if (!isTaskColumn(value.column)) {
    return null;
  }

  if (typeof value.title !== "string" || typeof value.description !== "string") {
    return null;
  }

  const priority = isTaskPriority(value.priority) ? value.priority : "medium";

  return {
    id,
    title: value.title,
    description: value.description,
    column: value.column,
    order,
    priority,
  };
}

function getResponseItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function getResponseTotal(payload: unknown, headerValue: unknown): number | undefined {
  const headerTotal = parseNumber(headerValue);
  if (headerTotal !== null) {
    return headerTotal;
  }

  if (isRecord(payload)) {
    const itemTotal = parseNumber(payload.items);
    if (itemTotal !== null) {
      return itemTotal;
    }
  }

  return undefined;
}

export async function fetchTasksPage({
  column,
  searchTerm,
  page,
  limit,
  signal,
}: FetchTasksPageInput): Promise<TaskPage> {
  const term = searchTerm.trim();
  const response = await apiClient.get<unknown>("/tasks", {
    params: {
      column,
      _sort: "order",
      _order: "asc",
      _page: page,
      _limit: limit,
      ...(term ? { q: term } : {}),
    },
    signal,
  });

  const items = getResponseItems(response.data).map(normalizeTask).filter((task): task is Task => Boolean(task));
  const total = getResponseTotal(response.data, response.headers["x-total-count"]);
  const hasMore = typeof total === "number" ? page * limit < total : items.length === limit;

  return {
    items,
    page,
    limit,
    total,
    hasMore,
  };
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await apiClient.post<unknown>("/tasks", input);
  const task = normalizeTask(response.data);
  if (!task) {
    throw new Error("API returned invalid task payload.");
  }

  return task;
}

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  const { id, ...patch } = input;
  const response = await apiClient.patch<unknown>(`/tasks/${id}`, patch);
  const task = normalizeTask(response.data);
  if (!task) {
    throw new Error("API returned invalid task payload.");
  }

  return task;
}

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
