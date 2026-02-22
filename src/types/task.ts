export const TASK_COLUMNS = ["backlog", "in_progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "hard"] as const;

export type TaskColumn = (typeof TASK_COLUMNS)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: number;
  title: string;
  description: string;
  column: TaskColumn;
  order: number;
  priority: TaskPriority;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  column: TaskColumn;
  priority: TaskPriority;
  order?: number;
}

export interface UpdateTaskInput {
  id: number;
  title?: string;
  description?: string;
  column?: TaskColumn;
  priority?: TaskPriority;
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

export function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === "string" && TASK_PRIORITIES.includes(value as TaskPriority);
}
