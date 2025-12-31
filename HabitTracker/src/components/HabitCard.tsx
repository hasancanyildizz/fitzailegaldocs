import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, LAYOUT, FONTS } from '../constants/Theme';

interface HabitCardProps {
  name: string;
  streak: number;
  completed: boolean;
  onCheckIn: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  color?: string;
  icon?: string;
  frequency?: 'daily' | 'weekly';
  targetDays?: number[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const HabitCard: React.FC<HabitCardProps> = ({
  name,
  streak,
  completed,
  onCheckIn,
  onDelete,
  onEdit,
  onArchive,
  color = COLORS.primary,
  frequency = 'daily',
  targetDays = [],
}) => {
  const today = new Date().getDay();
  const isTargetDay = frequency === 'daily' || targetDays.includes(today);

  // Find next target day for weekly habits
  const getNextTargetDay = (): string => {
    if (frequency === 'daily' || targetDays.length === 0) return '';
    for (let i = 1; i <= 7; i++) {
      const nextDay = (today + i) % 7;
      if (targetDays.includes(nextDay)) {
        return DAY_NAMES[nextDay];
      }
    }
    return '';
  };
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      if (!completed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    onCheckIn();
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    const options = [];

    if (onEdit) {
      options.push({
        text: 'Edit',
        onPress: onEdit,
      });
    }

    if (onArchive) {
      options.push({
        text: 'Archive',
        onPress: () => {
          Alert.alert(
            'Archive Habit',
            `Archive "${name}"? You can restore it later from the archive.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Archive', onPress: onArchive },
            ]
          );
        },
      });
    }

    if (onDelete) {
      options.push({
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert(
            'Delete Habit',
            `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]
          );
        },
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert(name, 'What would you like to do?', options);
  };

  return (
    <TouchableOpacity
      style={[styles.container, completed && { borderColor: color }]}
      onLongPress={(onDelete || onEdit || onArchive) ? handleLongPress : undefined}
      delayLongPress={500}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${name} habit, ${streak} day streak, ${completed ? 'completed' : 'not completed'}`}
      accessibilityHint="Long press to edit or delete"
    >
      <View style={styles.leftContent}>
        <View style={[styles.colorIndicator, { backgroundColor: color }]} />
        <View style={styles.textContent}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.streak}>
            {streak > 0 ? `${streak} Day Streak` : 'Start your streak!'}
          </Text>
          {frequency === 'weekly' && (
            <View style={styles.weeklyInfo}>
              {DAY_NAMES_SHORT.map((day, index) => (
                <Text
                  key={index}
                  style={[
                    styles.dayIndicator,
                    targetDays.includes(index) && styles.dayIndicatorActive,
                    targetDays.includes(index) && { color },
                    index === today && styles.dayIndicatorToday,
                  ]}
                >
                  {day}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightContent}>
        {frequency === 'weekly' && !isTargetDay && !completed && (
          <Text style={styles.nextDay}>Next: {getNextTargetDay()}</Text>
        )}
        <TouchableOpacity
          style={[
            styles.checkInButton,
            { borderColor: color },
            completed && { backgroundColor: color },
            !isTargetDay && !completed && styles.checkInButtonDisabled,
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={!isTargetDay && !completed}
        >
          <Text
            style={[
              styles.checkInText,
              { color: color },
              completed && styles.checkInTextActive,
              !isTargetDay && !completed && styles.checkInTextDisabled,
            ]}
          >
            {completed ? 'DONE' : isTargetDay ? 'DO IT' : 'SKIP'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContent: {
    flex: 1,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: SPACING.m,
  },
  name: {
    color: COLORS.text,
    fontSize: FONTS.size.m,
    fontWeight: '600',
  },
  streak: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: 2,
  },
  weeklyInfo: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    gap: 4,
  },
  dayIndicator: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    opacity: 0.5,
  },
  dayIndicatorActive: {
    fontWeight: 'bold',
    opacity: 1,
  },
  dayIndicatorToday: {
    textDecorationLine: 'underline',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  nextDay: {
    fontSize: FONTS.size.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  checkInButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: LAYOUT.borderRadius.l,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  checkInButtonDisabled: {
    borderColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  checkInText: {
    fontSize: FONTS.size.s,
    fontWeight: 'bold',
  },
  checkInTextActive: {
    color: COLORS.background,
  },
  checkInTextDisabled: {
    color: COLORS.textSecondary,
  },
});
