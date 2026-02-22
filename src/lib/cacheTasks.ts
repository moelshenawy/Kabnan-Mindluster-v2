import { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";

import { Task, TaskColumn, TaskPage } from "@/types/task";

import { TaskListQueryParams, readTaskListParams } from "./queryKeys";
import { matchesTaskSearch } from "./taskMatching";

export type InfiniteTaskData = InfiniteData<TaskPage>;

export interface TaskQuerySnapshot {
  queryKey: QueryKey;
  data: InfiniteTaskData | undefined;
}

function toColumnSet(columns: TaskColumn[]): Set<TaskColumn> {
  return new Set(columns);
}

function toUniqueColumns(columns: TaskColumn[]): TaskColumn[] {
  return [...toColumnSet(columns)];
}

function rebuildLoadedPages(
  data: InfiniteTaskData,
  tasks: Task[],
  params: TaskListQueryParams,
  totalOverride?: number,
): InfiniteTaskData {
  if (!data.pages.length) {
    return data;
  }

  const pageSize = params.pageSize;
  const capacity = data.pages.length * pageSize;
  const visibleTasks = tasks.slice(0, capacity);

  const pages = data.pages.map((page, pageIndex) => {
    const start = pageIndex * pageSize;
    const pageItems = visibleTasks.slice(start, start + pageSize);
    const total = totalOverride ?? page.total;
    const hasMore =
      typeof total === "number"
        ? (pageIndex + 1) * pageSize < total
        : pageItems.length === pageSize;

    return {
      ...page,
      page: pageIndex + 1,
      limit: pageSize,
      items: pageItems,
      total,
      hasMore,
    };
  });

  return { ...data, pages };
}

export function flattenTaskPages(data?: InfiniteTaskData): Task[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

export function upsertTaskInInfiniteData(
  data: InfiniteTaskData | undefined,
  params: TaskListQueryParams,
  task: Task,
): InfiniteTaskData | undefined {
  if (!data) {
    return data;
  }

  const currentTasks = flattenTaskPages(data);
  const hadTask = currentTasks.some((item) => item.id === task.id);
  const includeTask =
    task.column === params.column && matchesTaskSearch(task, params.searchTerm);

  const nextTasks = currentTasks.filter((item) => item.id !== task.id);
  if (includeTask) {
    nextTasks.push(task);
  }

  nextTasks.sort((a, b) => a.order - b.order);

  const currentTotal = data.pages[0]?.total;
  let nextTotal = currentTotal;

  if (typeof currentTotal === "number") {
    if (!hadTask && includeTask) {
      nextTotal = currentTotal + 1;
    } else if (hadTask && !includeTask) {
      nextTotal = Math.max(0, currentTotal - 1);
    }
  }

  return rebuildLoadedPages(data, nextTasks, params, nextTotal);
}

export function removeTaskFromInfiniteData(
  data: InfiniteTaskData | undefined,
  params: TaskListQueryParams,
  taskId: number,
): InfiniteTaskData | undefined {
  if (!data) {
    return data;
  }

  const currentTasks = flattenTaskPages(data);
  const hadTask = currentTasks.some((item) => item.id === taskId);
  if (!hadTask) {
    return data;
  }

  const nextTasks = currentTasks.filter((item) => item.id !== taskId);
  const currentTotal = data.pages[0]?.total;
  const nextTotal =
    typeof currentTotal === "number"
      ? Math.max(0, currentTotal - 1)
      : undefined;

  return rebuildLoadedPages(data, nextTasks, params, nextTotal);
}

function isQueryInColumns(
  queryKey: QueryKey,
  columns: Set<TaskColumn>,
): boolean {
  const params = readTaskListParams(queryKey);
  return Boolean(params && columns.has(params.column));
}

export async function cancelTaskColumns(
  queryClient: QueryClient,
  columns: TaskColumn[],
): Promise<void> {
  const uniqueColumns = toUniqueColumns(columns);
  if (!uniqueColumns.length) {
    return;
  }

  const columnSet = toColumnSet(uniqueColumns);
  await queryClient.cancelQueries({
    predicate: (query) => isQueryInColumns(query.queryKey, columnSet),
  });
}

export async function invalidateTaskColumns(
  queryClient: QueryClient,
  columns: TaskColumn[],
): Promise<void> {
  const uniqueColumns = toUniqueColumns(columns);
  if (!uniqueColumns.length) {
    return;
  }

  const columnSet = toColumnSet(uniqueColumns);
  await queryClient.invalidateQueries({
    predicate: (query) => isQueryInColumns(query.queryKey, columnSet),
  });
}

export function collectTaskQuerySnapshots(
  queryClient: QueryClient,
  columns: TaskColumn[],
): TaskQuerySnapshot[] {
  const uniqueColumns = toUniqueColumns(columns);
  if (!uniqueColumns.length) {
    return [];
  }

  const columnSet = toColumnSet(uniqueColumns);
  return queryClient
    .getQueriesData<InfiniteTaskData>({
      predicate: (query) => isQueryInColumns(query.queryKey, columnSet),
    })
    .map(([queryKey, data]) => ({ queryKey, data }));
}

export function restoreTaskQuerySnapshots(
  queryClient: QueryClient,
  snapshots: TaskQuerySnapshot[],
): void {
  for (const snapshot of snapshots) {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data);
  }
}

export function updateTaskQueries(
  queryClient: QueryClient,
  columns: TaskColumn[],
  updater: (
    data: InfiniteTaskData | undefined,
    params: TaskListQueryParams,
  ) => InfiniteTaskData | undefined,
): void {
  const uniqueColumns = toUniqueColumns(columns);
  if (!uniqueColumns.length) {
    return;
  }

  const columnSet = toColumnSet(uniqueColumns);
  const entries = queryClient.getQueriesData<InfiniteTaskData>({
    predicate: (query) => isQueryInColumns(query.queryKey, columnSet),
  });

  for (const [queryKey, data] of entries) {
    const params = readTaskListParams(queryKey);
    if (!params) {
      continue;
    }

    const updated = updater(data, params);
    queryClient.setQueryData(queryKey, updated);
  }
}
