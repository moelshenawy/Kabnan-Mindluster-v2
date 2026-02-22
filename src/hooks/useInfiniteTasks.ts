"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchTasksPage } from "@/lib/api";
import { taskKeys } from "@/lib/queryKeys";
import { TaskColumn } from "@/types/task";

export function useInfiniteTasks(column: TaskColumn, searchTerm: string, pageSize: number) {
  return useInfiniteQuery({
    queryKey: taskKeys.list({ column, searchTerm, pageSize }),
    queryFn: ({ pageParam, signal }) =>
      fetchTasksPage({
        column,
        searchTerm,
        page: Number(pageParam),
        limit: pageSize,
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length + 1 : undefined),
  });
}
