import { describe, expect, it } from "vitest";

import {
  flattenTaskPages,
  removeTaskFromInfiniteData,
  upsertTaskInInfiniteData,
} from "@/lib/cacheTasks";
import { TaskListQueryParams } from "@/lib/queryKeys";
import { Task } from "@/types/task";

const queryParams: TaskListQueryParams = {
  column: "backlog",
  searchTerm: "",
  pageSize: 10,
};

function createTasks(): Task[] {
  return [
    {
      id: 1,
      title: "Write docs",
      description: "Docs task",
      column: "backlog",
      order: 1000,
    },
    {
      id: 2,
      title: "Build board",
      description: "Board task",
      column: "backlog",
      order: 2000,
    },
  ];
}

function createData(tasks: Task[] = createTasks()) {
  return {
    pageParams: [1],
    pages: [
      {
        items: tasks,
        page: 1,
        limit: 10,
        total: tasks.length,
        hasMore: false,
      },
    ],
  };
}

describe("task cache helpers", () => {
  it("removes task from paged data", () => {
    const initial = createData();
    const updated = removeTaskFromInfiniteData(initial, queryParams, 1);

    expect(flattenTaskPages(updated).map((task) => task.id)).toEqual([2]);
    expect(updated?.pages[0].total).toBe(1);
  });

  it("upserts matching task and keeps sorted order", () => {
    const initial = createData();
    const updated = upsertTaskInInfiniteData(initial, queryParams, {
      id: 3,
      title: "Align API",
      description: "API task",
      column: "backlog",
      order: 1500,
    });

    expect(flattenTaskPages(updated).map((task) => task.id)).toEqual([1, 3, 2]);
    expect(updated?.pages[0].total).toBe(3);
  });

  it("drops task from cache if search no longer matches", () => {
    const initial = createData([
      {
        id: 1,
        title: "Write docs",
        description: "Docs task",
        column: "backlog",
        order: 1000,
      },
    ]);
    const params: TaskListQueryParams = {
      ...queryParams,
      searchTerm: "docs",
    };

    const updated = upsertTaskInInfiniteData(initial, params, {
      id: 1,
      title: "Write code",
      description: "No keyword",
      column: "backlog",
      order: 1000,
    });

    expect(flattenTaskPages(updated).map((task) => task.id)).toEqual([]);
    expect(updated?.pages[0].total).toBe(0);
  });
});
