import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    USER: '@remindme_user',
    DAILY: '@remindme_daily',
    DAILY_SCHEDULES: '@remindme_daily_schedules',
    REMINDERS: '@remindme_reminders',
    TIMED: '@remindme_timed',
    SAVED_MESSAGES: '@remindme_saved_messages',
    NOTES: '@remindme_notes',
};

// ─── User Profile ───
export async function getUser() {
    try {
        const json = await AsyncStorage.getItem(KEYS.USER);
        return json ? JSON.parse(json) : null;
    } catch { return null; }
}

export async function setUser(name) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify({ name }));
}

// ─── Generic CRUD ───
export async function getItems(key) {
    try {
        const json = await AsyncStorage.getItem(KEYS[key]);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
}

export async function saveItem(key, item) {
    const items = await getItems(key);
    items.push({ ...item, id: genId() });
    await AsyncStorage.setItem(KEYS[key], JSON.stringify(items));
    return items;
}

export async function updateItem(key, id, data) {
    const items = await getItems(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return items;
    items[idx] = { ...items[idx], ...data };
    await AsyncStorage.setItem(KEYS[key], JSON.stringify(items));
    return items;
}

export async function deleteItem(key, id) {
    let items = await getItems(key);
    items = items.filter(i => i.id !== id);
    await AsyncStorage.setItem(KEYS[key], JSON.stringify(items));
    return items;
}

export async function getItemById(key, id) {
    const items = await getItems(key);
    return items.find(i => i.id === id) || null;
}

// ─── Schedule Helpers ───
export async function getSchedulesForDay(dayIndex) {
    const schedules = await getItems('DAILY_SCHEDULES');
    return schedules.filter(s => s.days && s.days.includes(dayIndex));
}

export async function getTasksForSchedule(scheduleId) {
    const schedules = await getItems('DAILY_SCHEDULES');
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || !schedule.taskIds || schedule.taskIds.length === 0) return [];
    const tasks = await getItems('DAILY');
    return tasks.filter(t => schedule.taskIds.includes(t.id));
}

// ─── ID Generator (no uuid dep) ───
function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export { KEYS };
