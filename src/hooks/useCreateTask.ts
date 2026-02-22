"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTask } from "@/lib/api";
import {
  cancelTaskColumns,
  collectTaskQuerySnapshots,
  invalidateTaskColumns,
  restoreTaskQuerySnapshots,
  upsertTaskInInfiniteData,
  updateTaskQueries,
} from "@/lib/cacheTasks";
import { Task } from "@/types/task";

interface CreateTaskContext {
  snapshots: ReturnType<typeof collectTaskQuerySnapshots>;
  column: Task["column"];
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onMutate: async (input): Promise<CreateTaskContext> => {
      await cancelTaskColumns(queryClient, [input.column]);
      const snapshots = collectTaskQuerySnapshots(queryClient, [input.column]);

      const optimisticTask: Task = {
        id: -Date.now(),
        title: input.title,
        description: input.description,
        column: input.column,
        priority: input.priority,
        order: input.order ?? Date.now(),
      };

      updateTaskQueries(queryClient, [input.column], (data, params) =>
        upsertTaskInInfiniteData(data, params, optimisticTask),
      );

      return { snapshots, column: input.column };
    },
    onError: (_error, _input, context) => {
      if (!context) {
        return;
      }

      restoreTaskQuerySnapshots(queryClient, context.snapshots);
    },
    onSuccess: async (_createdTask, input) => {
      await invalidateTaskColumns(queryClient, [input.column]);
    },
  });
}
