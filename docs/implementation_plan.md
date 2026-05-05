# Multi-Schedule Daily Task Feature

The current daily screen shows a flat list of tasks sorted by time. This plan adds **multiple named schedules** (each with a unique color), **day-of-week assignment** (each day gets one schedule), and a two-tab **edit/manage mode** for tasks and schedules. The same task can belong to multiple schedules, but each day maps to exactly one schedule.

## Proposed Changes

### Data Model

#### Two new storage collections (keys in AsyncStorage)

| Key | Shape | Description |
|---|---|---|
| `DAILY_SCHEDULES` | `{ id, name, color, days: [0-6], taskIds: string[] }` | User-created schedules. `days` = weekday indices (0=Sun). `taskIds` = tasks assigned via checkboxes. |
| `DAILY` (existing) | No schema change | Tasks remain independent; assignment is owned by schedules. |

> [!NOTE]
> No separate "day-assignment" table needed — the `days` array lives on each schedule. To find today's schedule: filter schedules where `days` includes today's weekday index.

#### Schedule Color Palette (8 pre-defined)

```
Coral #FF6B6B, Ocean #4ECDC4, Amber #FFD93D, Violet #A78BFA,
Sky #38BDF8, Rose #FB7185, Mint #34D399, Peach #FDBA74
```

---

### Storage Layer

#### [MODIFY] [storage.js](file:///d:/Clients/RemindMe/utils/storage.js)

- Add `DAILY_SCHEDULES: '@remindme_daily_schedules'` to `KEYS`
- Add helper: `getSchedulesForDay(dayIndex)` → filters schedules whose `days` array contains the given weekday
- Add helper: `getTasksForSchedule(scheduleId)` → filters daily tasks whose `scheduleIds` includes the given schedule ID

---

### Constants

#### [MODIFY] [theme.js](file:///d:/Clients/RemindMe/constants/theme.js)

- Add `ScheduleColors` array with the 8 colors above
- Add `DayLabels` array: `['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']`

---

### New Components

#### [NEW] [ScheduleChip.js](file:///d:/Clients/RemindMe/components/ScheduleChip.js)

Small colored pill showing schedule name. Used in task cards & day-row to indicate which schedule is active.

#### [NEW] [DaySelector.js](file:///d:/Clients/RemindMe/components/DaySelector.js)

Row of 7 day circles. Each circle fills with the color of the assigned schedule (or muted if unassigned). Tappable to toggle assignment in schedule-form.

#### [NEW] [ScheduleCard.js](file:///d:/Clients/RemindMe/components/ScheduleCard.js)

Card for the Schedules tab showing schedule name, color stripe, assigned days as small chips. Long press to delete, tap to edit.

---

### Screens

#### [MODIFY] [daily.js](file:///d:/Clients/RemindMe/app/(tabs)/daily.js) — View Mode (Default)

**Today's schedule view:**
1. On mount, determine today's weekday index → find matching schedule via `getSchedulesForDay()`
2. If a schedule exists for today:
   - Header shows schedule name + colored accent bar
   - List tasks belonging to that schedule, sorted by time
