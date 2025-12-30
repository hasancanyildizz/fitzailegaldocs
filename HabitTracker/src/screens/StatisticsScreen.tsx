import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONTS, LAYOUT } from '../constants/Theme';
import { useHabitContext } from '../context/HabitContext';
import { getWeekDates, getDayName, isToday } from '../utils/dateUtils';

export default function StatisticsScreen() {
  const navigation = useNavigation();
  const { habits, checkIns, userProgress, getHabitsWithStatus } = useHabitContext();

  const habitsWithStatus = getHabitsWithStatus();
  const weekDates = getWeekDates();

  // Calculate overall stats
  const totalHabits = habits.length;
  const totalCheckIns = checkIns.length;
  const averageStreak = habitsWithStatus.length > 0
    ? Math.round(habitsWithStatus.reduce((sum, h) => sum + h.streak, 0) / habitsWithStatus.length)
    : 0;
  const longestStreak = habitsWithStatus.length > 0
    ? Math.max(...habitsWithStatus.map(h => h.stats.longestStreak))
    : 0;

  // Check if habit was completed on a specific date
  const isCompletedOnDate = (habitId: string, date: string) => {
    return checkIns.some(c => c.habitId === habitId && c.date === date);
  };

  // Calculate completion rate for the week
  const weeklyCompletions = weekDates.reduce((count, date) => {
    const completedOnDate = habits.filter(h =>
      checkIns.some(c => c.habitId === h.id && c.date === date)
    ).length;
    return count + completedOnDate;
  }, 0);
  const weeklyPossible = habits.length * 7;
  const weeklyRate = weeklyPossible > 0 ? Math.round((weeklyCompletions / weeklyPossible) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Statistics</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelCircle}>
            <Text style={styles.levelNumber}>{userProgress.level}</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>Level {userProgress.level}</Text>
            <Text style={styles.xpText}>{userProgress.xp} XP Total</Text>
          </View>
        </View>

        {/* Overall Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalHabits}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCheckIns}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{averageStreak}</Text>
            <Text style={styles.statLabel}>Avg Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekRate}>{weeklyRate}%</Text>
            <Text style={styles.weekRateLabel}>Completion Rate</Text>
          </View>

          {/* Week Calendar */}
          <View style={styles.weekCalendar}>
            {weekDates.map((date) => (
              <View key={date} style={styles.dayColumn}>
                <Text style={[styles.dayName, isToday(date) && styles.dayNameToday]}>
                  {getDayName(date)}
                </Text>
                <View style={[
                  styles.dayCircle,
                  isToday(date) && styles.dayCircleToday
                ]}>
                  <Text style={styles.dayNumber}>{date.split('-')[2]}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Per Habit Stats */}
        <Text style={styles.sectionTitle}>Habit Details</Text>
        {habitsWithStatus.length === 0 ? (
          <Text style={styles.emptyText}>No habits to show</Text>
        ) : (
          habitsWithStatus.map((habit) => (
            <View key={habit.id} style={styles.habitStatCard}>
              <View style={styles.habitHeader}>
                <View style={[styles.habitColor, { backgroundColor: habit.color }]} />
                <Text style={styles.habitName}>{habit.name}</Text>
              </View>

              {/* Mini week view */}
              <View style={styles.miniWeek}>
                {weekDates.map((date) => (
                  <View
                    key={date}
                    style={[
                      styles.miniDay,
                      isCompletedOnDate(habit.id, date) && { backgroundColor: habit.color }
                    ]}
                  />
                ))}
              </View>

              <View style={styles.habitStats}>
                <View style={styles.habitStatItem}>
                  <Text style={styles.habitStatValue}>{habit.streak}</Text>
                  <Text style={styles.habitStatLabel}>Current</Text>
                </View>
                <View style={styles.habitStatItem}>
                  <Text style={styles.habitStatValue}>{habit.stats.longestStreak}</Text>
                  <Text style={styles.habitStatLabel}>Best</Text>
                </View>
                <View style={styles.habitStatItem}>
                  <Text style={styles.habitStatValue}>{habit.stats.completionRate}%</Text>
                  <Text style={styles.habitStatLabel}>Rate</Text>
                </View>
                <View style={styles.habitStatItem}>
                  <Text style={styles.habitStatValue}>{habit.stats.totalCompletions}</Text>
                  <Text style={styles.habitStatLabel}>Total</Text>
                </View>
              </View>
            </View>
          ))
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: {
    color: COLORS.primary,
    fontSize: FONTS.size.m,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.size.l,
    fontWeight: 'bold',
  },
  content: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  levelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.m,
    padding: SPACING.l,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  levelCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: COLORS.background,
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
  },
  levelInfo: {
    marginLeft: SPACING.m,
  },
  levelTitle: {
    color: COLORS.text,
    fontSize: FONTS.size.l,
    fontWeight: 'bold',
  },
  xpText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.m,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.size.l,
    fontWeight: 'bold',
    marginTop: SPACING.m,
    marginBottom: SPACING.m,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.m,
    padding: SPACING.m,
    width: '48%',
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: SPACING.xs,
  },
  weekCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.m,
    padding: SPACING.m,
  },
  weekHeader: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  weekRate: {
    color: COLORS.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
  },
  weekRateLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayName: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginBottom: SPACING.xs,
  },
  dayNameToday: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleToday: {
    backgroundColor: COLORS.primary,
  },
  dayNumber: {
    color: COLORS.text,
    fontSize: FONTS.size.s,
    fontWeight: '600',
  },
  habitStatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.m,
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  habitColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.s,
  },
  habitName: {
    color: COLORS.text,
    fontSize: FONTS.size.m,
    fontWeight: '600',
  },
  miniWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  miniDay: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitStatItem: {
    alignItems: 'center',
  },
  habitStatValue: {
    color: COLORS.text,
    fontSize: FONTS.size.m,
    fontWeight: 'bold',
  },
  habitStatLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.m,
    textAlign: 'center',
    padding: SPACING.l,
  },
});
