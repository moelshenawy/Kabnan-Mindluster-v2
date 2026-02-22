"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Card, CardActions, CardContent, IconButton, Tooltip, Typography } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1.5,
        borderColor: isDragging ? "secondary.main" : "rgba(15, 118, 110, 0.12)",
        borderWidth: 1,
        borderStyle: "solid",
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, lineHeight: 1.35 }}>
            {task.title}
          </Typography>

          <Tooltip title="Drag task">
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{ cursor: "grab", "&:active": { cursor: "grabbing" } }}
              aria-label={`Drag ${task.title}`}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
          <IconButton size="small" color="primary" onClick={() => onEditTask(task)} aria-label="Edit task">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete task">
          <IconButton size="small" color="error" onClick={() => onDeleteTask(task)} aria-label="Delete task">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
