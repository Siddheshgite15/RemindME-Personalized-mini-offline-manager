# Native Packages & Linking Analysis Report

## Summary
The RemindMe app uses **4 primary native packages** that require native compilation/linking, plus several indirect dependencies used by Expo and navigation frameworks.

---

## 1. PRIMARY NATIVE PACKAGES

### 1.1 **@react-native-community/datetimepicker** (v8.2.0)
**Status:** ✅ ACTIVELY USED

**Purpose:** Native date/time picker for iOS and Android

**Files Using This:**
- [app/timed/form.js](app/timed/form.js#L7) - DateTimePicker for deadline selection
- [app/daily/form.js](app/daily/form.js#L7) - DateTimePicker for time selection
- [app/reminder/form.js](app/reminder/form.js#L7) - DateTimePicker for time selection

**APIs Called:**
```javascript
<DateTimePicker
  value={date}
  mode="date" | "time"
  minimumDate={new Date()}
  display="spinner" | "default"  // Platform-dependent
  onChange={(event, selectedDate) => {...}}
  themeVariant="dark"
/>
```

**Platform-Specific Behavior:**
- iOS: Uses spinner display
- Android: Uses default (calendar/clock) display

**App.json Plugin Configuration:**
```json
"@react-native-community/datetimepicker"
```

---

### 1.2 **expo-notifications** (v0.32.0)
**Status:** ✅ ACTIVELY USED

**Purpose:** Scheduling and handling local/remote notifications with native sound/vibration

**Files Using This:**
- [utils/notifications.js](utils/notifications.js) - All notification scheduling logic

**Setup & Permissions:**
- [app/_layout.js](app/_layout.js#L9) calls `setupNotifications()`
- Android permissions in app.json:
  - `android.permission.POST_NOTIFICATIONS`
  - `android.permission.RECEIVE_BOOT_COMPLETED`
  - `android.permission.SCHEDULE_EXACT_ALARM`

**APIs Called:**

#### Permission Setup
```javascript
Notifications.requestPermissionsAsync()
```

#### Android-Specific Channels
```javascript
Notifications.setNotificationChannelAsync('default', {
  name: 'Reminders',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  sound: 'default'
})

Notifications.setNotificationChannelAsync('alarm', {
  name: 'Daily Alarms',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 500, 250, 500],
  sound: 'alarm.wav'  // ← Custom sound file
})

Notifications.setNotificationChannelAsync('celebration', {
  name: 'Celebrations',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  sound: 'default'
})
```

#### Notification Handler
```javascript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})
```

#### Schedule Notifications
```javascript
// Daily recurring
Notifications.scheduleNotificationAsync({
  content: {
    title: string,
    body: string,
    sound: 'alarm.wav' | 'default',
    channelId: 'default' | 'alarm' | 'celebration'
  },
  trigger: {
    type: 'daily',
    hour: number,
    minute: number
  }
})

// Weekly recurring
Notifications.scheduleNotificationAsync({
  content: { ... },
  trigger: {
    type: 'weekly',
    weekday: number,  // 1=Sun, 7=Sat (Expo convention)
    hour: number,
    minute: number
  }
})

// One-time date-based
Notifications.scheduleNotificationAsync({
  content: { ... },
  trigger: {
    type: 'date',
    date: new Date()
  }
})
```

#### Cancel Notifications
```javascript
Notifications.cancelScheduledNotificationAsync(notifId)
```

**Notification Types Used:**
1. **Daily Schedules** - weekday recurring with alarm sound
2. **Reminders** - daily recurring with default sound
3. **Timed Tasks** - complex pattern:
   - 2 days before deadline (9 AM)
   - 1 day before deadline (9 AM)
   - Deadline day (9 AM)
   - 4 notifications after deadline (9 AM each day)
4. **Completion Celebrations** - 3 notifications:
   - Immediate (2 seconds from now)
   - 1 hour later
   - Next day at 9 AM

**App.json Plugin Configuration:**
```json
[
  "expo-notifications",
  {
    "sounds": [
      "./assets/sounds/alarm.wav"
    ]
  }
]
```

**Custom Sound File:**
- `./assets/sounds/alarm.wav` - Used for daily schedule alarms

---

### 1.3 **@react-native-async-storage/async-storage** (v2.2.0)
**Status:** ✅ ACTIVELY USED

**Purpose:** Persistent key-value storage (offline database)

**Files Using This:**
- [utils/storage.js](utils/storage.js) - Complete CRUD operations
- [components/SavedMessagesDropdown.js](components/SavedMessagesDropdown.js) - Message history storage

**APIs Called:**
```javascript
// Read
const json = await AsyncStorage.getItem(key)
const data = json ? JSON.parse(json) : null

// Write
await AsyncStorage.setItem(key, JSON.stringify(data))
```

**Data Keys Stored:**
```javascript
{
  '@remindme_user': { name: string },
  '@remindme_daily': [{ id, taskName, time, messageType, customMsg, notifId(s) }],
  '@remindme_daily_schedules': [{ id, days[], taskIds[] }],
  '@remindme_reminders': [{ id, taskName, time, messageType, customMsg, isActive, notifId }],
  '@remindme_timed': [{ id, taskName, startDate, endDate, messageType, customMsg, done, notifIds[] }],
  '@remindme_saved_messages': [string]
}
```

**Storage Size:** ~200 KB typical usage (fully offline)

---

### 1.4 **expo-av** (v15.0.0)
**Status:** ❌ INSTALLED BUT NOT USED

**Purpose:** Audio/video playback (intended for alarm sounds)

**Files Using This:** NONE

**Current Implementation:**
- Listed in [package.json](package.json)
- Mentioned in documentation for potential future audio playback
- Audio is currently handled via `expo-notifications` sound property instead

**Note:** This package can be removed unless you plan to implement custom audio playback beyond notification sounds.

---

## 2. INDIRECT NATIVE DEPENDENCIES

### 2.1 **react-native-screens** (v4.16.0)
**Status:** Indirectly used via expo-router

**Purpose:** Native screen stack implementation for better performance

**Used By:** expo-router navigation framework

**Direct Import:** ❌ Not directly imported in user code

**Note:** Required for native stack navigation optimization

---

### 2.2 **react-native-safe-area-context** (v5.6.0)
**Status:** Indirectly used via expo-router

**Purpose:** Safe area insets for notches/status bars

**Used By:** expo-router and React Native navigation

**Direct Import:** ❌ Not directly imported in user code

**Note:** Ensures UI renders correctly on devices with notches

---

## 3. CORE NATIVE FRAMEWORK

### 3.1 **react-native** (v0.76.5)
**Status:** ✅ ACTIVELY USED EVERYWHERE

**Purpose:** Core React Native framework

**Direct Imports Across App:**
```javascript
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Alert, TextInput,
  FlatList, Animated, ActivityIndicator
} from 'react-native'
```

**Native Driver Usage (Performance Optimization):**
- [app/(tabs)/home.js](app/(tabs)/home.js#L67) - Fade animation
- [app/onboarding.js](app/onboarding.js#L18-L19) - Fade and slide animations
- [app/daily/manage.js](app/daily/manage.js#L41) - Animation

```javascript
Animated.timing(anim, {
  toValue: value,
  duration: ms,
  useNativeDriver: true  // ← Native execution for smooth 60 FPS
}).start()
```

**Platform Detection:**
```javascript
Platform.OS === 'android' | 'ios'
```

Used for:
- Conditional notification channel setup
- DateTimePicker display selection
- Platform-specific permissions

---

## 4. EXPO FRAMEWORK PACKAGES

### 4.1 **expo-router** (v6.0.0)
**Status:** ✅ CORE NAVIGATION

**Purpose:** File-based routing with native navigation

**Files Using This:**
- [app/_layout.js](app/_layout.js) - Root navigation setup
- All route files import navigation hooks

**APIs:**
```javascript
import { Stack, useRouter, useSegments } from 'expo-router'
useRouter().push(), .back(), .replace()
useSegments()  // Get current route segments
```

---

### 4.2 **expo-status-bar** (v2.0.0)
**Status:** ✅ USED

**Files Using This:**
- [app/_layout.js](app/_layout.js#L2) - Status bar styling

**API:**
```javascript
import { StatusBar } from 'expo-status-bar'
<StatusBar style="light" />
```

---

### 4.3 **expo-constants** (v18.0.0)
**Status:** ✅ DEPENDENCY

**Purpose:** Access native constant values

**Direct Import:** Used indirectly by other Expo packages

---

### 4.4 **expo-linking** (v8.0.0)
**Status:** ✅ DEPENDENCY

**Purpose:** Deep linking support

**Direct Import:** Used by expo-router for navigation

---

## 5. OTHER DEPENDENCIES

### 5.1 **@expo/vector-icons** (MaterialCommunityIcons)
**Status:** ✅ USED

**Files Using This:**
- [app/timed/form.js](app/timed/form.js) - Calendar icon
- [app/daily/form.js](app/daily/form.js) - Clock icon  
- [app/daily/manage.js](app/daily/manage.js) - Navigation icons
- All form components for UI icons

**API:**
```javascript
import { MaterialCommunityIcons } from '@expo/vector-icons'
<MaterialCommunityIcons name="calendar" size={20} color={Colors.accent} />
```

---

## 6. ANDROID NATIVE PERMISSIONS

From [app.json](app.json):
```json
"permissions": [
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.VIBRATE",
  "android.permission.WAKE_LOCK",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.SCHEDULE_EXACT_ALARM"
]
```

**Purpose:**
- `POST_NOTIFICATIONS` - Required to show notifications (Android 13+)
- `SCHEDULE_EXACT_ALARM` - Required for precise scheduled notifications
- `RECEIVE_BOOT_COMPLETED` - For boot-time alarm persistence
- `WAKE_LOCK` - Prevent system from sleeping during alarm
- `VIBRATE` - Vibration patterns in notifications

---

## 7. SUMMARY TABLE

| Package | Version | Type | Status | Files | Notes |
|---------|---------|------|--------|-------|-------|
| @react-native-community/datetimepicker | 8.2.0 | Native | ✅ Used | 3 form files | Platform-specific UI |
| expo-notifications | 0.32.0 | Native | ✅ Used | notifications.js | Custom alarm sound |
| @react-native-async-storage/async-storage | 2.2.0 | Native | ✅ Used | storage.js, dropdown | ~200 KB data |
| expo-av | 15.0.0 | Native | ❌ Unused | - | Can be removed |
| react-native-screens | 4.16.0 | Native | ⚠️ Indirect | - | Via expo-router |
| react-native-safe-area-context | 5.6.0 | Native | ⚠️ Indirect | - | Via expo-router |
| react-native | 0.76.5 | Native | ✅ Core | All files | Base framework |
| expo-router | 6.0.0 | Hybrid | ✅ Core | Layout + routes | Navigation |
| expo-status-bar | 2.0.0 | Native | ✅ Used | _layout.js | Status bar styling |

---

## 8. COMPILATION & BUILD IMPLICATIONS

**Native Modules Requiring EAS Build:**
1. `@react-native-community/datetimepicker` - Custom React Native module
2. `expo-notifications` - Platform-specific notification APIs
3. `@react-native-async-storage/async-storage` - Native SQLite backend
4. `react-native-screens` - Native screen stack
5. `react-native-safe-area-context` - Inset management

**Impact:**
- Cannot run on Expo Go (native code requires compilation)
- Requires `eas build` for iOS/Android releases
- Development with Expo CLI works for managed app ecosystem

---

## 9. RECOMMENDATIONS

1. **Remove expo-av** - Currently unused; saves ~150 KB if removed
2. **Verify notification persistence** - Consider testing boot-time alarm reliability
3. **Custom sound testing** - Test `alarm.wav` on both Android and iOS
4. **Storage limits** - Current ~200 KB is safe; monitor if adding many saved messages
5. **Native driver animations** - Already optimized; good for smooth UI

---

Generated: 2026-03-25
