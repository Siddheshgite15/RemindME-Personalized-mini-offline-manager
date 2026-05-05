import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, DayLabels } from '../constants/theme';

export default function DaySelector({ selectedDays = [], onToggle, scheduleColor, dayScheduleMap = {} }) {
    return (
        <View style={styles.container}>
            {DayLabels.map((label, index) => {
                const isSelected = selectedDays.includes(index);
                const otherSchedule = dayScheduleMap[index];
                const otherColor = otherSchedule?.color;

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.dayCircle,
                            isSelected && { backgroundColor: scheduleColor, borderColor: scheduleColor },
                            !isSelected && otherColor && { borderColor: otherColor + '66', backgroundColor: otherColor + '15' },
                        ]}
                        onPress={() => onToggle(index, otherSchedule)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.dayText,
                                isSelected && styles.dayTextSelected,
                                !isSelected && otherColor && { color: otherColor + 'AA' },
                            ]}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.xs,
    },
    dayCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    dayText: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.muted,
    },
    dayTextSelected: {
        color: '#fff',
    },
});
