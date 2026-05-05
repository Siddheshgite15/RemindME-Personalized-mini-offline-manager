import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Image, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { setUser } from '../utils/storage';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

export default function Onboarding() {
    const [name, setName] = useState('');
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleStart = async () => {
        if (!name.trim()) return;
        await setUser(name.trim());
        router.replace('/(tabs)/home');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.bgGlow} />

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.title}>Welcome to</Text>
                <Text style={styles.appName}>RemindMe</Text>
                <Text style={styles.subtitle}>Your personal motivation companion</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>What should we call you?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor={Colors.muted}
                        value={name}
                        onChangeText={setName}
                        maxLength={20}
                        autoFocus
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, !name.trim() && styles.buttonDisabled]}
                    onPress={handleStart}
                    disabled={!name.trim()}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Let's Go! 🚀</Text>
                </TouchableOpacity>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    bgGlow: {
        position: 'absolute',
        top: '20%',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.primary,
        opacity: 0.08,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: Spacing.lg,
        borderRadius: 24,
    },
    title: {
        fontSize: FontSize.xl,
        color: Colors.textSecondary,
        fontWeight: '300',
    },
    appName: {
        fontSize: FontSize.hero,
        color: Colors.text,
        fontWeight: '800',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.muted,
        marginBottom: Spacing.xxl,
    },
    inputContainer: {
        width: '100%',
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: '500',
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSize.lg,
        color: Colors.text,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        width: '100%',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
});
