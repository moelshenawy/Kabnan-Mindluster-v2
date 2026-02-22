# Kanban ToDo Dashboard

A Next.js App Router + TypeScript Kanban board with local json-server API, React Query caching/mutations, Material UI layout, and drag-and-drop task movement.

## Prerequisites

- Node.js 22+ (tested with `v22.13.1`)
- npm 10+

## Setup

```bash
npm install
```

## Run API only

```bash
npm run api
```

The mock API is served at `http://localhost:4000/tasks` from `db.json`.

## Run app only

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Run app + API together

```bash
npm run dev:all
```

## Run tests

```bash
npm run test
```

## Feature Mapping

| Requirement | Implemented |
| --- | --- |
| Next.js App Router + TypeScript | `app/` router and strict TypeScript project |
| Material UI layout/components | Top bar, board columns, dialogs, cards, responsive grid |
| React Query architecture | `useInfiniteTasks`, `useCreateTask`, `useUpdateTask`, `useDeleteTask` |
| Local mock API with json-server | `db.json` + `npm run api` at port `4000` |
| CRUD | Add/Edit/Delete task dialogs and mutations |
| Drag and drop | `@dnd-kit` with cross-column move + same-column reorder |
| Optimistic updates | Create/Delete/Update (including drag-drop column/order changes) |
| Search | Global search using `q` parameter (title + description full text) |
| Pagination per column | Per-column `Load more` with React Query infinite query |

## API Details

- Base URL: `http://localhost:4000`
- Endpoint: `GET /tasks`
- Column filter: `?column=backlog`
- Search: `&q=searchTerm`
- Pagination: `&_page=1&_limit=10`
- Sorting: `&_sort=order&_order=asc`

## Optional Deployment (Vercel)

1. Push this repository to GitHub.
2. Import into Vercel and deploy.
3. Keep in mind: this project expects a local json-server API by default.
4. For production, host the API separately and update the API base URL in `src/lib/api.ts`.
