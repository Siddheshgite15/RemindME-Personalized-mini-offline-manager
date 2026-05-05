import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getItems, deleteItem, updateItem } from '../../utils/storage';
import { cancelNotification } from '../../utils/notifications';
import TaskCard from '../../components/TaskCard';
import ScheduleCard from '../../components/ScheduleCard';
import ScheduleChip from '../../components/ScheduleChip';
import FAB from '../../components/FAB';
import EmptyState from '../../components/EmptyState';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TABS = ['Tasks', 'Schedules'];

export default function ManageDaily() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [indicatorAnim] = useState(new Animated.Value(0));

    const loadData = async () => {
        const t = await getItems('DAILY');
        t.sort((a, b) => {
            const ta = new Date(a.time).getHours() * 60 + new Date(a.time).getMinutes();
            const tb = new Date(b.time).getHours() * 60 + new Date(b.time).getMinutes();
            return ta - tb;
        });
        setTasks(t);
        setSchedules(await getItems('DAILY_SCHEDULES'));
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const switchTab = (index) => {
        Animated.spring(indicatorAnim, {
            toValue: index,
            useNativeDriver: true,
            tension: 300,
            friction: 30,
        }).start();
        setActiveTab(index);
    };

    // Find schedule names for a task
    const getScheduleChips = (taskId) => {
        return schedules.filter(s => s.taskIds?.includes(taskId));
    };

    const handleDeleteTask = async (item) => {
        if (item.notifId) await cancelNotification(item.notifId);
        // Also remove from notification arrays
        if (item.notifIds) {
            for (const nid of item.notifIds) await cancelNotification(nid);
        }
        await deleteItem('DAILY', item.id);
        // Remove task from all schedules' taskIds
        for (const sched of schedules) {
            if (sched.taskIds?.includes(item.id)) {
                await updateItem('DAILY_SCHEDULES', sched.id, {
                    taskIds: sched.taskIds.filter(tid => tid !== item.id),
                });
            }
        }
        loadData();
    };

    const handleDeleteSchedule = async (schedule) => {
        // Cancel notifications for tasks in this schedule that aren't in other schedules
        await deleteItem('DAILY_SCHEDULES', schedule.id);
        loadData();
    };

    const handlePressTask = (item) => {
        router.push(`/daily/form?id=${item.id}`);
    };

    const handlePressSchedule = (schedule) => {
        router.push(`/daily/schedule-form?id=${schedule.id}`);
    };

    const renderTaskItem = ({ item }) => (
        <View>
            <TaskCard item={item} type="DAILY" onPress={handlePressTask} onDelete={handleDeleteTask} />
            {getScheduleChips(item.id).length > 0 && (
                <View style={styles.chipRow}>
                    {getScheduleChips(item.id).map(s => (
                        <ScheduleChip key={s.id} name={s.name} color={s.color} small />
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {TABS.map((tab, i) => (
                    <TouchableOpacity
                        key={tab}
                        style={styles.tab}
                        onPress={() => switchTab(i)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name={i === 0 ? 'clipboard-list-outline' : 'calendar-multiselect'}
                            size={18}
                            color={activeTab === i ? Colors.primary : Colors.muted}
                        />
                        <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
                <Animated.View
                    style={[
                        styles.tabIndicator,
                        {
                            left: activeTab === 0 ? '0%' : '50%',
                        },
                    ]}
                />
            </View>

            {/* Tab Content */}
            {activeTab === 0 ? (
                <>
                    {tasks.length === 0 ? (
                        <EmptyState icon="clipboard-text-outline" message="No tasks yet" />
                    ) : (
                        <FlatList
                            data={tasks}
                            keyExtractor={(item) => item.id}
                            renderItem={renderTaskItem}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                    <FAB onPress={() => router.push('/daily/form')} />
                </>
            ) : (
                <>
                    {schedules.length === 0 ? (
                        <EmptyState icon="calendar-plus" message="No schedules yet" />
                    ) : (
                        <FlatList
                            data={schedules}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <ScheduleCard
                                    schedule={item}
                                    onPress={handlePressSchedule}
                                    onDelete={handleDeleteSchedule}
                                />
                            )}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                    <FAB onPress={() => router.push('/daily/schedule-form')} />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
        position: 'relative',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.md,
    },
    tabText: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.muted,
    },
    tabTextActive: {
        color: Colors.primary,
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '50%',
        height: 3,
        backgroundColor: Colors.primary,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    list: {
        padding: Spacing.md,
        paddingBottom: 100,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: -4,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },
});
