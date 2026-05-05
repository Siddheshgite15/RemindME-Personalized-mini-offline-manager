import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    getNotificationBody,
    getDeadlineMessage,
    getCompletionMessage,
    getMissedDeadlineMessage,
    addDays,
    setTimeOnDate,
} from './helpers';

// ─── Setup ───
export async function setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
    }

    // Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('alarm', {
            name: 'Daily Alarms',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500],
            sound: 'alarm.wav',
        });

        await Notifications.setNotificationChannelAsync('celebration', {
            name: 'Celebrations',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
        });
    }

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });

    return true;
}

// ─── Daily Schedule (Notification + Alarm Sound) ───
export async function scheduleDailyNotification(item, userName, weekdays = null) {
    const time = new Date(item.time);
    const body = getNotificationBody(item, userName);

    const content = {
        title: `📋 ${item.taskName}`,
        body,
        sound: 'alarm.wav',
        ...(Platform.OS === 'android' && { channelId: 'alarm' }),
    };

    // If weekdays provided, schedule one notification per weekday
    if (weekdays && weekdays.length > 0) {
        const notifIds = [];
        for (const weekday of weekdays) {
            // Expo weekday: 1=Sun, 2=Mon, ..., 7=Sat
            const expoWeekday = weekday + 1;
            const notifId = await Notifications.scheduleNotificationAsync({
                content,
                trigger: {
                    type: 'weekly',
                    weekday: expoWeekday,
                    hour: time.getHours(),
                    minute: time.getMinutes(),
                },
            });
            notifIds.push(notifId);
        }
        return notifIds; // Returns array
    }

    // Fallback: daily trigger (every day)
    const notifId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
            type: 'daily',
            hour: time.getHours(),
            minute: time.getMinutes(),
        },
    });

    return notifId;
}

// ─── Reminder (Notification only, repeats daily) ───
export async function scheduleReminderNotification(item, userName) {
    const time = new Date(item.time);
    const body = getNotificationBody(item, userName);

    const notifId = await Notifications.scheduleNotificationAsync({
        content: {
            title: `🔔 ${item.taskName}`,
            body,
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'default' }),
        },
        trigger: {
            type: 'daily',
            hour: time.getHours(),
            minute: time.getMinutes(),
        },
    });

    return notifId;
}

// ─── Interval Reminders (Repeats at regular intervals within a time window) ───
export async function scheduleIntervalReminderNotifications(item, userName) {
    const notifIds = [];
    const fromTime = new Date(item.fromTime);
    const toTime = new Date(item.toTime);
    const intervalMinutes = item.intervalMinutes || 30;
    
    const fromHours = fromTime.getHours();
    const fromMins = fromTime.getMinutes();
    const toHours = toTime.getHours();
    const toMins = toTime.getMinutes();
    
    // Calculate all trigger times for the day
    const triggerTimes = [];
    let currentHours = fromHours;
    let currentMins = fromMins;
    
    while (currentHours < toHours || (currentHours === toHours && currentMins <= toMins)) {
        triggerTimes.push({ hour: currentHours, minute: currentMins });
        
        // Add interval minutes
        currentMins += intervalMinutes;
        if (currentMins >= 60) {
            currentHours += Math.floor(currentMins / 60);
            currentMins = currentMins % 60;
        }
        
        if (currentHours > 23) break;
    }
    
    // Schedule a notification for each trigger time
    const body = getNotificationBody(item, userName);
    for (const trigger of triggerTimes) {
        const notifId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `🔔 ${item.taskName}`,
                body,
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'default' }),
            },
            trigger: {
                type: 'daily',
                hour: trigger.hour,
                minute: trigger.minute,
            },
        });
        notifIds.push(notifId);
    }
    
    return notifIds;
}

