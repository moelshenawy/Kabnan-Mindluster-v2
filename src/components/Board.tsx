"use client";

import {
  Alert,
  Box,
  Container,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";

import Column from "@/components/Column";
import ConfirmDialog from "@/components/ConfirmDialog";
import TaskDialog, { TaskDialogValues } from "@/components/TaskDialog";
import TopBar from "@/components/TopBar";
import { useCreateTask } from "@/hooks/useCreateTask";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDeleteTask } from "@/hooks/useDeleteTask";
import { useInfiniteTasks } from "@/hooks/useInfiniteTasks";
import { useUpdateTask } from "@/hooks/useUpdateTask";
import { getApiErrorMessage } from "@/lib/api";
import { flattenTaskPages } from "@/lib/cacheTasks";
import { buildRebalancePatches, computeOrderBetween, getTopInsertOrder } from "@/lib/order";
import { isTaskColumn, TASK_COLUMNS, Task, TaskColumn } from "@/types/task";

const PAGE_SIZE = 10;

const COLUMN_TITLES: Record<TaskColumn, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const TASK_ID_PREFIX = "task-";
const COLUMN_ID_PREFIX = "column-";

type FeedbackState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

type DialogMode = "create" | "edit";

function parseTaskDndId(id: UniqueIdentifier): number | null {
  const value = String(id);
  if (!value.startsWith(TASK_ID_PREFIX)) {
    return null;
  }

  const taskId = Number(value.slice(TASK_ID_PREFIX.length));
  return Number.isNaN(taskId) ? null : taskId;
}

function parseColumnDndId(id: UniqueIdentifier): TaskColumn | null {
  const value = String(id);
  if (!value.startsWith(COLUMN_ID_PREFIX)) {
    return null;
  }

  const column = value.slice(COLUMN_ID_PREFIX.length);
  return isTaskColumn(column) ? column : null;
}

