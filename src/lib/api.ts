import axios from "axios";

import { CreateTaskInput, Task, TaskColumn, TaskPage, UpdateTaskInput } from "@/types/task";

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

export async function fetchTasksPage({
  column,
  searchTerm,
  page,
  limit,
  signal,
}: FetchTasksPageInput): Promise<TaskPage> {
  const term = searchTerm.trim();
  const response = await apiClient.get<Task[]>("/tasks", {
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

  const totalHeader = response.headers["x-total-count"];
  const totalCount = totalHeader ? Number(totalHeader) : undefined;
  const hasHeaderTotal = typeof totalCount === "number" && !Number.isNaN(totalCount);
  const hasMore = hasHeaderTotal ? page * limit < totalCount : response.data.length === limit;

  return {
    items: response.data,
    page,
    limit,
    total: hasHeaderTotal ? totalCount : undefined,
    hasMore,
  };
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await apiClient.post<Task>("/tasks", input);
  return response.data;
}

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  const { id, ...patch } = input;
  const response = await apiClient.patch<Task>(`/tasks/${id}`, patch);
  return response.data;
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
