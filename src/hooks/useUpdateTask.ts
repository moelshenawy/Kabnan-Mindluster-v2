"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTask } from "@/lib/api";
import {
  cancelTaskColumns,
  collectTaskQuerySnapshots,
  invalidateTaskColumns,
  restoreTaskQuerySnapshots,
  upsertTaskInInfiniteData,
  updateTaskQueries,
} from "@/lib/cacheTasks";
import { TaskOrderPatch } from "@/lib/order";
import { Task, TaskColumn, UpdateTaskInput } from "@/types/task";

export interface UpdateTaskVariables {
  input: UpdateTaskInput;
  previousTask?: Task;
  rebalancePatches?: TaskOrderPatch[];
}

interface UpdateTaskContext {
  snapshots: ReturnType<typeof collectTaskQuerySnapshots>;
  affectedColumns: TaskColumn[];
}

function getAffectedColumns(previousTask: Task | undefined, input: UpdateTaskInput): TaskColumn[] {
  const sourceColumn = previousTask?.column;
  const targetColumn = input.column ?? sourceColumn;

  const columns = [sourceColumn, targetColumn].filter((value): value is TaskColumn => Boolean(value));
  return [...new Set(columns)];
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ input, rebalancePatches }: UpdateTaskVariables) => {
      const updatedTask = await updateTask(input);

      if (rebalancePatches?.length) {
        const extraPatches = rebalancePatches.filter(
          (patch) => patch.id !== updatedTask.id || patch.order !== updatedTask.order,
        );

        if (extraPatches.length) {
          await Promise.all(extraPatches.map((patch) => updateTask({ id: patch.id, order: patch.order })));
        }
      }

      return updatedTask;
    },
    onMutate: async ({ input, previousTask }): Promise<UpdateTaskContext> => {
      const affectedColumns = getAffectedColumns(previousTask, input);
      if (!affectedColumns.length || !previousTask) {
        return { snapshots: [], affectedColumns };
      }

      await cancelTaskColumns(queryClient, affectedColumns);
      const snapshots = collectTaskQuerySnapshots(queryClient, affectedColumns);

      const optimisticTask: Task = {
        ...previousTask,
        ...input,
        column: input.column ?? previousTask.column,
        order: input.order ?? previousTask.order,
      };

      updateTaskQueries(queryClient, affectedColumns, (data, params) =>
        upsertTaskInInfiniteData(data, params, optimisticTask),
      );

      return { snapshots, affectedColumns };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      restoreTaskQuerySnapshots(queryClient, context.snapshots);
    },
    onSuccess: async (_updatedTask, variables, context) => {
      const columns = context?.affectedColumns?.length
        ? context.affectedColumns
        : getAffectedColumns(variables.previousTask, variables.input);

      await invalidateTaskColumns(queryClient, columns);
    },
  });
}
