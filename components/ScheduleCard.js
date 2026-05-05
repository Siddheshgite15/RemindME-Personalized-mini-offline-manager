import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, DayLabels } from '../constants/theme';

export default function ScheduleCard({ schedule, onPress, onDelete }) {
    const handleDelete = () => {
        const taskCount = schedule.taskIds?.length || 0;
        const msg = taskCount > 0
            ? `"${schedule.name}" has ${taskCount} task(s) assigned. Are you sure you want to delete this schedule?`
            : `Are you sure you want to delete "${schedule.name}"?`;

        Alert.alert('Delete Schedule', msg, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(schedule) },
        ]);
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(schedule)}
            onLongPress={handleDelete}
            activeOpacity={0.7}
        >
            {/* Color accent bar */}
            <View style={[styles.colorBar, { backgroundColor: schedule.color }]} />

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.name, { color: schedule.color }]}>{schedule.name}</Text>
                    <MaterialCommunityIcons name="gesture-tap-hold" size={12} color={Colors.muted} style={{ opacity: 0.4 }} />
                </View>

                {/* Assigned days */}
                <View style={styles.daysRow}>
                    {DayLabels.map((label, i) => {
                        const isAssigned = schedule.days?.includes(i);
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.dayDot,
                                    isAssigned && { backgroundColor: schedule.color, borderColor: schedule.color },
                                ]}
                            >
                                <Text style={[styles.dayText, isAssigned && styles.dayTextActive]}>
                                    {label[0]}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Task count */}
                <Text style={styles.taskCount}>
                    {schedule.taskIds?.length || 0} task(s) assigned
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
    },
    colorBar: {
        width: 5,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    daysRow: {
        flexDirection: 'row',
        gap: 6,
    },
    dayDot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dayText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.muted,
    },
    dayTextActive: {
        color: '#fff',
    },
    taskCount: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
});
