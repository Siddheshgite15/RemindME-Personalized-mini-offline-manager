# RemindMe ⏰

A sleek, robust, and intuitive reminder application built with React Native and Expo. Never miss a beat with customized schedules, push notifications, and audible alarms. 

## Features 🚀

- **Schedule Management**: Create, edit, and organize your daily routines and specific reminders.
- **Custom Notifications**: Uses `expo-notifications` for reliable, local push notifications.
- **Audible Alarms**: Integrated with `expo-av` to play custom alarm sounds (even in the background).
- **Beautiful UI**: Modern dark-themed user interface, complete with day selectors, schedule cards, and smooth state transitions.
- **Offline First**: All your data is stored locally using `@react-native-async-storage/async-storage`, so it works perfectly without an internet connection.
- **Cross-Platform**: Built with Expo Router for seamless navigation across Android and iOS.

## Technology Stack 🛠️

- **Framework**: [React Native](https://reactnative.dev/) (v0.81.5)
- **Toolchain**: [Expo](https://expo.dev/) (SDK ~54.0.0)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Storage**: AsyncStorage
- **Core Libraries**: 
  - `@react-native-community/datetimepicker` for smooth date/time selection.
  - `expo-notifications` and `expo-av` for robust alarm functionality.

## Getting Started 🏁

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your physical device, or an iOS Simulator / Android Emulator

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd RemindMe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on your device**:
   - Open the **Expo Go** app on your phone.
   - Scan the QR code generated in your terminal.
   - Alternatively, press `a` in the terminal to open an Android emulator, or `i` to open an iOS simulator.

## Project Structure 📁

- `/app`: Contains all Expo Router based screens and layouts (e.g., `index.js`).
- `/components`: Reusable UI components like `ScheduleCard`, `DaySelector`, and `EmptyState`.
- `/assets`: Images, custom sounds (`alarm.wav`), and fonts.
- `/constants`: Global configuration, theme colors, and layout constants.
- `/utils`: Helper functions and notification/storage logic.

## Building for Production 📦

This project uses [EAS (Expo Application Services)](https://expo.dev/eas) for building.

**Preview Build (Android APK)**:
```bash
npm run build:android
```

**Production Build (Android App Bundle)**:
```bash
npm run build:android:prod
```

## Permissions 🔒

The app requires the following permissions to function correctly (configured in `app.json`):
- `RECEIVE_BOOT_COMPLETED`
- `VIBRATE`
- `WAKE_LOCK`
- `POST_NOTIFICATIONS`
- `SCHEDULE_EXACT_ALARM`

## License 📄
This project is licensed under the MIT License.
