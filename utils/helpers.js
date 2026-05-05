import {
    MOTIVATIONAL_MESSAGES,
    DEADLINE_MESSAGES,
    COMPLETION_MESSAGES,
    MISSED_DEADLINE_MESSAGES,
} from '../constants/motivational';

/**
 * Get a random motivational message with placeholders replaced.
 * @param {string} name - User's name
 * @param {string} task - Task name
 * @returns {string} Interpolated message
 */
export function getMotivationalMessage(name, task) {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    return interpolate(MOTIVATIONAL_MESSAGES[idx], name, task);
}

/**
 * Get a deadline-specific message.
 * @param {'today'|'tomorrow'|'twoDays'} type
 * @param {string} name
 * @param {string} task
 */
export function getDeadlineMessage(type, name, task) {
    const msgs = DEADLINE_MESSAGES[type] || DEADLINE_MESSAGES.today;
    const idx = Math.floor(Math.random() * msgs.length);
    return interpolate(msgs[idx], name, task);
}

/**
 * Get a random completion celebration message.
 */
export function getCompletionMessage(name, task) {
    const idx = Math.floor(Math.random() * COMPLETION_MESSAGES.length);
    return interpolate(COMPLETION_MESSAGES[idx], name, task);
}

/**
 * Get a missed-deadline follow-up message for a specific day (1–4).
 */
export function getMissedDeadlineMessage(dayNumber, name, task) {
    const key = `day${dayNumber}`;
    const msgs = MISSED_DEADLINE_MESSAGES[key] || MISSED_DEADLINE_MESSAGES.day1;
    const idx = Math.floor(Math.random() * msgs.length);
    return interpolate(msgs[idx], name, task);
}

/**
 * Get notification body for a task.
 * If task has customMsg, use that; otherwise pick a motivational quote.
 */
export function getNotificationBody(task, name) {
    if (task.messageType === 'custom' && task.customMsg) {
        return interpolate(task.customMsg, name, task.taskName);
    }
    return getMotivationalMessage(name, task.taskName);
}

function interpolate(template, name, task) {
    return template
        .replace(/\{name\}/g, name || 'Friend')
        .replace(/\{task\}/g, task || 'your task');
}

// ─── Date Helpers ───

export function formatTime(dateStr) {
    const d = new Date(dateStr);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

export function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function getDaysRemaining(endDateStr) {
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getGreeting(name) {
    const h = new Date().getHours();
    let greeting = 'Good evening';
    if (h < 12) greeting = 'Good morning';
    else if (h < 17) greeting = 'Good afternoon';
    return `${greeting}, ${name || 'Friend'}! `;
}

export function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export function setTimeOnDate(date, hours, minutes) {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
}
