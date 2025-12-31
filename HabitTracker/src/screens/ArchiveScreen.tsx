import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONTS, LAYOUT } from '../constants/Theme';
import { useHabitContext } from '../context/HabitContext';

export default function ArchiveScreen() {
  const navigation = useNavigation();
  const { getArchivedHabits, unarchiveHabit, deleteHabit } = useHabitContext();
  const archivedHabits = getArchivedHabits();

  const handleUnarchive = (id: string, name: string) => {
    Alert.alert(
      'Restore Habit',
      `Restore "${name}" to your active habits?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => unarchiveHabit(id) },
      ]
    );
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Habit',
      `Permanently delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Archived Habits</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {archivedHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No archived habits</Text>
            <Text style={styles.emptySubtext}>
              Long press any habit and select "Archive" to pause tracking
            </Text>
          </View>
        ) : (
          archivedHabits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitInfo}>
                <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
                <View style={styles.habitDetails}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.habitStats}>
                    {habit.stats.totalCompletions} completions • Best streak: {habit.stats.longestStreak} days
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={() => handleUnarchive(habit.id, habit.name)}
                >
                  <Text style={styles.restoreButtonText}>Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(habit.id, habit.name)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
    paddingBottom: SPACING.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
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
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  habitCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius.m,
    marginBottom: SPACING.s,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: SPACING.m,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    color: COLORS.text,
    fontSize: FONTS.size.m,
    fontWeight: '600',
  },
  habitStats: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  restoreButton: {
    flex: 1,
    paddingVertical: SPACING.s,
    borderRadius: LAYOUT.borderRadius.s,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: FONTS.size.s,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: SPACING.s,
    borderRadius: LAYOUT.borderRadius.s,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: FONTS.size.s,
  },
});
