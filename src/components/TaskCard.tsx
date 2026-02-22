"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Card, CardActions, CardContent, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  hard: "Hard",
} as const;

const PRIORITY_CHIP_STYLES = {
  low: {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  medium: {
    backgroundColor: "#fef08a",
    color: "#854d0e",
  },
  hard: {
    backgroundColor: "#fecaca",
    color: "#991b1b",
  },
} as const;

function toTaskDndId(id: number): string {
  return `task-${id}`;
}

export default function TaskCard({ task, onEditTask, onDeleteTask }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: toTaskDndId(task.id),
    data: {
      type: "task",
      taskId: task.id,
      column: task.column,
    },
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1.5,
        borderColor: isDragging ? "secondary.main" : "rgba(15, 118, 110, 0.12)",
        borderWidth: 1,
        borderStyle: "solid",
        cursor: "grab",
        userSelect: "none",
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.35, flex: 1 }} noWrap>
            {task.title}
          </Typography>

          <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", pt: 0.25 }}>
            <DragIndicatorIcon fontSize="small" />
          </Box>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Chip
            size="small"
            label={PRIORITY_LABELS[task.priority]}
            sx={{
              fontWeight: 600,
              ...PRIORITY_CHIP_STYLES[task.priority],
            }}
          />
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "4.2em",
          }}
        >
          {task.description || "No description provided."}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 1.5, pb: 1.5, justifyContent: "space-between" }}>
        <Tooltip title="Edit task">
          <IconButton
            size="small"
            color="primary"
            onPointerDown={stopPropagation}
            onTouchStart={stopPropagation}
            onClick={() => onEditTask(task)}
            aria-label="Edit task"
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete task">
          <IconButton
            size="small"
            color="error"
            onPointerDown={stopPropagation}
            onTouchStart={stopPropagation}
            onClick={() => onDeleteTask(task)}
            aria-label="Delete task"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
