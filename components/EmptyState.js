import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function EmptyState({ icon = 'clipboard-text-outline', message = 'No items yet' }) {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons name={icon} size={64} color={Colors.muted} style={{ opacity: 0.5 }} />
            <Text style={styles.text}>{message}</Text>
            <Text style={styles.hint}>Tap + to add your first one</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
        gap: Spacing.sm,
    },
    text: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginTop: Spacing.md,
    },
    hint: {
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
});
