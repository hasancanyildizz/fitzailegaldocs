import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, LAYOUT } from '../constants/Theme';
import { useTimerStore, TimerMode } from '../store/timerStore';
import { useTaskStore } from '../store/taskStore';
import { Play, Pause, ArrowClockwise, FastForward, ListChecks, X, Gear, ChartBar } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import TaskList from '../components/TaskList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { registerForPushNotificationsAsync, sendTimerCompleteNotification } from '../services/notificationService';
import { loadSounds, playSound } from '../services/soundService';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const VIEWBOX_SIZE = 100;
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Animated Circle Component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timer'>;

export default function TimerScreen() {
    const navigation = useNavigation<NavigationProp>();
    const {
        timeLeft,
        mode,
        status,
        startTimer,
        pauseTimer,
        resetTimer,
        skip,
        tick,
        focusDuration,
        shortBreakDuration,
        longBreakDuration,
        soundEnabled,
        checkDailyReset // Destructure checkDailyReset
    } = useTimerStore();

    const { tasks, selectedTaskId, selectTask, incrementActual } = useTaskStore();
    const activeTask = tasks.find(t => t.id === selectedTaskId);

    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const prevModeRef = useRef<TimerMode>(mode);

    const totalDuration = mode === 'focus' ? focusDuration : mode === 'shortBreak' ? shortBreakDuration : longBreakDuration;
    const progress = useSharedValue(0);

    // Initialize notifications and SOUNDS
    useEffect(() => {
        loadSounds(); // Preload sounds
        checkDailyReset(); // Check for daily reset on mount
        if (Platform.OS !== 'web') {
            registerForPushNotificationsAsync();
        }
    }, []);

    // ... (sound effect hooks remain the same) ...

    // Sync Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'running') {
            interval = setInterval(() => {
                tick();
                // Optional: Play tick sound? Maybe too annoying. 
                // playSound('tick'); 
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, tick]);

    // Handle Timer Finish (Increment Task)
    const { pomodorosCompleted } = useTimerStore();
    const prevPomodorosRef = useRef(pomodorosCompleted);

    useEffect(() => {
        // Only increment if pomodorosCompleted INCREASED
        if (pomodorosCompleted > prevPomodorosRef.current && selectedTaskId) {
            incrementActual(selectedTaskId);
        }
        prevPomodorosRef.current = pomodorosCompleted;
    }, [pomodorosCompleted, selectedTaskId]);


    // Update Animation Progress
    useEffect(() => {
        const p = Math.max(0, timeLeft / totalDuration);
        progress.value = withTiming(p, { duration: 1000 });
    }, [timeLeft, totalDuration]);

    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);
        return {
            strokeDashoffset,
        };
    });

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (soundEnabled) playSound('tick');
        if (status === 'running') {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (soundEnabled) playSound('tick');
        resetTimer();
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (soundEnabled) playSound('tick');
        skip();
    };

    const getModeColor = () => {
        if (mode === 'focus') return COLORS.primary;
        if (mode === 'shortBreak') return COLORS.secondary;
        return COLORS.textSecondary;
    };

    const getModeLabel = () => {
        if (mode === 'focus') return 'FOCUS';
        if (mode === 'shortBreak') return 'SHORT BREAK';
        return 'LONG BREAK';
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with nav buttons */}
            <View style={styles.topNav}>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('Statistics')}
                >
                    <ChartBar size={22} color={COLORS.textSecondary} weight="bold" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Gear size={22} color={COLORS.textSecondary} weight="bold" />
                </TouchableOpacity>
            </View>

            {/* Active Task Selector */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.taskSelector}
                    onPress={() => setIsTaskModalVisible(true)}
                >
                    <ListChecks size={24} color={COLORS.textSecondary} />
                    <Text style={styles.activeTaskText} numberOfLines={1}>
                        {activeTask ? activeTask.title : 'Select a task to focus on'}
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.modeLabel, { color: getModeColor() }]}>{getModeLabel()}</Text>

            <View style={styles.timerContainer}>
                <Svg
                    width={CIRCLE_SIZE}
                    height={CIRCLE_SIZE}
                    viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                >
                    {/* Background Circle */}
                    <Circle
                        cx={VIEWBOX_SIZE / 2}
                        cy={VIEWBOX_SIZE / 2}
                        r={RADIUS}
                        stroke={COLORS.surfaceLight}
                        strokeWidth="4"
                        fill="none"
                    />
                    {/* Progress Circle */}
                    <AnimatedCircle
                        cx={VIEWBOX_SIZE / 2}
                        cy={VIEWBOX_SIZE / 2}
                        r={RADIUS}
                        stroke={getModeColor()}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={CIRCUMFERENCE}
                        animatedProps={animatedProps}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${VIEWBOX_SIZE / 2}, ${VIEWBOX_SIZE / 2}`}
                    />
                </Svg>

                <View style={styles.timeDisplay}>
                    <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
                    <ArrowClockwise size={24} color={COLORS.text} weight="bold" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: getModeColor() }]}
                    onPress={handleToggle}
                >
                    {status === 'running' ? (
                        <Pause size={32} color={COLORS.background} weight="fill" />
                    ) : (
                        <Play size={32} color={COLORS.background} weight="fill" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
                    <FastForward size={24} color={COLORS.text} weight="bold" />
                </TouchableOpacity>
            </View>

            {/* Task List Modal */}
            <Modal
                visible={isTaskModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Tasks</Text>
                        <TouchableOpacity onPress={() => setIsTaskModalVisible(false)} style={styles.closeButton}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                    <TaskList />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    topNav: {
        position: 'absolute',
        top: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        zIndex: 20,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        position: 'absolute',
        top: 70,
        width: '100%',
        alignItems: 'center',
        zIndex: 10,
    },
    taskSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        borderRadius: LAYOUT.borderRadius.circle,
        gap: SPACING.s,
        maxWidth: '80%',
    },
    activeTaskText: {
        color: COLORS.text,
        fontSize: FONTS.size.m,
        fontWeight: '600',
    },
    modeLabel: {
        fontSize: FONTS.size.xl,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: SPACING.xxl,
        marginTop: 40,
    },
    timerContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeDisplay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        color: COLORS.text,
        fontSize: FONTS.size.mega,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xxl * 1.5,
        gap: SPACING.xl,
    },
    primaryButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    secondaryButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.m,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: FONTS.size.xl,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: SPACING.s,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 20,
    },
});
