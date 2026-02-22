import { QueryKey } from "@tanstack/react-query";

import { isTaskColumn, TaskColumn } from "@/types/task";

export interface TaskListQueryParams {
  column: TaskColumn;
  searchTerm: string;
  pageSize: number;
}

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params: TaskListQueryParams) => [...taskKeys.lists(), params] as const,
};

export function readTaskListParams(queryKey: QueryKey): TaskListQueryParams | null {
  if (!Array.isArray(queryKey) || queryKey.length !== 3) {
    return null;
  }

  if (queryKey[0] !== "tasks" || queryKey[1] !== "list") {
    return null;
  }

  const rawParams = queryKey[2];
  if (typeof rawParams !== "object" || rawParams === null) {
    return null;
  }

  const params = rawParams as Partial<TaskListQueryParams>;
  if (
    !isTaskColumn(params.column) ||
    typeof params.searchTerm !== "string" ||
    typeof params.pageSize !== "number"
  ) {
    return null;
  }

  return params as TaskListQueryParams;
}
