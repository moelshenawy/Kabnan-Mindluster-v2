"use client";

import AddTaskIcon from "@mui/icons-material/AddTask";
import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import TaskCard from "@/components/TaskCard";
import { Task, TaskColumn } from "@/types/task";

interface ColumnProps {
  column: TaskColumn;
  title: string;
  tasks: Task[];
  totalCount: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onAddTask: (column: TaskColumn) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

function toColumnDndId(column: TaskColumn): string {
  return `column-${column}`;
}

export default function Column({
  column,
  title,
  tasks,
  totalCount,
  isLoading,
  isFetchingNextPage,
  hasMore,
  onLoadMore,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: toColumnDndId(column),
    data: {
      type: "column",
      column,
    },
  });

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        p: 2,
        minHeight: "72vh",
        backgroundColor: isOver ? "rgba(15, 118, 110, 0.08)" : "rgba(255, 255, 255, 0.86)",
        border: "1px solid rgba(15, 118, 110, 0.14)",
        transition: "background-color 180ms ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {totalCount}
        </Typography>
      </Stack>

      <Button
        variant="outlined"
        startIcon={<AddTaskIcon />}
        onClick={() => onAddTask(column)}
        sx={{ mb: 2 }}
      >
        Add task
      </Button>

      {isLoading ? (
        <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <SortableContext items={tasks.map((task) => `task-${task.id}`)} strategy={verticalListSortingStrategy}>
          <Box sx={{ flex: 1 }}>
            {tasks.length ? (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onEditTask={onEditTask} onDeleteTask={onDeleteTask} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No tasks found in this column.
              </Typography>
            )}
          </Box>
        </SortableContext>
      )}

      {hasMore ? (
        <Button variant="text" onClick={onLoadMore} disabled={isFetchingNextPage} sx={{ mt: 1 }}>
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </Button>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {tasks.length ? "All tasks loaded" : ""}
        </Typography>
      )}
    </Paper>
  );
}
