import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getItemById, saveItem, updateItem, getItems } from '../../utils/storage';
import { getUser } from '../../utils/storage';
import { scheduleDailyNotification, cancelNotification, cancelNotifications } from '../../utils/notifications';
import { formatTime } from '../../utils/helpers';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SavedMessagesDropdown, { autoSaveCustomMessage } from '../../components/SavedMessagesDropdown';

export default function DailyForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const isEdit = !!id;

    const [taskName, setTaskName] = useState('');
    const [time, setTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [messageType, setMessageType] = useState('motivational'); // 'motivational' | 'custom'
    const [customMsg, setCustomMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            (async () => {
                const item = await getItemById('DAILY', id);
                if (item) {
                    setTaskName(item.taskName);
                    setTime(new Date(item.time));
                    setMessageType(item.messageType || 'motivational');
                    setCustomMsg(item.customMsg || '');
                }
            })();
        }
    }, [id]);

    const handleSave = async () => {
        if (!taskName.trim()) {
            Alert.alert('Oops!', 'Please enter a task name.');
            return;
        }
        setLoading(true);

        try {
            const user = await getUser();
            const itemData = {
                taskName: taskName.trim(),
                time: time.toISOString(),
                messageType,
                customMsg: messageType === 'custom' ? customMsg : '',
            };

            // Find which schedules contain this task and collect their weekdays
            const schedules = await getItems('DAILY_SCHEDULES');
            let weekdays = null;
            if (isEdit) {
                const assignedSchedules = schedules.filter(s => s.taskIds?.includes(id));
                if (assignedSchedules.length > 0) {
                    const daySet = new Set();
                    assignedSchedules.forEach(s => (s.days || []).forEach(d => daySet.add(d)));
                    weekdays = [...daySet];
                }
            }

            if (isEdit) {
                // Cancel old notifications
                const oldItem = await getItemById('DAILY', id);
                if (oldItem?.notifId) await cancelNotification(oldItem.notifId);
                if (oldItem?.notifIds) await cancelNotifications(oldItem.notifIds);

                // Schedule new with weekday awareness
                const result = await scheduleDailyNotification(itemData, user?.name || 'Friend', weekdays);
                const updateData = { ...itemData };
                if (Array.isArray(result)) {
                    updateData.notifIds = result;
                    updateData.notifId = null;
                } else {
                    updateData.notifId = result;
                    updateData.notifIds = null;
                }
                await updateItem('DAILY', id, updateData);
            } else {
                // New task: Do NOT schedule notifications yet. They will be scheduled when added to a schedule.
                await saveItem('DAILY', { ...itemData, notifId: null, notifIds: null });
            }

            await autoSaveCustomMessage(messageType, customMsg);
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Failed to save. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Task Name */}
            <Text style={styles.label}>Task Name</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Morning Exercise"
                placeholderTextColor={Colors.muted}
                value={taskName}
                onChangeText={setTaskName}
                maxLength={25}
            />
            <Text style={styles.charCount}>{taskName.length}/25</Text>

            {/* Time Picker */}
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.primary} />
                <Text style={styles.pickerText}>{formatTime(time.toISOString())}</Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={time}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, selected) => {
                        setShowPicker(Platform.OS === 'ios');
                        if (selected) setTime(selected);
                    }}
                    themeVariant="dark"
                />
            )}

            {/* Notification Message Type */}
            <Text style={styles.label}>Notification Message</Text>
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleBtn, messageType === 'motivational' && styles.toggleActive]}
                    onPress={() => setMessageType('motivational')}
                >
                    <MaterialCommunityIcons name="star" size={16} color={messageType === 'motivational' ? Colors.text : Colors.muted} />
                    <Text style={[styles.toggleText, messageType === 'motivational' && styles.toggleTextActive]}>
                        Motivational
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, messageType === 'custom' && styles.toggleActive]}
                    onPress={() => setMessageType('custom')}
                >
                    <MaterialCommunityIcons name="pencil" size={16} color={messageType === 'custom' ? Colors.text : Colors.muted} />
                    <Text style={[styles.toggleText, messageType === 'custom' && styles.toggleTextActive]}>Custom</Text>
                </TouchableOpacity>
            </View>

            {messageType === 'custom' && (
                <>
                    <TextInput
                        style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="Type your custom notification message..."
                        placeholderTextColor={Colors.muted}
                        value={customMsg}
                        onChangeText={setCustomMsg}
                        multiline
                    />
                    <SavedMessagesDropdown
                        currentMsg={customMsg}
                        onSelectMessage={setCustomMsg}
                    />
                </>
            )}

            {messageType === 'motivational' && (
                <Text style={styles.hintText}>
                    💡 A random motivational quote will be sent with each notification!
                </Text>
            )}

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Task' : 'Add Task'}</Text>
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
        paddingBottom: Spacing.xxl,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
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
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    pickerText: {
        fontSize: FontSize.lg,
        color: Colors.text,
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    toggleActive: {
        backgroundColor: Colors.primary + '33',
        borderColor: Colors.primary,
    },
    toggleText: {
        fontSize: FontSize.sm,
        color: Colors.muted,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: Colors.text,
    },
    hintText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    saveBtnText: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
});
