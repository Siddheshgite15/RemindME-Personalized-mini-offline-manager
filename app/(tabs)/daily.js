import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getItems, getSchedulesForDay, getTasksForSchedule, deleteItem } from '../../utils/storage';
import { cancelNotification } from '../../utils/notifications';
import TaskCard from '../../components/TaskCard';
import EmptyState from '../../components/EmptyState';
import { Colors, Spacing, FontSize, BorderRadius, DayLabels } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DailyScreen() {
    const router = useRouter();
    const [todaySchedule, setTodaySchedule] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [allSchedules, setAllSchedules] = useState([]);

    const loadData = async () => {
        const dayIndex = new Date().getDay(); // 0=Sun
        const schedules = await getSchedulesForDay(dayIndex);
        const all = await getItems('DAILY_SCHEDULES');
        setAllSchedules(all);

        if (schedules.length > 0) {
            const schedule = schedules[0]; // One schedule per day
            setTodaySchedule(schedule);
            const scheduleTasks = await getTasksForSchedule(schedule.id);
            // Sort by time
            scheduleTasks.sort((a, b) => {
                const ta = new Date(a.time).getHours() * 60 + new Date(a.time).getMinutes();
                const tb = new Date(b.time).getHours() * 60 + new Date(b.time).getMinutes();
                return ta - tb;
            });
            setTasks(scheduleTasks);
        } else {
            setTodaySchedule(null);
            setTasks([]);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleDelete = async (item) => {
        if (item.notifId) await cancelNotification(item.notifId);
        await deleteItem('DAILY', item.id);
        loadData();
    };

    const handlePress = (item) => {
        router.push(`/daily/form?id=${item.id}`);
    };

    const todayName = DayLabels[new Date().getDay()];

    return (
        <View style={styles.container}>
            {/* Header with edit button */}
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.header}>📋 Daily Schedule</Text>
                    <Text style={styles.subtitle}>
                        {todaySchedule
                            ? `${todayName} • ${todaySchedule.name}`
                            : `${todayName} • No schedule set`
                        }
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push('/daily/manage')}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Schedule color accent */}
            {todaySchedule && (
                <View style={[styles.scheduleAccent, { backgroundColor: todaySchedule.color + '22', borderColor: todaySchedule.color + '44' }]}>
                    <View style={[styles.accentDot, { backgroundColor: todaySchedule.color }]} />
                    <Text style={[styles.accentText, { color: todaySchedule.color }]}>
                        {todaySchedule.name}
                    </Text>
                    <Text style={styles.accentCount}>
                        {tasks.length} task(s)
                    </Text>
                </View>
            )}

            {/* Day schedule overview strip */}
            {allSchedules.length > 0 && (
                <View style={styles.dayStrip}>
                    {DayLabels.map((label, i) => {
                        const sched = allSchedules.find(s => s.days?.includes(i));
                        const isToday = i === new Date().getDay();
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.dayStripItem,
                                    sched && { backgroundColor: sched.color + '22', borderColor: sched.color + '55' },
                                    isToday && styles.dayStripToday,
                                ]}
                            >
                                <Text style={[
                                    styles.dayStripText,
                                    sched && { color: sched.color },
                                    isToday && { fontWeight: '800' },
                                ]}>
                                    {label[0]}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Task list or empty state */}
            {!todaySchedule ? (
                <View style={styles.emptyContainer}>
                    <EmptyState icon="calendar-clock" message="No schedule set for today" />
                    <TouchableOpacity
                        style={styles.manageBtn}
                        onPress={() => router.push('/daily/manage')}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="calendar-plus" size={18} color={Colors.text} />
                        <Text style={styles.manageBtnText}>Manage Schedules</Text>
                    </TouchableOpacity>
                </View>
            ) : tasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <EmptyState icon="clipboard-text-outline" message="No tasks in this schedule" />
                    <TouchableOpacity
                        style={[styles.manageBtn, { backgroundColor: todaySchedule.color }]}
                        onPress={() => router.push(`/daily/schedule-form?id=${todaySchedule.id}`)}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                        <Text style={[styles.manageBtnText, { color: '#fff' }]}>Add Tasks to Schedule</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TaskCard item={item} type="DAILY" onPress={handlePress} onDelete={handleDelete} />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
        padding: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    header: {
        fontSize: FontSize.xl,
        color: Colors.text,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary + '18',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleAccent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    accentDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    accentText: {
        fontSize: FontSize.md,
        fontWeight: '600',
        flex: 1,
    },
    accentCount: {
        fontSize: FontSize.xs,
        color: Colors.muted,
    },
    dayStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        gap: 4,
    },
    dayStripItem: {
        flex: 1,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dayStripToday: {
        borderWidth: 2,
    },
    dayStripText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.muted,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.xl,
        marginTop: Spacing.md,
    },
    manageBtnText: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    list: {
        paddingBottom: 100,
    },
});
