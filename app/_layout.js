import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getUser } from '../utils/storage';
import { setupNotifications } from '../utils/notifications';
import { Colors } from '../constants/theme';

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const [hasUser, setHasUser] = useState(false);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        async function init() {
            const user = await getUser();
            setHasUser(!!user);
            await setupNotifications();
            setIsReady(true);
        }
        init();
    }, []);

    // Re-check user status when segments change (e.g., after onboarding completes and navigates)
    useEffect(() => {
        if (!isReady) return;
        (async () => {
            const user = await getUser();
            setHasUser(!!user);
        })();
    }, [segments]);

    useEffect(() => {
        if (!isReady) return;
        const inTabs = segments[0] === '(tabs)';

        if (!hasUser && inTabs) {
            router.replace('/onboarding');
        } else if (hasUser && !inTabs && segments[0] !== 'daily' && segments[0] !== 'reminder' && segments[0] !== 'timed') {
            router.replace('/(tabs)/home');
        }
    }, [isReady, hasUser, segments]);

    if (!isReady) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <StatusBar style="light" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: Colors.bg },
                    headerTintColor: Colors.text,
                    headerTitleStyle: { fontWeight: '600' },
                    contentStyle: { backgroundColor: Colors.bg },
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="daily/form"
                    options={{ title: 'Daily Task', presentation: 'modal' }}
                />
                <Stack.Screen
                    name="daily/manage"
                    options={{ title: 'Manage Daily', presentation: 'modal' }}
                />
                <Stack.Screen
                    name="daily/schedule-form"
                    options={{ title: 'Schedule', presentation: 'modal' }}
                />
                <Stack.Screen
                    name="reminder/form"
                    options={{ title: 'Reminder', presentation: 'modal' }}
                />
                <Stack.Screen
                    name="timed/form"
                    options={{ title: 'Timed Task', presentation: 'modal' }}
                />
            </Stack>
        </>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.bg,
    },
});
