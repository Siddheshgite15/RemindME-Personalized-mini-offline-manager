import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    FlatList, Alert, Platform, Keyboard,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getItems, saveItem, updateItem, deleteItem } from '../../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function NotesScreen() {
    const [notes, setNotes] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [contentText, setContentText] = useState('');
    const scrollViewRef = useRef(null);

    const loadNotes = async () => {
        const data = await getItems('NOTES');
        setNotes(data);
        if (data.length > 0 && !activeNoteId) {
            setActiveNoteId(data[0].id);
            setContentText(data[0].content || '');
        }
    };

    useFocusEffect(useCallback(() => { loadNotes(); }, []));

    const activeNote = notes.find(n => n.id === activeNoteId);

    const handleSelectNote = (noteId) => {
        // Save current note content
        if (activeNoteId) {
            const currentNote = notes.find(n => n.id === activeNoteId);
            if (currentNote && currentNote.content !== contentText) {
                updateItem('NOTES', activeNoteId, {
                    content: contentText,
                    updatedAt: new Date().toISOString(),
                });
                setNotes(prev => prev.map(n => 
                    n.id === activeNoteId ? { ...n, content: contentText, updatedAt: new Date().toISOString() } : n
                ));
            }
        }

        // Load new note
        const note = notes.find(n => n.id === noteId);
        if (note) {
            setActiveNoteId(noteId);
            setContentText(note.content || '');
        }
    };

    const handleAddNote = async () => {
        const newNoteName = `Note ${notes.length + 1}`;
        const newNote = {
            name: newNoteName,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await saveItem('NOTES', newNote);
        loadNotes();
    };

    const handleRenameNote = (noteId) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        Alert.prompt(
            'Rename Note',
            'Enter new name for this note:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Rename',
                    onPress: async (newName) => {
                        if (newName && newName.trim()) {
                            await updateItem('NOTES', noteId, { name: newName.trim() });
                            loadNotes();
                        }
                    },
                },
            ],
            'plain-text',
            note.name
        );
    };

    const handleDeleteNote = (noteId) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteItem('NOTES', noteId);
                        if (activeNoteId === noteId) {
                            setActiveNoteId(null);
                            setContentText('');
                        }
                        loadNotes();
                    },
                },
            ]
        );
    };

    const handleSaveContent = async () => {
        if (activeNoteId && activeNote && activeNote.content !== contentText) {
            await updateItem('NOTES', activeNoteId, {
                content: contentText,
                updatedAt: new Date().toISOString(),
            });
            setNotes(prev => prev.map(n =>
                n.id === activeNoteId ? { ...n, content: contentText, updatedAt: new Date().toISOString() } : n
            ));
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📝 Notes</Text>
                <Text style={styles.headerCount}>{notes.length} note{notes.length !== 1 ? 's' : ''}</Text>
            </View>

            {notes.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <MaterialCommunityIcons name="note-outline" size={48} color={Colors.muted} />
                    <Text style={styles.emptyStateText}>No notes yet</Text>
                    <Text style={styles.emptyStateSubtext}>Tap the + button to create your first note</Text>
                    <TouchableOpacity style={styles.addFirstBtn} onPress={handleAddNote}>
                        <MaterialCommunityIcons name="plus" size={24} color={Colors.bg} />
                        <Text style={styles.addFirstBtnText}>Add Note</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Tab Bar */}
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabBarContainer}
                        contentContainerStyle={styles.tabBarContent}
                    >
                        {notes.map((note) => (
                            <TouchableOpacity
                                key={note.id}
                                style={[
                                    styles.tab,
                                    activeNoteId === note.id && styles.tabActive,
                                ]}
                                onPress={() => handleSelectNote(note.id)}
                                onLongPress={() => handleRenameNote(note.id)}
                                delayLongPress={500}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeNoteId === note.id && styles.tabTextActive,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {note.name}
                                </Text>
                                {activeNoteId === note.id && (
                                    <TouchableOpacity
                                        style={styles.tabCloseBtn}
                                        onPress={() => handleDeleteNote(note.id)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MaterialCommunityIcons name="close" size={16} color={Colors.bg} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Add Note Button */}
                        <TouchableOpacity style={styles.tabAdd} onPress={handleAddNote}>
                            <MaterialCommunityIcons name="plus" size={20} color={Colors.secondary} />
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Note Editor */}
                    {activeNote && (
                        <View style={styles.editorContainer}>
                            <TextInput
                                style={styles.editor}
                                placeholder="Start typing your note here..."
                                placeholderTextColor={Colors.muted}
                                value={contentText}
                                onChangeText={setContentText}
                                onBlur={handleSaveContent}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    )}
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
    header: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerTitle: {
        fontSize: FontSize.xl,
        color: Colors.text,
        fontWeight: '700',
    },
    headerCount: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    tabBarContainer: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tabBarContent: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.xs,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
        minWidth: 80,
        maxWidth: 150,
    },
    tabActive: {
        backgroundColor: Colors.secondary,
        borderColor: Colors.secondary,
    },
    tabText: {
        fontSize: FontSize.sm,
        color: Colors.muted,
        fontWeight: '600',
        flex: 1,
    },
    tabTextActive: {
        color: Colors.bg,
    },
    tabCloseBtn: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
    },
    tabAdd: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.secondary + '22',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.secondary + '33',
    },
    editorContainer: {
        flex: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    editor: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.text,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    emptyStateText: {
        fontSize: FontSize.lg,
        color: Colors.text,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
    emptyStateSubtext: {
        fontSize: FontSize.sm,
        color: Colors.muted,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    addFirstBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.secondary,
        borderRadius: BorderRadius.full,
    },
    addFirstBtnText: {
        color: Colors.bg,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
});
