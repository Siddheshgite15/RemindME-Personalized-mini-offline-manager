import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, BorderRadius, Spacing } from '../constants/theme';

export default function ScheduleChip({ name, color, small = false }) {
    return (
        <View style={[styles.chip, { backgroundColor: color + '22', borderColor: color + '55' }, small && styles.chipSmall]}>
            <View style={[styles.dot, { backgroundColor: color }, small && styles.dotSmall]} />
            <Text style={[styles.text, { color }, small && styles.textSmall]} numberOfLines={1}>
                {name}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    chipSmall: {
        paddingHorizontal: Spacing.xs + 2,
        paddingVertical: 3,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    text: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    textSmall: {
        fontSize: FontSize.xs,
    },
});
