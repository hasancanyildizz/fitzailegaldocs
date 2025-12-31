import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Linking, Share, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CaretLeft, Clock, Timer, Coffee, Minus, Plus, SpeakerHigh, Shield, FileText, Target, Export, Trash } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING, LAYOUT } from '../constants/Theme';
import { useTimerStore } from '../store/timerStore';
import { useTaskStore } from '../store/taskStore';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const {
        focusDuration,
        shortBreakDuration,
        longBreakDuration,
        autoStartBreaks,
        autoStartPomodoros,
        soundEnabled,
        dailyGoal,
        setDuration,
        setDailyGoal,
    } = useTimerStore();

    const { tasks } = useTaskStore();
    const timerState = useTimerStore.getState();

    const adjustDailyGoal = (delta: number) => {
        hapticFeedback();
        const newGoal = Math.max(1, Math.min(20, dailyGoal + delta));
        setDailyGoal(newGoal);
    };

    const handleExportData = async () => {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                settings: {
                    focusDuration,
                    shortBreakDuration,
                    longBreakDuration,
                    dailyGoal,
                    autoStartBreaks,
                    autoStartPomodoros,
                    soundEnabled,
                },
                statistics: {
                    pomodorosCompleted: timerState.pomodorosCompleted,
                    dailyPomodoros: timerState.dailyPomodoros,
                    dailyHistory: timerState.dailyHistory,
                },
                tasks,
            };

            const jsonString = JSON.stringify(exportData, null, 2);

            if (Platform.OS === 'web') {
                navigator.clipboard.writeText(jsonString);
                Alert.alert('Exported', 'Data copied to clipboard!');
            } else {
                await Share.share({
                    message: jsonString,
                    title: 'FocusFlow Export',
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'Are you sure? This will reset all statistics, tasks, and settings to defaults. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        // Reset timer store
                        const today = new Date();
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                        useTimerStore.setState({
                            focusDuration: 25 * 60,
                            shortBreakDuration: 5 * 60,
                            longBreakDuration: 15 * 60,
                            autoStartBreaks: false,
                            autoStartPomodoros: false,
                            soundEnabled: true,
                            timeLeft: 25 * 60,
                            mode: 'focus',
                            status: 'idle',
                            pomodorosCompleted: 0,
                            dailyPomodoros: 0,
                            dailyGoal: 8,
                            lastActiveDate: todayStr,
                            dailyHistory: [],
                            timerStartedAt: null,
                        });
                        // Reset task store
                        useTaskStore.setState({
                            tasks: [],
                            selectedTaskId: null,
                        });
                        Alert.alert('Success', 'All data has been cleared.');
                    },
                },
            ]
        );
    };

    const hapticFeedback = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const adjustDuration = (mode: 'focus' | 'shortBreak' | 'longBreak', delta: number) => {
        hapticFeedback();
        const currentDuration = mode === 'focus'
            ? focusDuration
            : mode === 'shortBreak'
                ? shortBreakDuration
                : longBreakDuration;

        const newDuration = Math.max(60, Math.min(3600, currentDuration + delta));
        setDuration(mode, newDuration);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    const toggleAutoStartBreaks = () => {
        hapticFeedback();
        useTimerStore.setState({ autoStartBreaks: !autoStartBreaks });
    };

    const toggleAutoStartPomodoros = () => {
        hapticFeedback();
        useTimerStore.setState({ autoStartPomodoros: !autoStartPomodoros });
    };

    const toggleSound = () => {
        hapticFeedback();
        useTimerStore.setState({ soundEnabled: !soundEnabled });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <CaretLeft size={24} color={COLORS.text} weight="bold" />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Duration Settings */}
                <Text style={styles.sectionTitle}>Timer Durations</Text>

                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                                <Timer size={20} color={COLORS.primary} weight="fill" />
                            </View>
                            <Text style={styles.settingLabel}>Focus Duration</Text>
                        </View>
                        <View style={styles.durationControl}>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDuration('focus', -60)}
                            >
                                <Minus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                            <Text style={styles.durationText}>{formatDuration(focusDuration)}</Text>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDuration('focus', 60)}
                            >
                                <Plus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.secondary + '20' }]}>
                                <Coffee size={20} color={COLORS.secondary} weight="fill" />
                            </View>
                            <Text style={styles.settingLabel}>Short Break</Text>
                        </View>
                        <View style={styles.durationControl}>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDuration('shortBreak', -60)}
                            >
                                <Minus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                            <Text style={styles.durationText}>{formatDuration(shortBreakDuration)}</Text>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDuration('shortBreak', 60)}
                            >
                                <Plus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.textSecondary + '20' }]}>
                                <Clock size={20} color={COLORS.textSecondary} weight="fill" />
                            </View>
                            <Text style={styles.settingLabel}>Long Break</Text>
                        </View>
                        <View style={styles.durationControl}>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDuration('longBreak', -60)}
                            >
                                <Minus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                            <Text style={styles.durationText}>{formatDuration(longBreakDuration)}</Text>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDuration('longBreak', 60)}
                            >
                                <Plus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Daily Goal */}
                <Text style={styles.sectionTitle}>Daily Goal</Text>

                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFB800' + '20' }]}>
                                <Target size={20} color="#FFB800" weight="fill" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Pomodoros per Day</Text>
                                <Text style={styles.settingDescription}>
                                    Your daily focus goal
                                </Text>
                            </View>
                        </View>
                        <View style={styles.durationControl}>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDailyGoal(-1)}
                            >
                                <Minus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                            <Text style={styles.durationText}>{dailyGoal}</Text>
                            <TouchableOpacity
                                style={styles.adjustButton}
                                onPress={() => adjustDailyGoal(1)}
                            >
                                <Plus size={18} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Auto-start Settings */}
                <Text style={styles.sectionTitle}>Automation</Text>

                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Auto-start Breaks</Text>
                            <Text style={styles.settingDescription}>
                                Automatically start break after focus session
                            </Text>
                        </View>
                        <Switch
                            value={autoStartBreaks}
                            onValueChange={toggleAutoStartBreaks}
                            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '50' }}
                            thumbColor={autoStartBreaks ? COLORS.primary : COLORS.textSecondary}
                        />
                    </View>
                </View>

                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Auto-start Focus</Text>
                            <Text style={styles.settingDescription}>
                                Automatically start focus after break ends
                            </Text>
                        </View>
                        <Switch
                            value={autoStartPomodoros}
                            onValueChange={toggleAutoStartPomodoros}
                            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '50' }}
                            thumbColor={autoStartPomodoros ? COLORS.primary : COLORS.textSecondary}
                        />
                    </View>
                </View>

                {/* Sound Settings */}
                <Text style={styles.sectionTitle}>Sound</Text>

                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B' + '20' }]}>
                                <SpeakerHigh size={20} color="#FF6B6B" weight="fill" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Sound Effects</Text>
                                <Text style={styles.settingDescription}>
                                    Play sounds on timer completion
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={toggleSound}
                            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '50' }}
                            thumbColor={soundEnabled ? COLORS.primary : COLORS.textSecondary}
                        />
                    </View>
                </View>

                {/* App Info */}
                <Text style={styles.sectionTitle}>About</Text>

                <View style={styles.settingCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>1.0.0</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>App</Text>
                        <Text style={styles.infoValue}>FocusFlow</Text>
                    </View>
                </View>

                {/* Data Management */}
                <Text style={styles.sectionTitle}>Data</Text>

                <TouchableOpacity style={styles.exportCard} onPress={handleExportData}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                            <Export size={20} color={COLORS.primary} weight="fill" />
                        </View>
                        <View>
                            <Text style={styles.settingLabel}>Export Data</Text>
                            <Text style={styles.settingDescription}>
                                Export settings and statistics
                            </Text>
                        </View>
                    </View>
                    <Text style={{ color: COLORS.textSecondary }}>→</Text>
                </TouchableOpacity>

                {/* Danger Zone */}
                <Text style={styles.sectionTitle}>Danger Zone</Text>

                <TouchableOpacity style={styles.dangerCard} onPress={handleClearData}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FF4444' + '20' }]}>
                            <Trash size={20} color="#FF4444" weight="fill" />
                        </View>
                        <View>
                            <Text style={[styles.settingLabel, { color: '#FF4444' }]}>Clear All Data</Text>
                            <Text style={styles.settingDescription}>
                                Reset everything to defaults
                            </Text>
                        </View>
                    </View>
                    <Text style={{ color: COLORS.textSecondary }}>→</Text>
                </TouchableOpacity>

                {/* Legal */}
                <Text style={styles.sectionTitle}>Legal</Text>

                <TouchableOpacity
                    style={styles.settingCard}
                    onPress={() => Linking.openURL('https://hasancanyildizz.github.io/fitzailegaldocs/focusflow/privacy-policy.html')}
                >
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                                <Shield size={20} color={COLORS.primary} weight="fill" />
                            </View>
                            <Text style={styles.settingLabel}>Privacy Policy</Text>
                        </View>
                        <Text style={{ color: COLORS.textSecondary }}>→</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.settingCard}
                    onPress={() => Linking.openURL('https://hasancanyildizz.github.io/fitzailegaldocs/focusflow/terms-of-service.html')}
                >
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.secondary + '20' }]}>
                                <FileText size={20} color={COLORS.secondary} weight="fill" />
                            </View>
                            <Text style={styles.settingLabel}>Terms of Service</Text>
                        </View>
                        <Text style={{ color: COLORS.textSecondary }}>→</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: SPACING.xxl }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: FONTS.size.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.m,
    },
    sectionTitle: {
        fontSize: FONTS.size.m,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginTop: SPACING.l,
        marginBottom: SPACING.s,
        marginLeft: SPACING.xs,
    },
    settingCard: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        marginBottom: SPACING.s,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    settingLabel: {
        fontSize: FONTS.size.m,
        fontWeight: '600',
        color: COLORS.text,
    },
    settingDescription: {
        fontSize: FONTS.size.s,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    durationControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    adjustButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationText: {
        fontSize: FONTS.size.m,
        fontWeight: 'bold',
        color: COLORS.text,
        minWidth: 60,
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    infoLabel: {
        fontSize: FONTS.size.m,
        color: COLORS.textSecondary,
    },
    infoValue: {
        fontSize: FONTS.size.m,
        color: COLORS.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.surfaceLight,
        marginVertical: SPACING.s,
    },
    exportCard: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    dangerCard: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#FF4444' + '30',
    },
});
