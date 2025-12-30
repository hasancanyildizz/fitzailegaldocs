import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONTS, LAYOUT } from '../constants/Theme';
import { useHabitContext } from '../context/HabitContext';
import { HabitCard } from '../components/HabitCard';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getXPProgress } from '../utils/streakUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { userProgress, getHabitsWithStatus, toggleCheckIn, deleteHabit, isLoading, userName } = useHabitContext();

  const habits = getHabitsWithStatus();
  const xpProgress = getXPProgress(userProgress.xp);
  const completedToday = habits.filter((h) => h.isCompletedToday).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello, {userName}</Text>
          <Text style={styles.subtext}>Ready to crush your goals?</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => navigation.navigate('Statistics')}
          >
            <Text style={styles.statsButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.statsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* XP Progress Bar */}
      <View style={styles.xpContainer}>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${xpProgress.percentage}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {xpProgress.current} / {xpProgress.required} XP
        </Text>
      </View>

      {/* Stats Row - Tap to see Statistics */}
      <TouchableOpacity
        style={styles.statsRow}
        onPress={() => navigation.navigate('Statistics')}
        activeOpacity={0.7}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedToday}</Text>
          <Text style={styles.statLabel}>Done Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{habits.length}</Text>
          <Text style={styles.statLabel}>Total Habits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userProgress.streakFreezes}</Text>
          <Text style={styles.statLabel}>Freezes</Text>
        </View>
        <Text style={styles.statsArrow}>→</Text>
      </TouchableOpacity>

      {/* Habit List */}
      <ScrollView contentContainerStyle={styles.habitList}>
        <Text style={styles.sectionTitle}>Today's Habits</Text>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No habits yet!</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create your first habit
            </Text>
          </View>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              name={habit.name}
              streak={habit.streak}
              completed={habit.isCompletedToday}
              color={habit.color}
              onCheckIn={() => toggleCheckIn(habit.id)}
              onEdit={() => navigation.navigate('EditHabit', { habitId: habit.id })}
              onDelete={() => deleteHabit(habit.id)}
            />
          ))
        )}
      </ScrollView>

      {/* FAB - Add Habit Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          navigation.navigate('AddHabit');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.m,
    marginTop: SPACING.m,
  },
  header: {
    padding: SPACING.l,
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: COLORS.text,
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
  },
  subtext: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.m,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  statsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statsButtonText: {
    fontSize: 20,
  },
  xpContainer: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  xpText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.m,
    borderRadius: LAYOUT.borderRadius.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  statsArrow: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.l,
    marginLeft: SPACING.s,
  },
  habitList: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.size.l,
    fontWeight: 'bold',
    marginBottom: SPACING.m,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: FONTS.size.l,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.m,
    marginTop: SPACING.s,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.l,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: COLORS.background,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});
