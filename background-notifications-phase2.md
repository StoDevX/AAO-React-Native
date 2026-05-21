# Background Notifications — Phase 2 Implementation Plan

## Branch

`copilot/add-background-tasks-notifications`

## What Has Already Been Done (Phase 1 — committed)

| Commit | What it adds |
|--------|-------------|
| task 5 | `source/lib/background-task.ts` — `TaskManager.defineTask`, `registerBackgroundTaskAsync`, `unregisterBackgroundTaskAsync` |
| task 4 | `source/lib/notification-preferences.ts` — Zustand `persist` store with `enabled`, `features`, `setEnabled`, `setFeatureEnabled`, `enabledFeatures` |
| (earlier) | `source/lib/notifications.ts` — `hasNotificationPermission`, `requestNotificationPermission`, `scheduleLocalNotification`, `hashContent`, `hasContentChanged`, `getStoredHash`, `setStoredHash` |
| task 6 | `source/views/settings/screens/notifications.tsx` — Settings screen with master toggle + per-feature toggles (menus, calendar, news) |
| task 6 | `source/views/settings/screens/overview/notifications-section.tsx` — Row in Settings root that navigates to the above screen |
| task 6 | Navigation wiring: `Notifications` route added to `SettingsStackParamList` and registered in `source/navigation/routes.tsx`; exports added to `source/views/settings/index.ts` |

### Key architecture decisions already in place

- The background task definition in `background-task.ts` deliberately has a **stub** comment:
  > "Per-feature notification delivery logic will be wired here in a future task."
- The three feature IDs used in the settings screen (`menus`, `calendar`, `news`) must match the string keys used in the per-feature fetch helpers below.
- `hasContentChanged(featureId, freshData)` + `setStoredHash(featureId, hash)` from `notifications.ts` are the exact API to use for change-detection; call `setStoredHash` only after a notification is successfully delivered.

---

## Phase 2 — Per-Feature Background Fetch Logic

The remaining work is entirely inside `source/lib/background-task.ts`.  
The `TaskManager.defineTask` callback must:

1. Check `enabled` and `enabledFeatures()` (already done in the stub).
2. For each enabled feature, **fetch fresh data**, **diff against stored hash**, and **deliver a notification** if content changed.
3. Return `BackgroundFetchResult.NewData` if ≥ 1 notification was sent, `NoData` if nothing changed, `Failed` on unrecoverable error.

---

## Task 7 — Menus background fetch handler

### What to implement

Add a helper function `checkMenusNotification()` to `background-task.ts` (or a co-located helper file) that:

1. Fetches today's menu for the CCC (identifier `ccc`) using `@frogpond/api`'s `client`:
   ```ts
   // Equivalent raw fetch — do NOT import React Query here (no QueryClient in background)
   const response = await client.get('food/named/menu/ccc').json()
   ```
2. Calls `hasContentChanged('menus', response)`.
3. If changed:
   - Calls `scheduleLocalNotification({ title: "Today's Menu Updated", body: "Check out what's for lunch at the CCC.", identifier: 'menus' })`.
   - Calls `setStoredHash('menus', newHash)`.
4. Returns `true` if a notification was delivered, `false` otherwise.

### Wire it in

In the `TaskManager.defineTask` callback, replace the stub comment with:

```ts
const results = await Promise.allSettled(
  features.map((featureId) => dispatchFeature(featureId))
)
const hadNewData = results.some(
  (r) => r.status === 'fulfilled' && r.value === true
)
return hadNewData
  ? BackgroundFetch.BackgroundFetchResult.NewData
  : BackgroundFetch.BackgroundFetchResult.NoData
```

Where `dispatchFeature` is a switch/map over the feature ID string to the appropriate handler.

### Notes

- Do **not** import React Query or any hooks. The background task runs outside the React tree. Use `client` from `@frogpond/api` directly with vanilla `await`.
- The `client` instance is a `ky` instance. It is initialised via `setApiRoot` at app startup so it is available at task execution time.
- Keep the raw fetch path consistent with what the UI already uses (same path = same cache invalidation semantics, even though the background task bypasses React Query).

---

## Task 8 — Calendar background fetch handler

### What to implement

Add `checkCalendarNotification()`:

