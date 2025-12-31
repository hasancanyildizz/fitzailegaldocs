import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants/Theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const checkScale = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const taglineOpacity = useSharedValue(0);
    const streakOpacity = useSharedValue(0);

    useEffect(() => {
        // Logo circle appears
        logoScale.value = withSequence(
            withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(2)) }),
            withTiming(1, { duration: 200 })
        );
        logoOpacity.value = withTiming(1, { duration: 400 });

        // Checkmark animates in
        checkScale.value = withDelay(
            400,
            withSequence(
                withTiming(1.3, { duration: 200, easing: Easing.out(Easing.back(3)) }),
                withTiming(1, { duration: 150 })
            )
        );

        // Text fades in and slides up
        textOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
        textTranslateY.value = withDelay(500, withTiming(0, { duration: 500 }));

        // Tagline appears
        taglineOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

        // Streak effect
        streakOpacity.value = withDelay(
            900,
            withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 1000 }),
                    withTiming(0.3, { duration: 1000 })
                ),
                -1,
                true
            )
        );
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const checkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const taglineAnimatedStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
    }));

    const streakAnimatedStyle = useAnimatedStyle(() => ({
        opacity: streakOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Background glow */}
            <View style={styles.backgroundGlow} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                {/* Streak flames */}
                <Animated.View style={[styles.streakContainer, streakAnimatedStyle]}>
                    <View style={[styles.flame, styles.flame1]} />
                    <View style={[styles.flame, styles.flame2]} />
                    <View style={[styles.flame, styles.flame3]} />
                </Animated.View>

                <View style={styles.logoCircle}>
                    <Animated.View style={[styles.checkmarkContainer, checkAnimatedStyle]}>
                        <View style={styles.checkmarkLine1} />
                        <View style={styles.checkmarkLine2} />
                    </Animated.View>
                </View>
            </Animated.View>

            {/* App Name */}
            <Animated.View style={textAnimatedStyle}>
                <Text style={styles.appName}>Habit Tracker</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={taglineAnimatedStyle}>
                <Text style={styles.tagline}>Build better habits, one day at a time.</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundGlow: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: COLORS.primary,
        opacity: 0.05,
    },
    logoContainer: {
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakContainer: {
        position: 'absolute',
        top: -20,
        flexDirection: 'row',
        gap: 4,
    },
    flame: {
        width: 8,
        height: 16,
        borderRadius: 4,
        backgroundColor: '#FF6B35',
    },
    flame1: {
        height: 12,
        transform: [{ rotate: '-15deg' }],
    },
    flame2: {
        height: 18,
        backgroundColor: COLORS.primary,
    },
    flame3: {
        height: 12,
        transform: [{ rotate: '15deg' }],
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    checkmarkContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkLine1: {
        position: 'absolute',
        width: 4,
        height: 20,
        backgroundColor: COLORS.background,
        borderRadius: 2,
        left: 12,
        bottom: 8,
        transform: [{ rotate: '-45deg' }],
    },
    checkmarkLine2: {
        position: 'absolute',
        width: 4,
        height: 35,
        backgroundColor: COLORS.background,
        borderRadius: 2,
        right: 8,
        bottom: 5,
        transform: [{ rotate: '45deg' }],
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
