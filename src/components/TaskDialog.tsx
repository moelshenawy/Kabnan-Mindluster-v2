"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";

import { TASK_COLUMNS, Task, TaskColumn } from "@/types/task";

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;

const COLUMN_LABELS: Record<TaskColumn, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export interface TaskDialogValues {
  title: string;
  description: string;
  column: TaskColumn;
}

interface TaskDialogProps {
  open: boolean;
  mode: "create" | "edit";
  task?: Task;
  defaultColumn: TaskColumn;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TaskDialogValues) => void;
}

function buildInitialValues(mode: "create" | "edit", task: Task | undefined, defaultColumn: TaskColumn) {
  if (mode === "edit" && task) {
    return {
      title: task.title,
      description: task.description,
      column: task.column,
    };
  }

  return {
    title: "",
    description: "",
    column: defaultColumn,
  };
}

export default function TaskDialog({
  open,
  mode,
  task,
  defaultColumn,
  isSubmitting = false,
  onClose,
  onSubmit,
}: TaskDialogProps) {
  const [values, setValues] = useState<TaskDialogValues>(() =>
    buildInitialValues(mode, task, defaultColumn),
  );
  const [showErrors, setShowErrors] = useState(false);

  const titleError = useMemo(() => {
    if (!showErrors) {
      return "";
    }

    if (!values.title.trim()) {
      return "Title is required.";
    }

    if (values.title.length > TITLE_MAX_LENGTH) {
      return `Title must be ${TITLE_MAX_LENGTH} characters or less.`;
    }

    return "";
  }, [showErrors, values.title]);

  const descriptionError = useMemo(() => {
    if (!showErrors) {
      return "";
    }

    if (values.description.length > DESCRIPTION_MAX_LENGTH) {
      return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less.`;
    }

    return "";
  }, [showErrors, values.description]);

  const handleColumnChange = (event: SelectChangeEvent<TaskColumn>) => {
    setValues((current) => ({ ...current, column: event.target.value as TaskColumn }));
  };

  const handleSubmit = () => {
    setShowErrors(true);
    const title = values.title.trim();
    const description = values.description.trim();

    if (!title || title.length > TITLE_MAX_LENGTH || description.length > DESCRIPTION_MAX_LENGTH) {
      return;
    }

    onSubmit({
      title,
      description,
      column: values.column,
    });
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "create" ? "Add Task" : "Edit Task"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            required
            label="Title"
            value={values.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            error={Boolean(titleError)}
            helperText={titleError || `${values.title.length}/${TITLE_MAX_LENGTH}`}
          />

          <TextField
            multiline
            minRows={3}
            maxRows={6}
            label="Description"
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            error={Boolean(descriptionError)}
            helperText={descriptionError || `${values.description.length}/${DESCRIPTION_MAX_LENGTH}`}
          />

          <FormControl>
            <InputLabel id="task-column-label">Column</InputLabel>
            <Select<TaskColumn>
              labelId="task-column-label"
              label="Column"
              value={values.column}
              onChange={handleColumnChange}
            >
              {TASK_COLUMNS.map((column) => (
                <MenuItem key={column} value={column}>
                  {COLUMN_LABELS[column]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {mode === "create" ? "Create Task" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
