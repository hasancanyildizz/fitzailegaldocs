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
  color?: string;
  icon?: string;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  name,
  streak,
  completed,
  onCheckIn,
  onDelete,
  onEdit,
  color = COLORS.primary,
}) => {
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
      onLongPress={(onDelete || onEdit) ? handleLongPress : undefined}
      delayLongPress={500}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${name} habit, ${streak} day streak, ${completed ? 'completed' : 'not completed'}`}
      accessibilityHint="Long press to edit or delete"
    >
      <View style={styles.leftContent}>
        <View style={[styles.colorIndicator, { backgroundColor: color }]} />
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.streak}>
            {streak > 0 ? `${streak} Day Streak` : 'Start your streak!'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.checkInButton,
          { borderColor: color },
          completed && { backgroundColor: color },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.checkInText,
            { color: color },
            completed && styles.checkInTextActive,
          ]}
        >
          {completed ? 'DONE' : 'DO IT'}
        </Text>
      </TouchableOpacity>
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
  checkInButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: LAYOUT.borderRadius.l,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  checkInText: {
    fontSize: FONTS.size.s,
    fontWeight: 'bold',
  },
  checkInTextActive: {
    color: COLORS.background,
  },
});
