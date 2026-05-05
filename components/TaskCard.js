import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { formatTime, getDaysRemaining } from '../utils/helpers';

export default function TaskCard({ item, type, onPress, onDelete, onToggle }) {
    const handleDelete = () => {
        Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${item.taskName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
            ]
        );
    };

    const renderContent = () => {
        switch (type) {
            case 'DAILY':
                return (
                    <View style={styles.row}>
                        <View style={[styles.timeChip, { backgroundColor: Colors.primary + '22' }]}>
                            <MaterialCommunityIcons name="alarm" size={14} color={Colors.primary} />
                            <Text style={[styles.timeText, { color: Colors.primary }]}>{formatTime(item.time)}</Text>
                        </View>
                        <Text style={styles.taskName} numberOfLines={1}>{item.taskName}</Text>
                    </View>
                );
            case 'REMINDERS':
                if (item.isInterval) {
                    // Interval reminder display
                    return (
                        <View style={styles.column}>
                            <View style={styles.row}>
                                <View style={[styles.timeChip, { backgroundColor: Colors.secondary + '22' }]}>
                                    <MaterialCommunityIcons name="sync" size={14} color={Colors.secondary} />
                                    <Text style={[styles.timeText, { color: Colors.secondary }]}>Every {item.intervalMinutes}m</Text>
                                </View>
                                <Text style={[styles.taskName, { flex: 1 }]} numberOfLines={1}>{item.taskName}</Text>
                                {onToggle && (
                                    <TouchableOpacity onPress={() => onToggle(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <MaterialCommunityIcons
                                            name={item.isActive ? 'bell-ring' : 'bell-off-outline'}
                                            size={22}
                                            color={item.isActive ? Colors.secondary : Colors.muted}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.timeRangeBadge}>
                                {formatTime(item.fromTime)} – {formatTime(item.toTime)}
                            </Text>
                        </View>
                    );
                } else {
                    // Single time reminder display
                    return (
                        <View style={styles.row}>
                            <View style={[styles.timeChip, { backgroundColor: Colors.secondary + '22' }]}>
                                <MaterialCommunityIcons name="bell-outline" size={14} color={Colors.secondary} />
                                <Text style={[styles.timeText, { color: Colors.secondary }]}>{formatTime(item.time)}</Text>
                            </View>
                            <Text style={[styles.taskName, { flex: 1 }]} numberOfLines={1}>{item.taskName}</Text>
                            {onToggle && (
                                <TouchableOpacity onPress={() => onToggle(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <MaterialCommunityIcons
                                        name={item.isActive ? 'bell-ring' : 'bell-off-outline'}
                                        size={22}
                                        color={item.isActive ? Colors.secondary : Colors.muted}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }
            case 'TIMED': {
                const daysLeft = getDaysRemaining(item.endDate);
                const isDone = item.done;
                let chipColor = Colors.success;
                if (daysLeft <= 3) chipColor = Colors.danger;
                else if (daysLeft <= 7) chipColor = Colors.warning;
                if (isDone) chipColor = Colors.muted;

                return (
                    <View>
                        <View style={styles.row}>
                            <Text style={[styles.taskName, isDone && styles.taskDone]} numberOfLines={1}>
                                {item.taskName}
                            </Text>
                            {isDone && (
                                <View style={styles.completedBadge}>
                                    <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                                    <Text style={styles.completedText}>Done</Text>
                                </View>
                            )}
                        </View>
                        <View style={[styles.row, { marginTop: Spacing.sm }]}>
                            <View style={[styles.timeChip, { backgroundColor: chipColor + '22' }]}>
                                <MaterialCommunityIcons name="clock-outline" size={14} color={chipColor} />
                                <Text style={[styles.timeText, { color: chipColor }]}>
                                    {isDone ? 'Completed' : daysLeft <= 0 ? 'Overdue!' : `${daysLeft}d left`}
                                </Text>
                            </View>
                            <Text style={styles.dateRange}>
                                {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                            </Text>
                        </View>
                        {!isDone && onToggle && (
                            <TouchableOpacity
                                style={styles.markCompleteBtn}
                                onPress={() => onToggle(item)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="check-bold" size={16} color={Colors.bg} />
                                <Text style={styles.markCompleteBtnText}>Mark as Complete</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            }
            default:
                return null;
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(item)}
            onLongPress={handleDelete}
            activeOpacity={0.7}
        >
            {renderContent()}
            <View style={styles.deleteHint}>
                <MaterialCommunityIcons name="gesture-tap-hold" size={12} color={Colors.muted} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        position: 'relative',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    timeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    timeText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    taskName: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.text,
        fontWeight: '500',
    },
    taskDone: {
        textDecorationLine: 'line-through',
        color: Colors.muted,
    },
    dateRange: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    deleteHint: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        opacity: 0.4,
    },
    markCompleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.success,
    },
    markCompleteBtnText: {
        color: Colors.bg,
        fontSize: FontSize.sm,
        fontWeight: '700',
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.success + '22',
    },
    completedText: {
        fontSize: FontSize.xs,
        color: Colors.success,
        fontWeight: '600',
    },
    column: {
        gap: Spacing.xs,
    },
    timeRangeBadge: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginLeft: 0,
    },
});
