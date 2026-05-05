# Multi-Schedule Daily Task Feature — Walkthrough

## Summary

Added multi-schedule support to the Daily tab. Users can now create named, color-coded schedules, assign them to specific days of the week, and add tasks to schedules via checkboxes.

## What Changed

### New Files (5)

| File | Purpose |
|---|---|
| [ScheduleChip.js](file:///d:/Clients/RemindMe/components/ScheduleChip.js) | Colored pill component showing schedule name |
| [DaySelector.js](file:///d:/Clients/RemindMe/components/DaySelector.js) | Row of 7 tappable day circles, color-coded by schedule |
| [ScheduleCard.js](file:///d:/Clients/RemindMe/components/ScheduleCard.js) | Card displaying schedule name, color bar, assigned days, task count |
| [manage.js](file:///d:/Clients/RemindMe/app/daily/manage.js) | Two-tab edit mode screen (Tasks \| Schedules) |
| [schedule-form.js](file:///d:/Clients/RemindMe/app/daily/schedule-form.js) | Form: name, 8-color picker, day selector, checkbox task assignment |

### Modified Files (7)

| File | Changes |
|---|---|
| [storage.js](file:///d:/Clients/RemindMe/utils/storage.js) | Added `DAILY_SCHEDULES` key, [getSchedulesForDay()](file:///d:/Clients/RemindMe/utils/storage.js#59-64), [getTasksForSchedule()](file:///d:/Clients/RemindMe/utils/storage.js#65-72) |
| [theme.js](file:///d:/Clients/RemindMe/constants/theme.js) | Added `ScheduleColors` (8 colors) and `DayLabels` arrays |
| [daily.js](file:///d:/Clients/RemindMe/app/(tabs)/daily.js) | Rewrote to show today's schedule with color accent + week strip |
| [form.js](file:///d:/Clients/RemindMe/app/daily/form.js) | Weekday-aware notifications, button text fix |
| [_layout.js](file:///d:/Clients/RemindMe/app/_layout.js) | Registered `daily/manage` and `daily/schedule-form` routes |
| [home.js](file:///d:/Clients/RemindMe/app/(tabs)/home.js) | Shows today's schedule name + task count in summary card |
| [notifications.js](file:///d:/Clients/RemindMe/utils/notifications.js) | [scheduleDailyNotification](file:///d:/Clients/RemindMe/utils/notifications.js#41-85) accepts optional `weekdays` for weekly triggers |

## Data Model

```
Schedule: { id, name, color, days: [0-6], taskIds: string[] }
Task:     { id, taskName, time, messageType, customMsg, notifId/notifIds }
```

Schedules own the task relationship via `taskIds`. Each day maps to at most one schedule.

## UI Flow

1. **Daily Tab** → shows today's schedule (tasks sorted by time) or empty state
2. **Edit icon (✏️)** → opens Manage screen with two tabs
3. **Tasks tab** → lists all tasks with schedule chips; FAB to add new task
4. **Schedules tab** → lists schedules as colored cards; FAB to create schedule
5. **Schedule Form** → set name, pick color, assign days, check tasks via checkboxes

## How to Test

```bash
npx expo start
```

1. Go to **Daily** tab → see empty state → tap **Manage Schedules**
2. Switch to **Schedules** tab → tap **+** → create a schedule (pick color, days, save)
3. Switch to **Tasks** tab → tap **+** → create tasks
4. Go back to **Schedules** → edit schedule → check tasks via checkboxes → save
5. Go to **Daily** tab → verify today's tasks appear with correct schedule color