// ─── Timed Task (3 pre-deadline + 4 post-deadline notifications) ───
export async function scheduleTimedTaskNotifications(item, userName) {
    const endDate = new Date(item.endDate);
    const notifIds = [];
    const reminderHour = 9; // 9 AM default

    // Deadline day notification
    const deadlineDate = setTimeOnDate(endDate, reminderHour, 0);
    if (deadlineDate > new Date()) {
        const body = getDeadlineMessage('today', userName, item.taskName);
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: `🏁 ${item.taskName} - Due Today!`,
                body,
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'default' }),
            },
            trigger: { type: 'date', date: deadlineDate },
        });
        notifIds.push(id);
    }

    // 1 day before
    const oneDayBefore = setTimeOnDate(addDays(endDate, -1), reminderHour, 0);
    if (oneDayBefore > new Date()) {
        const body = getDeadlineMessage('tomorrow', userName, item.taskName);
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏳ ${item.taskName} - Due Tomorrow!`,
                body,
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'default' }),
            },
            trigger: { type: 'date', date: oneDayBefore },
        });
        notifIds.push(id);
    }

    // 2 days before
    const twoDaysBefore = setTimeOnDate(addDays(endDate, -2), reminderHour, 0);
    if (twoDaysBefore > new Date()) {
        const body = getDeadlineMessage('twoDays', userName, item.taskName);
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: `📋 ${item.taskName} - 2 Days Left`,
                body,
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'default' }),
            },
            trigger: { type: 'date', date: twoDaysBefore },
        });
        notifIds.push(id);
    }

    // ─── Post-deadline missed notifications (days 1–4 after deadline) ───
    for (let day = 1; day <= 4; day++) {
        const missedDate = setTimeOnDate(addDays(endDate, day), reminderHour, 0);
        if (missedDate > new Date()) {
            const body = getMissedDeadlineMessage(day, userName, item.taskName);
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🚨 ${item.taskName} - ${day} Day${day > 1 ? 's' : ''} Overdue!`,
                    body,
                    sound: 'default',
                    ...(Platform.OS === 'android' && { channelId: 'default' }),
                },
                trigger: { type: 'date', date: missedDate },
            });
            notifIds.push(id);
        }
    }

    return notifIds;
}

// ─── Completion Celebration Notifications ───
export async function scheduleCompletionNotifications(taskName, userName) {
    const notifIds = [];
    const channelId = Platform.OS === 'android' ? 'celebration' : undefined;

    // Notification 1: Immediate (2 seconds from now)
    const now = new Date();
    const immediate = new Date(now.getTime() + 2000);
    const body1 = getCompletionMessage(userName, taskName);
    const id1 = await Notifications.scheduleNotificationAsync({
        content: {
            title: `🎉 ${taskName} — COMPLETED!`,
            body: body1,
            sound: 'default',
            ...(channelId && { channelId }),
        },
        trigger: { type: 'date', date: immediate },
    });
    notifIds.push(id1);

    // Notification 2: 1 hour later — follow-up encouragement
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const body2 = getCompletionMessage(userName, taskName);
    const id2 = await Notifications.scheduleNotificationAsync({
        content: {
            title: `💪 Keep the momentum going!`,
            body: body2,
            sound: 'default',
            ...(channelId && { channelId }),
        },
        trigger: { type: 'date', date: oneHourLater },
    });
    notifIds.push(id2);

    // Notification 3: Next morning at 9 AM — recap
    const tomorrow9am = setTimeOnDate(addDays(now, 1), 9, 0);
    const body3 = getCompletionMessage(userName, taskName);
    const id3 = await Notifications.scheduleNotificationAsync({
        content: {
            title: `🌟 Remember yesterday's win!`,
            body: body3,
            sound: 'default',
            ...(channelId && { channelId }),
        },
        trigger: { type: 'date', date: tomorrow9am },
    });
    notifIds.push(id3);

    return notifIds;
}

// ─── Cancel Notifications ───
export async function cancelNotification(notifId) {
    if (notifId) {
        await Notifications.cancelScheduledNotificationAsync(notifId);
    }
}

export async function cancelNotifications(notifIds) {
    if (Array.isArray(notifIds)) {
        for (const id of notifIds) {
            await cancelNotification(id);
        }
    }
}

