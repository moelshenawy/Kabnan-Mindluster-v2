import { Task } from "@/types/task";

export const ORDER_STEP = 1000;

export interface TaskOrderPatch {
  id: number;
  order: number;
}

export function computeOrderBetween(previousOrder?: number, nextOrder?: number): number {
  if (typeof previousOrder === "number" && typeof nextOrder === "number") {
    return (previousOrder + nextOrder) / 2;
  }

  if (typeof previousOrder === "number") {
    return previousOrder + ORDER_STEP;
  }

  if (typeof nextOrder === "number") {
    return nextOrder - ORDER_STEP;
  }

  return ORDER_STEP;
}

export function getNextOrder(tasks: Task[]): number {
  const orders = tasks.map((task) => task.order).filter((order) => Number.isFinite(order));
  if (!orders.length) {
    return ORDER_STEP;
  }

  return Math.max(...orders) + ORDER_STEP;
}

export function getTopInsertOrder(tasks: Task[]): number {
  const orders = tasks.map((task) => task.order).filter((order) => Number.isFinite(order));
  if (!orders.length) {
    return ORDER_STEP;
  }

  return Math.min(...orders) - ORDER_STEP;
}

export function shouldRebalance(tasks: Task[], minGap = 0.00001): boolean {
  if (tasks.length < 2) {
    return false;
  }

  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].order - sorted[index - 1].order < minGap) {
      return true;
    }
  }

  return false;
}

export function buildRebalancePatches(tasks: Task[], minGap = 0.00001): TaskOrderPatch[] {
  if (!shouldRebalance(tasks, minGap)) {
    return [];
  }

  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  return sorted
    .map((task, index) => ({ id: task.id, order: (index + 1) * ORDER_STEP, previous: task.order }))
    .filter((task) => task.order !== task.previous)
    .map(({ id, order }) => ({ id, order }));
}
