import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { COLORS, FONTS, SPACING, LAYOUT } from '../constants/Theme';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'info' | 'warning';
    onHide: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'success',
    onHide,
    duration = 2000,
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -50,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => onHide());
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration]);

    if (!visible) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return COLORS.primary;
            case 'warning':
                return '#FFB800';
            case 'info':
            default:
                return COLORS.surface;
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: getBackgroundColor(),
                },
            ]}
        >
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: SPACING.m,
        right: SPACING.m,
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: LAYOUT.borderRadius.m,
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    message: {
        color: COLORS.background,
        fontSize: FONTS.size.m,
        fontWeight: '600',
        textAlign: 'center',
    },
});
