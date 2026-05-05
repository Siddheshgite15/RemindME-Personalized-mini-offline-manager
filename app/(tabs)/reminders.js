import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getItems, updateItem, deleteItem } from '../../utils/storage';
import { cancelNotification, cancelNotifications, scheduleReminderNotification, scheduleIntervalReminderNotifications } from '../../utils/notifications';
import { getUser } from '../../utils/storage';
import TaskCard from '../../components/TaskCard';
import FAB from '../../components/FAB';
import EmptyState from '../../components/EmptyState';
import { Colors, Spacing, FontSize } from '../../constants/theme';

export default function RemindersScreen() {
    const router = useRouter();
    const [items, setItems] = useState([]);

    const loadItems = async () => {
        const data = await getItems('REMINDERS');
        data.sort((a, b) => {
            const ta = new Date(a.time).getHours() * 60 + new Date(a.time).getMinutes();
            const tb = new Date(b.time).getHours() * 60 + new Date(b.time).getMinutes();
            return ta - tb;
        });
        setItems(data);
    };

    useFocusEffect(useCallback(() => { loadItems(); }, []));

    const handleDelete = async (item) => {
        if (item.notifId) await cancelNotification(item.notifId);
        if (item.notifIds) await cancelNotifications(item.notifIds);
        await deleteItem('REMINDERS', item.id);
        loadItems();
    };

    const handleToggle = async (item) => {
        const newActive = !item.isActive;

        if (!newActive) {
            // Deactivate — cancel notifications
            if (item.notifId) await cancelNotification(item.notifId);
            if (item.notifIds) await cancelNotifications(item.notifIds);
            await updateItem('REMINDERS', item.id, { isActive: false, notifId: null, notifIds: null });
        } else {
            // Reactivate — reschedule
            const user = await getUser();
            let result;
            if (item.isInterval) {
                result = await scheduleIntervalReminderNotifications(item, user?.name || 'Friend');
            } else {
                result = await scheduleReminderNotification(item, user?.name || 'Friend');
            }

            const updateData = { isActive: true };
            if (Array.isArray(result)) {
                updateData.notifIds = result;
                updateData.notifId = null;
            } else {
                updateData.notifId = result;
                updateData.notifIds = null;
            }
            await updateItem('REMINDERS', item.id, updateData);
        }

        loadItems();
    };

    const handlePress = (item) => {
        router.push(`/reminder/form?id=${item.id}`);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>🔔 Reminders</Text>
            <Text style={styles.subtitle}>
                {items.filter(i => i.isActive).length} active • {items.length} total
            </Text>

            {items.length === 0 ? (
                <EmptyState icon="bell-ring-outline" message="No reminders yet" />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TaskCard
                            item={item}
                            type="REMINDERS"
                            onPress={handlePress}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <FAB onPress={() => router.push('/reminder/form')} />
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
