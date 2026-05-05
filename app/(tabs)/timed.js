import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getItems, updateItem, deleteItem, getUser } from '../../utils/storage';
import { cancelNotifications, scheduleCompletionNotifications } from '../../utils/notifications';
import TaskCard from '../../components/TaskCard';
import FAB from '../../components/FAB';
import EmptyState from '../../components/EmptyState';
import { Colors, Spacing, FontSize } from '../../constants/theme';

export default function TimedScreen() {
    const router = useRouter();
    const [items, setItems] = useState([]);

    const loadItems = async () => {
        const data = await getItems('TIMED');
        // Sort: incomplete first (by deadline), then completed
        data.sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            return new Date(a.endDate) - new Date(b.endDate);
        });
        setItems(data);
    };

    useFocusEffect(useCallback(() => { loadItems(); }, []));

    const handleDelete = async (item) => {
        await cancelNotifications(item.notifIds);
        if (item.completionNotifIds) await cancelNotifications(item.completionNotifIds);
        await deleteItem('TIMED', item.id);
        loadItems();
    };

    const handleToggle = async (item) => {
        const newDone = !item.done;
        if (newDone) {
            // Mark complete — cancel pending deadline/missed notifications
            if (item.notifIds) await cancelNotifications(item.notifIds);

            // Schedule celebration notifications
            try {
                const user = await getUser();
                const completionNotifIds = await scheduleCompletionNotifications(
                    item.taskName, user?.name || 'Friend'
                );
                await updateItem('TIMED', item.id, {
                    done: true,
                    completionNotifIds,
                    completedAt: new Date().toISOString(),
                });
            } catch (e) {
                console.error('Failed to schedule completion notifications:', e);
                await updateItem('TIMED', item.id, { done: true, completedAt: new Date().toISOString() });
            }

            Alert.alert(
                '🎉 Task Completed!',
                `Amazing work! "${item.taskName}" is done!\n\nYou've moved one step ahead! Keep pushing forward! 💪`,
                [{ text: 'Thanks! 🙌', style: 'default' }]
            );
        } else {
            // Un-complete — cancel celebration notifications
            if (item.completionNotifIds) await cancelNotifications(item.completionNotifIds);
            await updateItem('TIMED', item.id, { done: false, completionNotifIds: null, completedAt: null });
        }
        loadItems();
    };

    const handlePress = (item) => {
        router.push(`/timed/form?id=${item.id}`);
    };

    const activeCount = items.filter(i => !i.done).length;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>⏳ Timed Tasks</Text>
            <Text style={styles.subtitle}>
                {activeCount} active • {items.length - activeCount} completed
            </Text>

            {items.length === 0 ? (
                <EmptyState icon="timer-sand" message="No timed tasks yet" />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TaskCard
                            item={item}
                            type="TIMED"
                            onPress={handlePress}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <FAB onPress={() => router.push('/timed/form')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
        padding: Spacing.md,
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
        marginBottom: Spacing.md,
    },
    list: {
        paddingBottom: 100,
    },
});
