import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

const SAVED_MESSAGES_KEY = '@remindme_saved_messages';

async function getSavedMessages() {
    try {
        const json = await AsyncStorage.getItem(SAVED_MESSAGES_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
}

async function addSavedMessage(msg) {
    const msgs = await getSavedMessages();
    const trimmed = msg.trim();
    if (!trimmed || msgs.includes(trimmed)) return msgs;
    msgs.unshift(trimmed); // newest first
    if (msgs.length > 20) msgs.pop(); // cap at 20
    await AsyncStorage.setItem(SAVED_MESSAGES_KEY, JSON.stringify(msgs));
    return msgs;
}

async function deleteSavedMessage(msg) {
    let msgs = await getSavedMessages();
    msgs = msgs.filter(m => m !== msg);
    await AsyncStorage.setItem(SAVED_MESSAGES_KEY, JSON.stringify(msgs));
    return msgs;
}

/**
 * SavedMessagesDropdown — A reusable component for custom message forms.
 * 
 * Props:
 *   currentMsg: string — current custom message text
 *   onSelectMessage: (msg) => void — called when user taps a saved message
 *   onSaveMessage: optional — if provided, overrides the default save behavior
 */
export default function SavedMessagesDropdown({ currentMsg, onSelectMessage }) {
    const [savedMessages, setSavedMessages] = useState([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        const msgs = await getSavedMessages();
        setSavedMessages(msgs);
    };

    const handleSave = async () => {
        if (!currentMsg || !currentMsg.trim()) {
            Alert.alert('Empty Message', 'Type a message first before saving.');
            return;
        }
        const msgs = await addSavedMessage(currentMsg);
        setSavedMessages(msgs);
        Alert.alert('✅ Saved!', 'Your message has been saved for quick reuse.');
    };

    const handleDelete = (msg) => {
        Alert.alert(
            'Delete Saved Message',
            `Remove "${msg.substring(0, 40)}${msg.length > 40 ? '...' : ''}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        const msgs = await deleteSavedMessage(msg);
                        setSavedMessages(msgs);
                    }
                },
            ]
        );
    };

    if (savedMessages.length === 0 && !currentMsg?.trim()) {
        return (
            <View style={styles.emptyHint}>
                <MaterialCommunityIcons name="content-save-outline" size={14} color={Colors.muted} />
                <Text style={styles.emptyHintText}>
                    Type a message and save it for quick reuse later!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Save current message button */}
            {currentMsg?.trim() ? (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="content-save-plus" size={16} color={Colors.text} />
                    <Text style={styles.saveBtnText}>Save this message</Text>
                </TouchableOpacity>
            ) : null}

            {/* Saved messages chips */}
            {savedMessages.length > 0 && (
                <>
                    <TouchableOpacity
                        style={styles.headerRow}
                        onPress={() => setExpanded(!expanded)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="history"
                            size={14}
                            color={Colors.textSecondary}
                        />
                        <Text style={styles.headerText}>
                            Saved Messages ({savedMessages.length})
                        </Text>
                        <MaterialCommunityIcons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={Colors.textSecondary}
                        />
                    </TouchableOpacity>

                    {expanded && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.chipScroll}
                            contentContainerStyle={styles.chipContainer}
                        >
                            {savedMessages.map((msg, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.chip,
                                        currentMsg === msg && styles.chipActive,
                                    ]}
                                    onPress={() => onSelectMessage(msg)}
                                    onLongPress={() => handleDelete(msg)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            currentMsg === msg && styles.chipTextActive,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {msg.length > 30 ? msg.substring(0, 30) + '…' : msg}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {expanded && (
                        <Text style={styles.longPressHint}>
                            💡 Tap to use • Long-press to delete
                        </Text>
                    )}
                </>
            )}
        </View>
    );
}

// ─── Auto-save helper for use in form handleSave ───
export async function autoSaveCustomMessage(messageType, customMsg) {
    if (messageType === 'custom' && customMsg?.trim()) {
        await addSavedMessage(customMsg);
    }
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.sm,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.sm,
    },
    saveBtnText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    emptyHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.sm,
    },
    emptyHintText: {
        fontSize: FontSize.xs,
        color: Colors.muted,
        fontStyle: 'italic',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    headerText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: '600',
        flex: 1,
    },
    chipScroll: {
        marginTop: Spacing.xs,
    },
    chipContainer: {
        gap: Spacing.sm,
        paddingRight: Spacing.md,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        maxWidth: 200,
    },
    chipActive: {
        backgroundColor: Colors.primary + '33',
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    chipTextActive: {
        color: Colors.text,
        fontWeight: '600',
    },
    longPressHint: {
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
});
