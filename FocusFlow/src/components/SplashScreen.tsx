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
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const pulseScale = useSharedValue(1);
    const taglineOpacity = useSharedValue(0);

    useEffect(() => {
        // Logo appears with bounce
        logoScale.value = withSequence(
            withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(2)) }),
            withTiming(1, { duration: 200 })
        );
        logoOpacity.value = withTiming(1, { duration: 400 });

        // Text fades in and slides up
        textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
        textTranslateY.value = withDelay(300, withTiming(0, { duration: 500 }));

        // Tagline appears
        taglineOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

        // Pulse animation for the circle
        pulseScale.value = withDelay(
            800,
            withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            )
        );
    }, []);

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const pulseAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const taglineAnimatedStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
    }));

    return (
        <View style={styles.container}>
            {/* Background gradient effect */}
            <View style={styles.backgroundGlow} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                <Animated.View style={[styles.pulseCircle, pulseAnimatedStyle]} />
                <View style={styles.logoCircle}>
                    <View style={styles.timerIcon}>
                        <View style={styles.timerHand} />
                        <View style={styles.timerCenter} />
                    </View>
                </View>
            </Animated.View>

            {/* App Name */}
            <Animated.View style={textAnimatedStyle}>
                <Text style={styles.appName}>FocusFlow</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={taglineAnimatedStyle}>
                <Text style={styles.tagline}>Stay focused. Get things done.</Text>
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
    pulseCircle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: COLORS.primary,
        opacity: 0.3,
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
    timerIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerHand: {
        position: 'absolute',
        width: 3,
        height: 20,
        backgroundColor: COLORS.background,
        borderRadius: 2,
        top: 8,
        transform: [{ rotate: '45deg' }],
    },
    timerCenter: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.background,
    },
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.text,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
});
