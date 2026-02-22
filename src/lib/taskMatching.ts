import { Task } from "@/types/task";

export function normalizeSearchTerm(searchTerm: string): string {
  return searchTerm.trim().toLowerCase();
}

export function matchesTaskSearch(task: Task, searchTerm: string): boolean {
  const normalized = normalizeSearchTerm(searchTerm);
  if (!normalized) {
    return true;
  }

  return (
    task.title.toLowerCase().includes(normalized) ||
    task.description.toLowerCase().includes(normalized)
  );
}
