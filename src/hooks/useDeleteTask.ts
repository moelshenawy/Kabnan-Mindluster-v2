"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTask } from "@/lib/api";
import {
  cancelTaskColumns,
  collectTaskQuerySnapshots,
  invalidateTaskColumns,
  removeTaskFromInfiniteData,
  restoreTaskQuerySnapshots,
  updateTaskQueries,
} from "@/lib/cacheTasks";
import { Task } from "@/types/task";

interface DeleteTaskContext {
  snapshots: ReturnType<typeof collectTaskQuerySnapshots>;
  column: Task["column"];
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Task) => {
      await deleteTask(task.id);
      return task;
    },
    onMutate: async (task): Promise<DeleteTaskContext> => {
      await cancelTaskColumns(queryClient, [task.column]);
      const snapshots = collectTaskQuerySnapshots(queryClient, [task.column]);

      updateTaskQueries(queryClient, [task.column], (data, params) =>
        removeTaskFromInfiniteData(data, params, task.id),
      );

      return { snapshots, column: task.column };
    },
    onError: (_error, _task, context) => {
      if (!context) {
        return;
      }

      restoreTaskQuerySnapshots(queryClient, context.snapshots);
    },
    onSuccess: async (task) => {
      await invalidateTaskColumns(queryClient, [task.column]);
    },
  });
}
