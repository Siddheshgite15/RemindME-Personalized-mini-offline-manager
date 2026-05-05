import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Image, Animated, RefreshControl, Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUser, getItems, getSchedulesForDay, getTasksForSchedule } from '../../utils/storage';
import { getGreeting, getMotivationalMessage, getDaysRemaining } from '../../utils/helpers';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUserState] = useState(null);
    const [counts, setCounts] = useState({ daily: 0, reminders: 0, timed: 0, notes: 0, nextDeadline: null, scheduleName: null });
    const [quote, setQuote] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const loadData = async () => {
        const u = await getUser();
        setUserState(u);

        const daily = await getItems('DAILY');
        const reminders = await getItems('REMINDERS');
        const timed = await getItems('TIMED');
        const notes = await getItems('NOTES');

        // Get today's schedule info
        const todayIndex = new Date().getDay();
        const todaySchedules = await getSchedulesForDay(todayIndex);
        let todayTaskCount = daily.length;
        let scheduleName = null;
        if (todaySchedules.length > 0) {
            const todaySched = todaySchedules[0];
            scheduleName = todaySched.name;
            const schedTasks = await getTasksForSchedule(todaySched.id);
            todayTaskCount = schedTasks.length;
        }

        // Find nearest deadline
        let nextDeadline = null;
        const activeTimed = timed.filter(t => !t.done);
        if (activeTimed.length > 0) {
            activeTimed.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
            const daysLeft = getDaysRemaining(activeTimed[0].endDate);
            nextDeadline = { name: activeTimed[0].taskName, daysLeft };
        }

        setCounts({
            daily: todayTaskCount,
            reminders: reminders.filter(r => r.isActive).length,
            timed: activeTimed.length,
            notes: notes.length,
            nextDeadline,
            scheduleName,
        });

        setQuote(getMotivationalMessage(u?.name || 'Friend', 'your goals'));
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const openLinkedIn = async () => {
        const linkedinUrl = 'https://www.linkedin.com/in/siddhesh-gite-9a7861289/';
        try {
            await Linking.openURL(linkedinUrl);
        } catch (error) {
            console.error('Failed to open URL:', error);
        }
    };

    const SummaryCard = ({ icon, iconColor, label, count, subtitle, onPress }) => (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.cardIcon, { backgroundColor: iconColor + '18' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{label}</Text>
                {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
            </View>
            <Text style={[styles.cardCount, { color: iconColor }]}>{count}</Text>
        </TouchableOpacity>
    );

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Glow effect */}
                <View style={styles.glow} />

                {/* Header */}
                <View style={styles.header}>
                    <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                    <View>
                        <Text style={styles.greeting}>{getGreeting(user?.name)}</Text>
                        <Text style={styles.todayText}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                </View>

                {/* Motivational Quote */}
                <View style={styles.quoteCard}>
                    <MaterialCommunityIcons name="format-quote-open" size={20} color={Colors.primary} style={{ opacity: 0.6 }} />
                    <Text style={styles.quoteText}>{quote}</Text>
                </View>

                {/* Summary Cards */}
                <Text style={styles.sectionTitle}>Your Tasks</Text>

                <SummaryCard
                    icon="calendar-clock"
                    iconColor={Colors.primary}
                    label="Daily Schedules"
                    count={counts.daily}
                    subtitle={counts.scheduleName ? `Today: ${counts.scheduleName}` : 'No schedule for today'}
                    onPress={() => router.push('/(tabs)/daily')}
                />

                <SummaryCard
                    icon="bell-ring-outline"
                    iconColor={Colors.secondary}
                    label="Active Reminders"
                    count={counts.reminders}
                    subtitle="Ongoing notifications"
                    onPress={() => router.push('/(tabs)/reminders')}
                />

                <SummaryCard
                    icon="timer-sand"
                    iconColor={Colors.accent}
                    label="Timed Tasks"
                    count={counts.timed}
                    subtitle={
                        counts.nextDeadline
                            ? `Next: ${counts.nextDeadline.name} (${counts.nextDeadline.daysLeft}d)`
                            : 'No active deadlines'
                    }
                    onPress={() => router.push('/(tabs)/timed')}
                />

                <SummaryCard
                    icon="notebook"
                    iconColor={Colors.primary}
                    label="Your Notes"
                    count={counts.notes}
                    subtitle={counts.notes === 1 ? '1 note saved' : `${counts.notes} notes saved`}
                    onPress={() => router.push('/(tabs)/notes')}
                />

                <TouchableOpacity onPress={openLinkedIn} activeOpacity={0.7}>
                    <Text style={styles.developerCredit}>Developed by SG_Dev</Text>
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    scroll: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    glow: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.primary,
        opacity: 0.06,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
        marginTop: Spacing.sm,
    },
    logo: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
    greeting: {
        fontSize: FontSize.xl,
        color: Colors.text,
        fontWeight: '700',
    },
    todayText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    quoteCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        gap: Spacing.xs,
    },
    quoteText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        color: Colors.text,
        fontWeight: '700',
        marginBottom: Spacing.md,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: FontSize.md,
        color: Colors.text,
        fontWeight: '600',
    },
    cardSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.muted,
        marginTop: 2,
    },
    cardCount: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
    },
    developerCredit: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        textAlign: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
        textDecorationLine: 'underline',
    },
});
