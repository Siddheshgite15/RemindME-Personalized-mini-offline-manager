import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getItemById, saveItem, updateItem } from '../../utils/storage';
import { getUser } from '../../utils/storage';
import { scheduleTimedTaskNotifications, cancelNotifications } from '../../utils/notifications';
import { formatDate, addDays } from '../../utils/helpers';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SavedMessagesDropdown, { autoSaveCustomMessage } from '../../components/SavedMessagesDropdown';

export default function TimedForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const isEdit = !!id;

    const [taskName, setTaskName] = useState('');
    const [durationType, setDurationType] = useState('days'); // 'days' | 'months'
    const [durationValue, setDurationValue] = useState('7');
    const [endDate, setEndDate] = useState(addDays(new Date(), 7));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [messageType, setMessageType] = useState('motivational');
    const [customMsg, setCustomMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            (async () => {
                const item = await getItemById('TIMED', id);
                if (item) {
                    setTaskName(item.taskName);
                    setEndDate(new Date(item.endDate));
                    setMessageType(item.messageType || 'motivational');
                    setCustomMsg(item.customMsg || '');
                }
            })();
        }
    }, [id]);

    // Update end date when duration changes
    useEffect(() => {
        if (!isEdit) {
            const val = parseInt(durationValue) || 1;
            const now = new Date();
            if (durationType === 'days') {
                setEndDate(addDays(now, val));
            } else {
                const d = new Date(now);
                d.setMonth(d.getMonth() + val);
                setEndDate(d);
            }
        }
    }, [durationValue, durationType]);

    const handleSave = async () => {
        if (!taskName.trim()) {
            Alert.alert('Oops!', 'Please enter a task name.');
            return;
        }

        if (endDate <= new Date()) {
            Alert.alert('Invalid Date', 'End date must be in the future.');
            return;
        }

        setLoading(true);

        try {
            const user = await getUser();
            const itemData = {
                taskName: taskName.trim(),
                startDate: new Date().toISOString(),
                endDate: endDate.toISOString(),
                messageType,
                customMsg: messageType === 'custom' ? customMsg : '',
                done: false,
            };

            if (isEdit) {
                const oldItem = await getItemById('TIMED', id);
                if (oldItem?.notifIds) await cancelNotifications(oldItem.notifIds);

                const notifIds = await scheduleTimedTaskNotifications(itemData, user?.name || 'Friend');
                await updateItem('TIMED', id, { ...itemData, notifIds });
            } else {
                const notifIds = await scheduleTimedTaskNotifications(itemData, user?.name || 'Friend');
                await saveItem('TIMED', { ...itemData, notifIds });
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

    const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Task Name */}
            <Text style={styles.label}>Task Name</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Complete project report"
                placeholderTextColor={Colors.muted}
                value={taskName}
                onChangeText={setTaskName}
            />

            {/* Duration or Date Picker */}
            {!isEdit ? (
                <>
                    <Text style={styles.label}>Duration</Text>
                    <View style={styles.durationRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, textAlign: 'center' }]}
                            value={durationValue}
                            onChangeText={setDurationValue}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.durationBtn, durationType === 'days' && styles.durationBtnActive]}
                                onPress={() => setDurationType('days')}
                            >
                                <Text style={[styles.durationBtnText, durationType === 'days' && styles.durationBtnTextActive]}>
                                    Days
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.durationBtn, durationType === 'months' && styles.durationBtnActive]}
                                onPress={() => setDurationType('months')}
                            >
                                <Text style={[styles.durationBtnText, durationType === 'months' && styles.durationBtnTextActive]}>
                                    Months
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            ) : (
                <>
                    <Text style={styles.label}>Deadline</Text>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                        <MaterialCommunityIcons name="calendar" size={20} color={Colors.accent} />
                        <Text style={styles.pickerText}>{formatDate(endDate.toISOString())}</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            minimumDate={new Date()}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, selected) => {
                                setShowDatePicker(Platform.OS === 'ios');
                                if (selected) setEndDate(selected);
                            }}
                            themeVariant="dark"
                        />
                    )}
                </>
            )}

            {/* Deadline Preview */}
            <View style={styles.previewCard}>
                <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.accent} />
                <View>
                    <Text style={styles.previewLabel}>Deadline</Text>
                    <Text style={styles.previewValue}>
                        {formatDate(endDate.toISOString())} ({daysRemaining} days from now)
                    </Text>
                </View>
            </View>

            <Text style={styles.hintText}>
                📅 You'll get reminders 2 days before, 1 day before, and on the deadline (at 9 AM)
            </Text>

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
                <Text style={styles.hintTextSmall}>
                    💡 Deadline-specific motivational messages will be sent automatically!
                </Text>
            )}

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Task' : 'Add Timed Task'}</Text>
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
    durationRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        alignItems: 'center',
    },
    durationBtn: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    durationBtnActive: {
        backgroundColor: Colors.accent + '33',
        borderColor: Colors.accent,
    },
    durationBtnText: {
        fontSize: FontSize.sm,
        color: Colors.muted,
        fontWeight: '600',
    },
    durationBtnTextActive: {
        color: Colors.text,
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
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.accent + '11',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.accent + '33',
    },
    previewLabel: {
        fontSize: FontSize.xs,
        color: Colors.muted,
    },
    previewValue: {
        fontSize: FontSize.sm,
        color: Colors.text,
        fontWeight: '500',
    },
    hintText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
    },
    hintTextSmall: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.sm,
        fontStyle: 'italic',
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
        backgroundColor: Colors.accent + '33',
        borderColor: Colors.accent,
    },
    toggleText: {
        fontSize: FontSize.sm,
        color: Colors.muted,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: Colors.text,
    },
    saveBtn: {
        backgroundColor: Colors.accent,
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