3. If no schedule for today:
   - [EmptyState](file:///d:/Clients/RemindMe/components/EmptyState.js#6-15) with message "No schedule set for today" + button "Manage Schedules"
4. Top-right "edit" icon → navigates to `/daily/manage`

#### [NEW] [manage.js](file:///d:/Clients/RemindMe/app/daily/manage.js) — Edit Mode

Two top tabs: **Tasks** | **Schedules**

**Tasks Tab:**
- Lists ALL daily tasks (not filtered by day)
- Each task card shows schedule chips (colored pills for each assigned schedule)
- FAB → `/daily/form` (add new task)
- Tap → `/daily/form?id=xxx` (edit)
- Long press → delete with confirmation

**Schedules Tab:**
- Lists all schedules as colored cards
- Each card: color stripe, name, assigned days shown as small day-circles
- FAB → `/daily/schedule-form` (add new schedule)
- Tap → `/daily/schedule-form?id=xxx` (edit)
- Long press → delete schedule (with warning if tasks are assigned)

#### [MODIFY] [form.js](file:///d:/Clients/RemindMe/app/daily/form.js) — Task Form

- Remains as-is for task name, time, and notification settings
- **Remove** schedule selection from here — tasks are assigned to schedules from the schedule form instead
- Task data no longer needs `scheduleIds`; the schedule owns the relationship

#### [NEW] [schedule-form.js](file:///d:/Clients/RemindMe/app/daily/schedule-form.js) — Schedule Form

Fields:
- Schedule Name (text input, max 20 chars)
- Color picker (8 pre-defined color circles, tap to select)
- Day Assignment (DaySelector component — tap days to toggle)
- **Task Assignment (checkbox list)**: Shows all existing daily tasks with checkboxes. User checks which tasks belong to this schedule. Tasks already in this schedule are pre-checked. Same task can be checked in multiple schedules.
- Save button

> [!IMPORTANT]
> When assigning a day to a schedule, if that day is already assigned to another schedule, show a confirmation: "Monday is currently assigned to 'Morning Routine'. Reassign to this schedule?"

---

### Routing

#### [MODIFY] [_layout.js](file:///d:/Clients/RemindMe/app/_layout.js)

Add new Stack screens:
```js
<Stack.Screen name="daily/manage" options={{ title: 'Manage Daily', presentation: 'modal' }} />
<Stack.Screen name="daily/schedule-form" options={{ title: 'Schedule', presentation: 'modal' }} />
```

---

### Notifications

#### [MODIFY] [notifications.js](file:///d:/Clients/RemindMe/utils/notifications.js)

- Update [scheduleDailyNotification](file:///d:/Clients/RemindMe/utils/notifications.js#41-62) to accept a `weekdays` array parameter
- Use `trigger.weekday` (Expo weekly trigger) so the notification only fires on days when the task's schedule is active
- When saving a task, schedule one notification **per active weekday** (cancel old ones first)

---

### Home Screen

#### [MODIFY] [home.js](file:///d:/Clients/RemindMe/app/(tabs)/home.js)

- Update the Daily Schedules summary card count to show today's task count (not total)
- Subtitle: show today's schedule name if one exists

---

## UI/UX Flow Summary

```mermaid
flowchart TD
    A[Open Daily Tab] --> B{Schedule for today?}
    B -- Yes --> C[Show tasks sorted by time\nwith schedule color header]
    B -- No --> D[Empty State:\n'No schedule for today'\n+ Manage Schedules button]
    C --> E[Tap edit icon ✏️]
    D --> E
    E --> F[Manage Screen\nTwo tabs: Tasks | Schedules]
    F --> G[Tasks Tab\nAll tasks with schedule chips]
    F --> H[Schedules Tab\nAll schedules with day assignments]
    G --> I[FAB → Task Form\nwith schedule picker]
    H --> J[FAB → Schedule Form\nname, color, days]
```

## Verification Plan

### Manual Verification (via Expo Go)
Since this is a React Native / Expo mobile app with no existing test suite, verification will be done manually:

1. **Run the app**: `npx expo start` → open on device/emulator
2. **Create schedules**: Go to Daily tab → Edit mode → Schedules tab → create 2-3 schedules with different colors and day assignments
3. **Verify day conflicts**: Try assigning the same day to two schedules — confirm reassignment dialog appears
4. **Create tasks**: Tasks tab → create tasks and assign to different schedules
5. **Verify today view**: Go back to Daily tab — confirm only tasks for today's schedule appear, with correct color header
6. **Verify empty day**: Change schedule days so today has no schedule — confirm empty state shows
7. **CRUD operations**: Edit and delete both tasks and schedules — confirm all changes persist
8. **Notifications**: Create a task in a schedule assigned to today — verify notification triggers at the set time