1. Fetches the St. Olaf calendar:
   ```ts
   const response = await client.get('calendar/named/stolaf').json()
   ```
   (The path mirrors `namedCalendarOptions('stolaf')` in `modules/ccc-calendar/query.ts`.)
2. Calls `hasContentChanged('calendar', response)`.
3. If changed:
   - `scheduleLocalNotification({ title: 'Calendar Updated', body: 'New events have been added to the St. Olaf calendar.', identifier: 'calendar' })`.
   - `setStoredHash('calendar', newHash)`.
4. Returns `true` / `false`.

---

## Task 9 — News background fetch handler

### What to implement

Add `checkNewsNotification()`:

1. Fetches the default St. Olaf news source:
   ```ts
   const response = await client.get('news/named/stolaf').json()
   ```
   (The path mirrors `namedNewsOptions('stolaf')` in `source/views/news/query.ts`.)
2. Calls `hasContentChanged('news', response)`.
3. If changed:
   - `scheduleLocalNotification({ title: 'News Updated', body: 'New stories have been posted on the St. Olaf news feed.', identifier: 'news' })`.
   - `setStoredHash('news', newHash)`.
4. Returns `true` / `false`.

---

## Task 10 — Unit tests for the background fetch handlers

### What to test

Create `source/lib/__tests__/background-task.test.ts` (following existing patterns — see `source/lib/__tests__/`).

Cover:

- `checkMenusNotification` / `checkCalendarNotification` / `checkNewsNotification`:
  - When `hasContentChanged` returns `{ changed: true, newHash }` → `scheduleLocalNotification` is called, `setStoredHash` is called, returns `true`.
  - When `hasContentChanged` returns `{ changed: false, … }` → neither notification nor hash-write called, returns `false`.
- The task callback (`TaskManager.defineTask` handler):
  - Returns `NoData` when `enabled === false`.
  - Returns `NoData` when `enabledFeatures()` is empty.
  - Returns `NewData` when at least one feature handler returns `true`.
  - Returns `NoData` when all feature handlers return `false`.
  - Returns `Failed` when a handler throws.

### Mocking strategy

Mock the three modules that have I/O side effects:
```ts
jest.mock('@frogpond/api', () => ({ client: { get: jest.fn() } }))
jest.mock('../notifications', () => ({
  hasContentChanged: jest.fn(),
  scheduleLocalNotification: jest.fn(),
  setStoredHash: jest.fn(),
}))
jest.mock('../notification-preferences', () => ({
  useNotificationPreferences: { getState: jest.fn() },
}))
```

---

## Task 11 — Register background task at app startup

### What to do

In `source/root.ts` (or wherever `AppRegistry.registerComponent` is called), import `background-task.ts` so the `TaskManager.defineTask` call runs before any component mounts:

```ts
import './lib/background-task'
```

Also call `registerBackgroundTaskAsync()` inside the root component's initial `useEffect` (or in the app's bootstrap sequence) **when the user already has notifications enabled** (read from the Zustand store):

```ts
import {useNotificationPreferences} from './lib/notification-preferences'
import {registerBackgroundTaskAsync} from './lib/background-task'

// inside root component or app initializer:
React.useEffect(() => {
  if (useNotificationPreferences.getState().enabled) {
    registerBackgroundTaskAsync()
  }
}, [])
```

This ensures re-registration survives app restarts without prompting the user again.

---

## How to validate after each task

```bash
# From the repo root:
mise run agent:pre-commit
# Runs: prettier, eslint, tsc, jest
# All must pass before committing.
```

Commit message convention already used on this branch:
```
feat: <short description> (task N)
```

---

## File map

| File | Role |
|------|------|
| `source/lib/notifications.ts` | Notification utilities (scheduling, hashing, storage) — **do not modify** |
| `source/lib/notification-preferences.ts` | Zustand store — **do not modify** |
| `source/lib/background-task.ts` | **Primary work surface for tasks 7–9 and 11** |
| `source/lib/__tests__/background-task.test.ts` | **New file — task 10** |
| `source/root.ts` | App entry — **small addition for task 11** |
| `source/views/settings/screens/notifications.tsx` | Settings UI — **do not modify** |
