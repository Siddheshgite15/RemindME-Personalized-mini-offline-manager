# RemindMe — Offline Task Reminder App (Lean Build)

A fully offline, space-efficient React Native Expo app for managing **Daily Schedules**, **Reminders**, and **Timed Tasks** with motivational notifications and alarms.

---

## User Review Required

> [!IMPORTANT]
> **Logo**: Please share the logo image file. I'll proceed with a generated placeholder and swap it once received.

> [!IMPORTANT]
> **Alarm Sound**: I'll bundle a tiny default `.wav` (~15 KB). Share your preferred sound if any.

---

## Space Efficiency Strategy

| Concern | Approach |
|---|---|
| **Bundle size** | Only 3 extra packages beyond Expo defaults. No Reanimated, no custom fonts, no heavy libs |
| **Storage** | AsyncStorage with JSON — single key per category, ~KB of data total |
| **Animations** | Built-in `Animated` API + `LayoutAnimation` (zero extra bytes) |
| **IDs** | `Date.now().toString(36)` — no `uuid` package |
| **Date math** | Native `Date` + small helpers — no `date-fns` (~70 KB saved) |
| **Icons** | `@expo/vector-icons` (already bundled with Expo — 0 extra KB) |
| **Fonts** | System fonts only (0 extra KB) |
| **APK target** | ~15-20 MB (vs ~35+ MB with Reanimated + custom fonts) |

---

## Tech Stack (Minimal)

| Layer | Choice | Size Impact |
|---|---|---|
| Framework | **Expo SDK 52 (Managed)** | Base |
| Navigation | **Expo Router** | Included in Expo |
| Storage | **AsyncStorage** | ~50 KB |
| Notifications | **expo-notifications** | ~200 KB |
| Alarm Sound | **expo-av** | ~150 KB (already in Expo) |
| Icons | **@expo/vector-icons** | 0 KB (bundled) |
| Animations | **React Native Animated** | 0 KB (built-in) |

**Total extra dependencies: 3 packages**

---

## Proposed Changes

### 1. Project Initialization

```bash
# Create minimal Expo project
npx -y create-expo-app@latest ./ --template blank

# Install only essential dependencies (3 packages)
npx expo install expo-notifications expo-av @react-native-async-storage/async-storage

# Install Expo Router (for navigation)
npx expo install expo-router expo-constants expo-linking expo-status-bar
```

No `react-native-reanimated`, no `expo-linear-gradient`, no `date-fns`, no `uuid`, no `expo-haptics`.

---

### 2. Folder Structure (Compact)

```
d:\Clients\RemindMe\
├── app/                        # Expo Router screens
│   ├── _layout.js              # Root layout + onboarding gate
│   ├── index.js                # Redirect logic
│   ├── onboarding.js           # Name entry (first launch only)
│   ├── (tabs)/
│   │   ├── _layout.js          # Tab bar (4 tabs)
│   │   ├── home.js             # Dashboard
│   │   ├── daily.js            # Daily Schedule list
│   │   ├── reminders.js        # Reminders list
│   │   └── timed.js            # Timed Tasks list
│   ├── daily/
│   │   └── form.js             # Add + Edit (shared form, mode via query param)
│   ├── reminder/
│   │   └── form.js             # Add + Edit
│   └── timed/
│       └── form.js             # Add + Edit
├── components/
│   ├── TaskCard.js             # Reusable card (all 3 types)
│   ├── FAB.js                  # Floating action button
│   └── EmptyState.js           # Empty list placeholder
├── constants/
│   ├── theme.js                # Colors + spacing + typography
│   └── motivational.js         # 50+ motivational templates
├── utils/
│   ├── storage.js              # AsyncStorage CRUD
│   ├── notifications.js        # Notification scheduling
│   └── helpers.js              # Date formatting, ID gen, message interpolation
├── assets/
│   ├── sounds/alarm.wav        # Tiny alarm sound (~15 KB)
│   └── images/logo.png         # App logo
├── app.json
├── eas.json
└── package.json
```

**Key space savings**: Shared `form.js` per category (instead of separate add + edit files = 3 files instead of 6). Combined helpers into single `helpers.js`.

---

### 3. Storage Layer

#### [NEW] `utils/storage.js`

All data in **AsyncStorage** as JSON strings:

| Key | Shape |
|---|---|
| `@user` | `{ name: string }` |
| `@daily` | `[{ id, time, taskName, notifId, messageType, customMsg }]` |
| `@reminders` | `[{ id, time, taskName, isActive, notifId, messageType, customMsg }]` |
| `@timed` | `[{ id, startDate, endDate, taskName, notifIds[], messageType, customMsg, done }]` |

Exported functions:
```
getUser / setUser
getItems(key) / saveItem(key, item) / updateItem(key, id, data) / deleteItem(key, id)
```

