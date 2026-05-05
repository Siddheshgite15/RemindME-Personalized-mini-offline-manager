import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
                headerTintColor: Colors.text,
                headerTitleStyle: { fontWeight: '700' },
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.cardBorder,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 6,
                    paddingTop: 6,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.muted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="daily"
                options={{
                    title: 'Daily',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="reminders"
                options={{
                    title: 'Reminders',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="bell-ring-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notes"
                options={{
                    title: 'Notes',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="notebook" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="timed"
                options={{
                    title: 'Timed',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="timer-sand" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
