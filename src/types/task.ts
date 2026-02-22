export const TASK_COLUMNS = ["backlog", "in_progress", "review", "done"] as const;

export type TaskColumn = (typeof TASK_COLUMNS)[number];

export interface Task {
  id: number;
  title: string;
  description: string;
  column: TaskColumn;
  order: number;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  column: TaskColumn;
  order?: number;
}

export interface UpdateTaskInput {
  id: number;
  title?: string;
  description?: string;
  column?: TaskColumn;
  order?: number;
}

export interface TaskPage {
  items: Task[];
  page: number;
  limit: number;
  total?: number;
  hasMore: boolean;
}

export function isTaskColumn(value: unknown): value is TaskColumn {
  return typeof value === "string" && TASK_COLUMNS.includes(value as TaskColumn);
}
