import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CaretLeft, Timer, Fire, Target, CheckCircle, TrendUp } from 'phosphor-react-native';
import Svg, { Rect } from 'react-native-svg';
import { COLORS, FONTS, SPACING, LAYOUT } from '../constants/Theme';
import { useTimerStore } from '../store/timerStore';
import { useTaskStore } from '../store/taskStore';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
    const navigation = useNavigation();
    const { pomodorosCompleted, dailyPomodoros, focusDuration } = useTimerStore();
    const { tasks } = useTaskStore();

    // Calculate statistics
    const totalFocusMinutes = pomodorosCompleted * Math.floor(focusDuration / 60);
    const totalFocusHours = Math.floor(totalFocusMinutes / 60);
    const remainingMinutes = totalFocusMinutes % 60;

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const totalActualPomodoros = tasks.reduce((sum, t) => sum + t.pomodorosActual, 0);

    // Get real weekly data from store
    const { getWeeklyData } = useTimerStore();
    const weeklyData = getWeeklyData();

    // Week days labels (last 7 days ending today)
    const getWeekDayLabels = (): string[] => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const labels: string[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(days[date.getDay()]);
        }
        return labels;
    };

    const weekDays = getWeekDayLabels();
    const adjustedToday = 6; // Today is always the last item (index 6)

    const maxWeeklyPomodoros = Math.max(...weeklyData, 1);
    const barWidth = (width - SPACING.m * 4) / 7 - 8;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <CaretLeft size={24} color={COLORS.text} weight="bold" />
                </TouchableOpacity>
                <Text style={styles.title}>Statistics</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Today's Summary */}
                <Text style={styles.sectionTitle}>Today</Text>
                <View style={styles.todayCard}>
                    <View style={styles.todayMain}>
                        <Text style={styles.todayNumber}>{dailyPomodoros}</Text>
                        <Text style={styles.todayLabel}>Pomodoros</Text>
                    </View>
                    <View style={styles.todayDivider} />
                    <View style={styles.todayTime}>
                        <Text style={styles.todayTimeNumber}>
                            {dailyPomodoros * Math.floor(focusDuration / 60)}
                        </Text>
                        <Text style={styles.todayLabel}>Minutes focused</Text>
                    </View>
                </View>

                {/* Weekly Chart */}
                <Text style={styles.sectionTitle}>This Week</Text>
                <View style={styles.chartCard}>
                    <View style={styles.chartContainer}>
                        {weeklyData.map((value, index) => (
                            <View key={index} style={styles.barContainer}>
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: Math.max(4, (value / maxWeeklyPomodoros) * 100),
                                                backgroundColor: index === adjustedToday
                                                    ? COLORS.primary
                                                    : COLORS.surfaceLight,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.barLabel,
                                        index === adjustedToday && styles.barLabelActive,
                                    ]}
                                >
                                    {weekDays[index]}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Statistics Cards */}
                <Text style={styles.sectionTitle}>All Time</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
                            <Timer size={24} color={COLORS.primary} weight="fill" />
                        </View>
                        <Text style={styles.statNumber}>{pomodorosCompleted}</Text>
                        <Text style={styles.statLabel}>Total Pomodoros</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                            <Fire size={24} color={COLORS.secondary} weight="fill" />
                        </View>
                        <Text style={styles.statNumber}>
                            {totalFocusHours > 0 ? `${totalFocusHours}h ${remainingMinutes}m` : `${totalFocusMinutes}m`}
                        </Text>
                        <Text style={styles.statLabel}>Focus Time</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFB800' + '20' }]}>
                            <CheckCircle size={24} color="#FFB800" weight="fill" />
                        </View>
                        <Text style={styles.statNumber}>{completedTasks}</Text>
                        <Text style={styles.statLabel}>Tasks Done</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#00D4FF' + '20' }]}>
                            <Target size={24} color="#00D4FF" weight="fill" />
                        </View>
                        <Text style={styles.statNumber}>{totalActualPomodoros}</Text>
                        <Text style={styles.statLabel}>Task Pomodoros</Text>
                    </View>
                </View>

                {/* Productivity Insight */}
                <Text style={styles.sectionTitle}>Insight</Text>
                <View style={styles.insightCard}>
                    <TrendUp size={24} color={COLORS.primary} weight="bold" />
                    <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>
                            {pomodorosCompleted === 0
                                ? 'Ready to Start!'
                                : pomodorosCompleted < 10
                                    ? 'Great Beginning!'
                                    : pomodorosCompleted < 50
                                        ? 'Building Momentum!'
                                        : 'Focus Master!'}
                        </Text>
                        <Text style={styles.insightDescription}>
                            {pomodorosCompleted === 0
                                ? 'Complete your first pomodoro to begin tracking your progress.'
                                : `You've completed ${pomodorosCompleted} pomodoros. Keep up the great work!`}
                        </Text>
                    </View>
                </View>

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
    todayCard: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.l,
        padding: SPACING.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    todayMain: {
        alignItems: 'center',
        flex: 1,
    },
    todayNumber: {
        fontSize: FONTS.size.xxxl,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    todayLabel: {
        fontSize: FONTS.size.s,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    todayDivider: {
        width: 1,
        height: 60,
        backgroundColor: COLORS.surfaceLight,
    },
    todayTime: {
        alignItems: 'center',
        flex: 1,
    },
    todayTimeNumber: {
        fontSize: FONTS.size.xxxl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    chartCard: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.l,
        padding: SPACING.l,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 140,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        height: 100,
        justifyContent: 'flex-end',
    },
    bar: {
        width: 24,
        borderRadius: 12,
        minHeight: 4,
    },
    barLabel: {
        fontSize: FONTS.size.s,
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
    },
    barLabelActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
    },
    statCard: {
        width: (width - SPACING.m * 3 - SPACING.s) / 2,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.s,
    },
    statNumber: {
        fontSize: FONTS.size.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: FONTS.size.s,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    insightCard: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.m,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: FONTS.size.m,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    insightDescription: {
        fontSize: FONTS.size.s,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
});
