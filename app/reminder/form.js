import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Platform, Alert, Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getItemById, saveItem, updateItem } from '../../utils/storage';
import { getUser } from '../../utils/storage';
import { scheduleReminderNotification, scheduleIntervalReminderNotifications, cancelNotification, cancelNotifications } from '../../utils/notifications';
import { formatTime } from '../../utils/helpers';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SavedMessagesDropdown, { autoSaveCustomMessage } from '../../components/SavedMessagesDropdown';

export default function ReminderForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const isEdit = !!id;

    const [taskName, setTaskName] = useState('');
    const [time, setTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [messageType, setMessageType] = useState('motivational');
    const [customMsg, setCustomMsg] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [isInterval, setIsInterval] = useState(false);
    const [fromTime, setFromTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
    const [toTime, setToTime] = useState(new Date(new Date().setHours(17, 0, 0, 0)));
    const [intervalMinutes, setIntervalMinutes] = useState('30');
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    useEffect(() => {
        if (isEdit) {
            (async () => {
                const item = await getItemById('REMINDERS', id);
                if (item) {
                    setTaskName(item.taskName);
                    setTime(new Date(item.time));
                    setMessageType(item.messageType || 'motivational');
                    setCustomMsg(item.customMsg || '');
                    setIsInterval(item.isInterval || false);
                    if (item.isInterval) {
                        setFromTime(new Date(item.fromTime));
                        setToTime(new Date(item.toTime));
                        setIntervalMinutes(String(item.intervalMinutes || 30));
                    }
                }
            })();
        }
    }, [id]);

    const handleSave = async () => {
        if (!taskName.trim()) {
            Alert.alert('Oops!', 'Please enter a task name.');
            return;
        }
        
        if (isInterval) {
            const interval = parseInt(intervalMinutes);
            if (!interval || interval < 1 || interval > 1440) {
                Alert.alert('Invalid Interval', 'Interval must be between 1 and 1440 minutes.');
                return;
            }
            if (toTime <= fromTime) {
                Alert.alert('Invalid Time Range', 'End time must be after start time.');
                return;
            }
        }
        
        setLoading(true);

        try {
            const user = await getUser();
            const itemData = {
                taskName: taskName.trim(),
                messageType,
                customMsg: messageType === 'custom' ? customMsg : '',
                isActive: true,
                isInterval,
            };

            if (isInterval) {
                itemData.fromTime = fromTime.toISOString();
                itemData.toTime = toTime.toISOString();
                itemData.intervalMinutes = parseInt(intervalMinutes);
                itemData.time = fromTime.toISOString(); // For sorting purposes
            } else {
                itemData.time = time.toISOString();
            }

            if (isEdit) {
                const oldItem = await getItemById('REMINDERS', id);
                if (oldItem?.notifId) await cancelNotification(oldItem.notifId);
                if (oldItem?.notifIds) await cancelNotifications(oldItem.notifIds);

                let result;
                if (isInterval) {
                    result = await scheduleIntervalReminderNotifications(itemData, user?.name || 'Friend');
                } else {
                    result = await scheduleReminderNotification(itemData, user?.name || 'Friend');
                }

                const updateData = { ...itemData };
                if (Array.isArray(result)) {
                    updateData.notifIds = result;
                    updateData.notifId = null;
                } else {
                    updateData.notifId = result;
                    updateData.notifIds = null;
                }
                await updateItem('REMINDERS', id, updateData);
            } else {
                let result;
                if (isInterval) {
                    result = await scheduleIntervalReminderNotifications(itemData, user?.name || 'Friend');
                } else {
                    result = await scheduleReminderNotification(itemData, user?.name || 'Friend');
                }

                const saveData = { ...itemData };
                if (Array.isArray(result)) {
                    saveData.notifIds = result;
                    saveData.notifId = null;
                } else {
                    saveData.notifId = result;
                    saveData.notifIds = null;
                }
                await saveItem('REMINDERS', saveData);
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
            <Text style={styles.label}>Reminder Name</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Take medicine"
                placeholderTextColor={Colors.muted}
                value={taskName}
                onChangeText={setTaskName}
            />

            {/* Repeat Interval Toggle */}
            <View style={styles.toggleSectionHeader}>
                <Text style={styles.label}>Repeat Interval</Text>
                <Switch
                    value={isInterval}
                    onValueChange={setIsInterval}
                    trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                    thumbColor={isInterval ? Colors.secondary : Colors.muted}
                />
            </View>

            {!isInterval ? (
                <>
                    {/* Single Time Picker */}
                    <Text style={styles.label}>Remind at</Text>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
                        <MaterialCommunityIcons name="bell-outline" size={20} color={Colors.secondary} />
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

                    <Text style={styles.hintText}>
                        ℹ️ This reminder will repeat every day at this time
                    </Text>
                </>
            ) : (
                <>
                    {/* Interval Time Range */}
                    <Text style={styles.label}>From Time</Text>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowFromPicker(true)}>
                        <MaterialCommunityIcons name="clock-start" size={20} color={Colors.secondary} />
                        <Text style={styles.pickerText}>{formatTime(fromTime.toISOString())}</Text>
                    </TouchableOpacity>

                    {showFromPicker && (
                        <DateTimePicker
                            value={fromTime}
                            mode="time"
                            is24Hour={false}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, selected) => {
                                setShowFromPicker(Platform.OS === 'ios');
                                if (selected) setFromTime(selected);
                            }}
                            themeVariant="dark"
                        />
                    )}

                    <Text style={styles.label}>To Time</Text>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowToPicker(true)}>
                        <MaterialCommunityIcons name="clock-end" size={20} color={Colors.secondary} />
                        <Text style={styles.pickerText}>{formatTime(toTime.toISOString())}</Text>
                    </TouchableOpacity>

                    {showToPicker && (
                        <DateTimePicker
                            value={toTime}
                            mode="time"
                            is24Hour={false}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, selected) => {
                                setShowToPicker(Platform.OS === 'ios');
                                if (selected) setToTime(selected);
                            }}
                            themeVariant="dark"
                        />
                    )}

                    <Text style={styles.label}>Interval (minutes)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 30"
                        placeholderTextColor={Colors.muted}
                        value={intervalMinutes}
                        onChangeText={setIntervalMinutes}
                        keyboardType="number-pad"
                    />
                    <Text style={styles.hintText}>
                        ℹ️ Notifications will repeat at this interval between the times above
                    </Text>
                </>
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
                <Text style={styles.hintTextSmall}>
                    💡 A fresh motivational message each time!
                </Text>
            )}

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Reminder' : 'Add Reminder'}</Text>
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
        backgroundColor: Colors.secondary + '33',
        borderColor: Colors.secondary,
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
        backgroundColor: Colors.secondary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    saveBtnText: {
        color: Colors.bg,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    toggleSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        marginTop: Spacing.lg,
    },
});
