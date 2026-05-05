import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getItems, getItemById, saveItem, updateItem } from '../../utils/storage';
import { getUser } from '../../utils/storage';
import { scheduleDailyNotification, cancelNotification, cancelNotifications } from '../../utils/notifications';
import DaySelector from '../../components/DaySelector';
import { Colors, Spacing, FontSize, BorderRadius, ScheduleColors, DayLabels } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ScheduleForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const isEdit = !!id;

    const [name, setName] = useState('');
    const [color, setColor] = useState(ScheduleColors[0]);
    const [days, setDays] = useState([]);
    const [taskIds, setTaskIds] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [allSchedules, setAllSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const tasks = await getItems('DAILY');
            tasks.sort((a, b) => {
                const ta = new Date(a.time).getHours() * 60 + new Date(a.time).getMinutes();
                const tb = new Date(b.time).getHours() * 60 + new Date(b.time).getMinutes();
                return ta - tb;
            });
            setAllTasks(tasks);

            const schedules = await getItems('DAILY_SCHEDULES');
            setAllSchedules(schedules);

            if (isEdit) {
                const schedule = schedules.find(s => s.id === id);
                if (schedule) {
                    setName(schedule.name);
                    setColor(schedule.color);
                    setDays(schedule.days || []);
                    setTaskIds(schedule.taskIds || []);
                }
            }
        })();
    }, [id]);

    // Build a map of day → schedule (excluding current schedule in edit mode)
    const dayScheduleMap = {};
    allSchedules.forEach(s => {
        if (isEdit && s.id === id) return;
        (s.days || []).forEach(d => {
            dayScheduleMap[d] = { name: s.name, color: s.color, id: s.id };
        });
    });

    const handleDayToggle = (dayIndex, otherSchedule) => {
        if (days.includes(dayIndex)) {
            setDays(days.filter(d => d !== dayIndex));
            return;
        }

        if (otherSchedule) {
            Alert.alert(
                'Reassign Day?',
                `${DayLabels[dayIndex]} is currently assigned to "${otherSchedule.name}". Reassign to this schedule?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Reassign', onPress: async () => {
                            // Remove day from the other schedule
                            const otherSched = allSchedules.find(s => s.id === otherSchedule.id);
                            if (otherSched) {
                                const newDays = (otherSched.days || []).filter(d => d !== dayIndex);
                                await updateItem('DAILY_SCHEDULES', otherSched.id, { days: newDays });
                                // Update local state
                                setAllSchedules(prev => prev.map(s =>
                                    s.id === otherSched.id ? { ...s, days: newDays } : s
                                ));
                            }
                            setDays([...days, dayIndex]);
                        },
                    },
                ]
            );
        } else {
            setDays([...days, dayIndex]);
        }
    };

    const handleToggleTask = (taskId) => {
        setTaskIds(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Oops!', 'Please enter a schedule name.');
            return;
        }
        setLoading(true);

        try {
            const user = await getUser();
            const data = {
                name: name.trim(),
                color,
                days: days.sort(),
                taskIds,
            };

            if (isEdit) {
                // Find which tasks were added and removed
                const oldSchedule = allSchedules.find(s => s.id === id);
                const oldTaskIds = oldSchedule?.taskIds || [];
                
                const addedTaskIds = taskIds.filter(tId => !oldTaskIds.includes(tId));
                const removedTaskIds = oldTaskIds.filter(tId => !taskIds.includes(tId));

                // For removed tasks, cancel their notifications
                for (const taskId of removedTaskIds) {
                    const task = allTasks.find(t => t.id === taskId);
                    if (task) {
                        if (task.notifId) await cancelNotification(task.notifId);
                        if (task.notifIds) await cancelNotifications(task.notifIds);
                        await updateItem('DAILY', taskId, { notifId: null, notifIds: null });
                    }
                }

                // For added tasks, schedule notifications with the schedule's days
                for (const taskId of addedTaskIds) {
                    const task = allTasks.find(t => t.id === taskId);
                    if (task && days.length > 0) {
                        const result = await scheduleDailyNotification(task, user?.name || 'Friend', days);
                        const updateData = {};
                        if (Array.isArray(result)) {
                            updateData.notifIds = result;
                            updateData.notifId = null;
                        } else {
                            updateData.notifId = result;
                            updateData.notifIds = null;
                        }
                        await updateItem('DAILY', taskId, updateData);
                    }
                }

                await updateItem('DAILY_SCHEDULES', id, data);
            } else {
                // New schedule - schedule notifications for assigned tasks
                await saveItem('DAILY_SCHEDULES', data);
                
                // Schedule notifications for newly assigned tasks
                for (const taskId of taskIds) {
                    const task = allTasks.find(t => t.id === taskId);
                    if (task && days.length > 0) {
                        const result = await scheduleDailyNotification(task, user?.name || 'Friend', days);
                        const updateData = {};
                        if (Array.isArray(result)) {
                            updateData.notifIds = result;
                            updateData.notifId = null;
                        } else {
                            updateData.notifId = result;
                            updateData.notifIds = null;
                        }
                        await updateItem('DAILY', taskId, updateData);
                    }
                }
            }

            router.back();
        } catch (e) {
            Alert.alert('Error', 'Failed to save. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        let h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Schedule Name */}
            <Text style={styles.label}>Schedule Name</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Morning Routine"
                placeholderTextColor={Colors.muted}
                value={name}
                onChangeText={setName}
                maxLength={20}
            />
            <Text style={styles.charCount}>{name.length}/20</Text>

            {/* Color Picker */}
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
                {ScheduleColors.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[
                            styles.colorCircle,
                            { backgroundColor: c },
                            color === c && styles.colorCircleSelected,
                        ]}
                        onPress={() => setColor(c)}
                        activeOpacity={0.7}
                    >
                        {color === c && (
                            <MaterialCommunityIcons name="check" size={16} color="#fff" />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Day Assignment */}
            <Text style={styles.label}>Assign Days</Text>
            <DaySelector
                selectedDays={days}
                onToggle={handleDayToggle}
                scheduleColor={color}
                dayScheduleMap={dayScheduleMap}
            />
            <Text style={styles.hintText}>
                {days.length === 0 ? 'Tap days to assign this schedule' : `Active on ${days.length} day(s)`}
            </Text>

            {/* Task Assignment */}
            <Text style={styles.label}>Assign Tasks</Text>
            {allTasks.length === 0 ? (
                <View style={styles.emptyTasks}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={Colors.muted} />
                    <Text style={styles.emptyTasksText}>No tasks yet. Create tasks first!</Text>
                </View>
            ) : (
                <View style={styles.taskList}>
                    {allTasks.map(task => {
                        const isChecked = taskIds.includes(task.id);
                        return (
                            <TouchableOpacity
                                key={task.id}
                                style={[styles.taskCheckItem, isChecked && { borderColor: color + '55', backgroundColor: color + '0D' }]}
                                onPress={() => handleToggleTask(task.id)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                    size={24}
                                    color={isChecked ? color : Colors.muted}
                                />
                                <View style={styles.taskCheckInfo}>
                                    <Text style={[styles.taskCheckName, isChecked && { color: Colors.text }]}>
                                        {task.taskName}
                                    </Text>
                                    <Text style={styles.taskCheckTime}>{formatTime(task.time)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: color }, loading && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Schedule' : 'Create Schedule'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    content: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl * 2,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.text,
    },
    charCount: {
        fontSize: FontSize.xs,
        color: Colors.muted,
        textAlign: 'right',
        marginTop: 4,
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm + 2,
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorCircleSelected: {
        borderColor: '#fff',
        transform: [{ scale: 1.1 }],
    },
    hintText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    taskList: {
        gap: Spacing.xs,
    },
    taskCheckItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
    },
    taskCheckInfo: {
        flex: 1,
        gap: 2,
    },
    taskCheckName: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    taskCheckTime: {
        fontSize: FontSize.xs,
        color: Colors.muted,
    },
    emptyTasks: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },
    emptyTasksText: {
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
    saveBtn: {
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
});