export default function Board() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [dialogTask, setDialogTask] = useState<Task | undefined>(undefined);
  const [dialogColumn, setDialogColumn] = useState<TaskColumn>("backlog");
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({
    open: false,
    message: "",
    severity: "success",
  });

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const backlogQuery = useInfiniteTasks("backlog", debouncedSearchTerm, PAGE_SIZE);
  const inProgressQuery = useInfiniteTasks("in_progress", debouncedSearchTerm, PAGE_SIZE);
  const reviewQuery = useInfiniteTasks("review", debouncedSearchTerm, PAGE_SIZE);
  const doneQuery = useInfiniteTasks("done", debouncedSearchTerm, PAGE_SIZE);

  const queriesByColumn = {
    backlog: backlogQuery,
    in_progress: inProgressQuery,
    review: reviewQuery,
    done: doneQuery,
  } as const;

  const tasksByColumn = useMemo<Record<TaskColumn, Task[]>>(
    () => ({
      backlog: flattenTaskPages(backlogQuery.data),
      in_progress: flattenTaskPages(inProgressQuery.data),
      review: flattenTaskPages(reviewQuery.data),
      done: flattenTaskPages(doneQuery.data),
    }),
    [backlogQuery.data, inProgressQuery.data, reviewQuery.data, doneQuery.data],
  );

  const totalByColumn = useMemo<Record<TaskColumn, number>>(
    () => ({
      backlog: backlogQuery.data?.pages[0]?.total ?? tasksByColumn.backlog.length,
      in_progress: inProgressQuery.data?.pages[0]?.total ?? tasksByColumn.in_progress.length,
      review: reviewQuery.data?.pages[0]?.total ?? tasksByColumn.review.length,
      done: doneQuery.data?.pages[0]?.total ?? tasksByColumn.done.length,
    }),
    [backlogQuery.data, inProgressQuery.data, reviewQuery.data, doneQuery.data, tasksByColumn],
  );

  const taskMap = useMemo(() => {
    const map = new Map<number, Task>();
    for (const column of TASK_COLUMNS) {
      for (const task of tasksByColumn[column]) {
        map.set(task.id, task);
      }
    }
    return map;
  }, [tasksByColumn]);

  const activeTask = activeTaskId !== null ? taskMap.get(activeTaskId) : undefined;

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const loadingMutations = createTaskMutation.isPending || updateTaskMutation.isPending;

  const boardError =
    backlogQuery.error ?? inProgressQuery.error ?? reviewQuery.error ?? doneQuery.error ?? undefined;

  const showFeedback = useCallback((message: string, severity: "success" | "error") => {
    setFeedback({
      open: true,
      message,
      severity,
    });
  }, []);

  const showError = useCallback(
    (error: unknown) => {
      showFeedback(getApiErrorMessage(error), "error");
    },
    [showFeedback],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const openCreateDialog = (column: TaskColumn) => {
    setDialogMode("create");
    setDialogTask(undefined);
    setDialogColumn(column);
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setDialogMode("edit");
    setDialogTask(task);
    setDialogColumn(task.column);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogTask(undefined);
  };

  const handleSubmitDialog = (values: TaskDialogValues) => {
    if (dialogMode === "create") {
      const order = getTopInsertOrder(tasksByColumn[values.column]);
      createTaskMutation.mutate(
        {
          title: values.title,
          description: values.description,
          column: values.column,
          priority: values.priority,
          order,
        },
        {
          onSuccess: () => {
            showFeedback("Task created.", "success");
          },
          onError: (error) => {
            showError(error);
          },
        },
      );
      closeDialog();
      return;
    }

    if (!dialogTask) {
      return;
    }

    updateTaskMutation.mutate(
      {
        input: {
          id: dialogTask.id,
          title: values.title,
          description: values.description,
          column: values.column,
          priority: values.priority,
        },
        previousTask: dialogTask,
      },
      {
        onSuccess: () => {
          showFeedback("Task updated.", "success");
        },
        onError: (error) => {
          showError(error);
        },
      },
    );
    closeDialog();
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) {
      return;
    }

    deleteTaskMutation.mutate(taskToDelete, {
      onSuccess: () => {
        showFeedback("Task deleted.", "success");
      },
      onError: (error) => {
        showError(error);
      },
    });
    setTaskToDelete(undefined);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const taskId = parseTaskDndId(active.id);
    setActiveTaskId(taskId);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeTaskKey = parseTaskDndId(active.id);
    setActiveTaskId(null);

    if (activeTaskKey === null || !over) {
      return;
    }

    const sourceTask = taskMap.get(activeTaskKey);
    if (!sourceTask) {
      return;
    }

    const sourceColumn = sourceTask.column;
    const sourceTasks = tasksByColumn[sourceColumn];
    const sourceIndex = sourceTasks.findIndex((task) => task.id === sourceTask.id);
    if (sourceIndex < 0) {
      return;
    }

    const destinationColumnFromContainer = parseColumnDndId(over.id);
    const destinationTaskId = parseTaskDndId(over.id);

    let destinationColumn: TaskColumn | null = destinationColumnFromContainer;
    let destinationIndex = 0;

    if (destinationColumn) {
      destinationIndex =
        destinationColumn === sourceColumn ? sourceTasks.length - 1 : tasksByColumn[destinationColumn].length;
    } else if (destinationTaskId !== null) {
      const destinationTask = taskMap.get(destinationTaskId);
      if (!destinationTask) {
        return;
      }

      destinationColumn = destinationTask.column;
      destinationIndex = tasksByColumn[destinationColumn].findIndex((task) => task.id === destinationTask.id);
      if (destinationIndex < 0) {
        destinationIndex = tasksByColumn[destinationColumn].length;
      }
    } else {
      return;
    }

    if (!destinationColumn) {
      return;
    }

    if (destinationColumn === sourceColumn) {
      if (destinationTaskId === sourceTask.id || destinationIndex === sourceIndex) {
        return;
      }

      const reordered = arrayMove(sourceTasks, sourceIndex, destinationIndex);
      const movedTask = reordered[destinationIndex];
      const previousTask = reordered[destinationIndex - 1];
      const nextTask = reordered[destinationIndex + 1];

      const updatedOrder = computeOrderBetween(previousTask?.order, nextTask?.order);
      const nextTaskState = {
        ...movedTask,
        order: updatedOrder,
      };

      reordered[destinationIndex] = nextTaskState;
      const rebalancePatches = buildRebalancePatches(reordered);

      updateTaskMutation.mutate(
        {
          input: {
            id: sourceTask.id,
            order: updatedOrder,
          },
          previousTask: sourceTask,
          rebalancePatches,
        },
        {
          onError: (error) => {
            showError(error);
          },
        },
      );

      return;
    }

    const destinationTasks = tasksByColumn[destinationColumn].filter((task) => task.id !== sourceTask.id);
    const boundedIndex = Math.max(0, Math.min(destinationIndex, destinationTasks.length));

    const previousTask = destinationTasks[boundedIndex - 1];
    const nextTask = destinationTasks[boundedIndex];
    const updatedOrder = computeOrderBetween(previousTask?.order, nextTask?.order);

    const movedTask = {
      ...sourceTask,
      column: destinationColumn,
      order: updatedOrder,
    };

    const destinationPreview = [...destinationTasks];
    destinationPreview.splice(boundedIndex, 0, movedTask);
    const rebalancePatches = buildRebalancePatches(destinationPreview);

    updateTaskMutation.mutate(
      {
        input: {
          id: sourceTask.id,
          column: destinationColumn,
          order: updatedOrder,
        },
        previousTask: sourceTask,
        rebalancePatches,
      },
      {
        onError: (error) => {
          showError(error);
        },
      },
    );
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <TopBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />

      <Container maxWidth={false} sx={{ py: 3 }}>
        {boardError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load tasks: {getApiErrorMessage(boardError)}
          </Alert>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <Grid container spacing={2}>
            {TASK_COLUMNS.map((column) => {
              const query = queriesByColumn[column];
              return (
                <Grid key={column} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Column
                    column={column}
                    title={COLUMN_TITLES[column]}
                    tasks={tasksByColumn[column]}
                    totalCount={totalByColumn[column]}
                    isLoading={query.isLoading}
                    hasMore={Boolean(query.hasNextPage)}
                    isFetchingNextPage={query.isFetchingNextPage}
                    onLoadMore={() => {
                      void query.fetchNextPage();
                    }}
                    onAddTask={openCreateDialog}
                    onEditTask={openEditDialog}
                    onDeleteTask={setTaskToDelete}
                  />
                </Grid>
              );
            })}
          </Grid>

          <DragOverlay>
            {activeTask ? (
              <Paper
                sx={{
                  p: 1.5,
                  width: 280,
                  border: "1px solid rgba(15, 118, 110, 0.24)",
                  boxShadow: "0 20px 30px rgba(15, 23, 42, 0.15)",
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {activeTask.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {activeTask.description || "No description provided."}
                  </Typography>
                </Stack>
              </Paper>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Container>

      <TaskDialog
        key={
          dialogMode === "edit"
            ? `edit-${dialogTask?.id ?? "none"}-${dialogTask?.column ?? dialogColumn}`
            : `create-${dialogColumn}`
        }
        open={dialogOpen}
        mode={dialogMode}
        task={dialogTask}
        defaultColumn={dialogColumn}
        isSubmitting={loadingMutations}
        onClose={closeDialog}
        onSubmit={handleSubmitDialog}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task"
        message={`Delete "${taskToDelete?.title ?? "this task"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isSubmitting={deleteTaskMutation.isPending}
        onCancel={() => setTaskToDelete(undefined)}
        onConfirm={confirmDeleteTask}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={3200}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          variant="filled"
          severity={feedback.severity}
          onClose={() => setFeedback((current) => ({ ...current, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
