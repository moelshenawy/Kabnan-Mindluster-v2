import { describe, expect, it } from "vitest";

import { buildRebalancePatches, computeOrderBetween, getTopInsertOrder, ORDER_STEP } from "@/lib/order";
import { Task } from "@/types/task";

describe("order helpers", () => {
  it("computes midpoint order when both neighbors exist", () => {
    expect(computeOrderBetween(1000, 3000)).toBe(2000);
  });

  it("computes order from previous when next is missing", () => {
    expect(computeOrderBetween(4000, undefined)).toBe(4000 + ORDER_STEP);
  });

  it("computes order from next when previous is missing", () => {
    expect(computeOrderBetween(undefined, 2000)).toBe(2000 - ORDER_STEP);
  });

  it("computes top insert order before the minimum task order", () => {
    const tasks: Task[] = [
      { id: 1, title: "A", description: "A", column: "backlog", order: 1000, priority: "low" },
      { id: 2, title: "B", description: "B", column: "backlog", order: 3000, priority: "medium" },
    ];

    expect(getTopInsertOrder(tasks)).toBe(0);
  });

  it("returns rebalance patches when neighboring gaps become too small", () => {
    const tasks: Task[] = [
      { id: 1, title: "A", description: "A", column: "backlog", order: 1000, priority: "medium" },
      { id: 2, title: "B", description: "B", column: "backlog", order: 1000.000001, priority: "medium" },
      { id: 3, title: "C", description: "C", column: "backlog", order: 1000.000002, priority: "medium" },
    ];

    const patches = buildRebalancePatches(tasks);

    expect(patches.length).toBeGreaterThan(0);
    expect(patches[0]).toEqual({ id: 2, order: 2000 });
    expect(patches[1]).toEqual({ id: 3, order: 3000 });
  });
});