Generic `getItems`/`saveItem`/`updateItem`/`deleteItem` work for all 3 categories — **one set of CRUD functions**, not three.

---

### 4. Notification & Alarm System

#### [NEW] `utils/notifications.js`

| Category | Trigger | Sound |
|---|---|---|
| Daily Schedule | `{ hour, minute, repeats: true }` | ✅ Alarm sound (via notification channel) |
| Reminders | `{ hour, minute, repeats: true }` | Default notification sound |
| Timed Tasks | `{ date: deadlineDate }` + `{ date: deadline-1day }` + `{ date: deadline-2days }` | Default notification sound |

- `scheduleDaily(item, userName)` — repeating daily notification + alarm sound
- `scheduleReminder(item, userName)` — repeating daily notification  
- `scheduleTimedTask(item, userName)` — 3 one-shot notifications (deadline, -1d, -2d)
- `cancelNotification(notifId)` / `cancelNotifications(notifIds[])`

Alarm channel configured in `app.json` for Android with `alarm.wav` as custom sound.

---

### 5. Motivational Messages

#### [NEW] `constants/motivational.js`

50+ templates with `{name}` and `{task}` placeholders. Examples:

```
🏆 "Champions don't wait, {name}! Time for {task}."
💪 "{name}, {task} won't finish itself. Let's crush it!"
🚀 "Just a few more steps to success! Do {task} now, {name}."
✨ "Don't give up, {name}! Start {task} and watch magic happen."
🌟 "Believe you can, and you're halfway there. Go {task}, {name}!"
🔥 "Your future self will thank you. Start {task}, {name}!"
⭐ "{name}, every expert was once a beginner. Begin {task} now!"
💎 "Discipline is the bridge between goals and accomplishment. Do {task}, {name}!"
```

#### User choice per task:
- **"Motivational"** (default) → random quote picked at notification time
- **"Custom"** → user types their own message, stored on the task

---

### 6. Screens

#### `app/onboarding.js` — First Launch
- Gradient background (CSS-like via `View` layering — no `expo-linear-gradient`)
- Logo + "Welcome to RemindMe" + name input + "Let's Go" button
- Saves name → redirects to home

#### `app/(tabs)/home.js` — Dashboard
- Time-based greeting ("Good morning/afternoon/evening, {name}!")
- Motivational quote of the day
- 3 summary cards with counts + tap to navigate
- Animated entrance (built-in `Animated.timing`)

#### `app/(tabs)/daily.js` — Daily Schedules
- FlatList sorted by time
- `TaskCard` showing time + task name (25 char max)
- Long-press to delete (with confirmation Alert)
- Tap to edit → navigates to `daily/form?id=xxx`
- FAB → `daily/form` (add mode)

#### `app/(tabs)/reminders.js` — Reminders
- Same pattern as daily
- Toggle switch for active/inactive per reminder
- Active reminders show notification icon

#### `app/(tabs)/timed.js` — Timed Tasks
- Cards show: task name, deadline, days remaining
- Color coding: 🟢 >7d, 🟡 3-7d, 🔴 <3d
- Checkbox to mark complete
- Long-press delete, tap edit

#### `app/{category}/form.js` — Shared Add/Edit Form
- If `id` query param present → edit mode (pre-fill fields)
- Time picker (native `DateTimePicker` via platform)
- Task name input (with char counter for daily)
- Message type picker: "Motivational" or "Custom"
- Save button → saves to storage + schedules notification

---

### 7. Theme

#### [NEW] `constants/theme.js`

```js
colors: {
  bg:        '#0B0F1A',     // Deep dark
  surface:   '#151A2D',     // Card bg
  border:    '#1F2541',     // Subtle borders
  primary:   '#7C6AFF',     // Purple accent
  secondary: '#00D4AA',     // Teal accent
  accent:    '#FF6B8A',     // Pink-coral
  success:   '#4ADE80',
  warning:   '#FBBF24',
  danger:    '#EF4444',
  text:      '#F1F5F9',
  muted:     '#64748B',
}
```

**No custom fonts. No gradients library.** Gradient effects achieved via overlapping `View` layers with opacity. Glassmorphism via `rgba()` backgrounds + border.

---

### 8. APK Build

#### [NEW] `eas.json`
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

#### Build commands:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   # → outputs .apk file
```

**Expected APK size: ~15-20 MB** (vs ~35+ MB with typical Expo + Reanimated apps).

---

## Verification Plan

### Dev Testing
```bash
npx expo start    # Test with Expo Go on phone (QR scan)
```

### Notification Testing
- Requires dev build for custom alarm sound: `npx expo run:android`
- Set a reminder 1 min from now → background app → verify notification

### APK Verification
1. `eas build -p android --profile preview`
2. Install APK on device
3. Verify: onboarding → CRUD all 3 types → notifications → alarm → fully offline
4. Check APK size is under 25 MB
