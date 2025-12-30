import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONTS, LAYOUT, COLORS_PALETTE } from '../constants/Theme';
import { useHabitContext } from '../context/HabitContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatReminderTime } from '../utils/notificationUtils';
import { RootStackParamList } from '../navigation/AppNavigator';

// Helper to convert "HH:mm" string back to Date object for picker
const parseTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const DAYS_OF_WEEK = [
  { key: 0, label: 'Sun' },
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
];

type EditHabitRouteProp = RouteProp<RootStackParamList, 'EditHabit'>;

export default function EditHabitScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditHabitRouteProp>();
  const { habitId } = route.params;

  const { habits, updateHabit, deleteHabit, requestNotificationPermission } = useHabitContext();

  const habit = habits.find(h => h.id === habitId);

  const [habitName, setHabitName] = useState(habit?.name || '');
  const [selectedColor, setSelectedColor] = useState(habit?.color || COLORS.primary);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime || '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(habit?.frequency || 'daily');
  const [targetDays, setTargetDays] = useState<number[]>(habit?.targetDays || [0, 1, 2, 3, 4, 5, 6]);

  const toggleDay = (day: number) => {
    if (targetDays.includes(day)) {
      if (targetDays.length > 1) {
        setTargetDays(targetDays.filter(d => d !== day));
      }
    } else {
      setTargetDays([...targetDays, day].sort());
    }
  };

  // No longer need reminderTimes array
  // const reminderTimes = getDefaultReminderTimes();

  useEffect(() => {
    if (!habit) {
      Alert.alert('Error', 'Habit not found');
      navigation.goBack();
    }
  }, [habit]);

  const onTimeChange = async (event: any, selectedDate?: Date) => {
    // On Android, dismissing the picker returns undefined date
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      // Format to "HH:mm"
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      if (Platform.OS !== 'web') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Notifications must be enabled to set a reminder.'
          );
          return;
        }
      }
      setReminderTime(timeStr);
    }
  };

  const handleSave = async () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    await updateHabit(habitId, {
      name: habitName.trim(),
      color: selectedColor,
      frequency: frequency,
      targetDays: frequency === 'weekly' ? targetDays : undefined,
      reminderTime: reminderTime || undefined,
    });

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habitId);
            navigation.goBack();
          },
        },
      ]
    );
  };



  if (!habit) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Habit</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.form}>
        <Text style={styles.label}>HABIT NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Drink Water, Exercise, Read..."
          placeholderTextColor={COLORS.textSecondary}
          value={habitName}
          onChangeText={setHabitName}
          maxLength={30}
        />

        <Text style={styles.label}>COLOR</Text>
        <View style={styles.colorRow}>
          {COLORS_PALETTE.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                selectedColor === color && styles.colorCircleSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <Text style={styles.label}>FREQUENCY</Text>
        <View style={styles.frequencyRow}>
          <TouchableOpacity
            style={[
              styles.frequencyButton,
              frequency === 'daily' && styles.frequencyButtonSelected,
            ]}
            onPress={() => setFrequency('daily')}
          >
            <Text style={[
              styles.frequencyText,
              frequency === 'daily' && styles.frequencyTextSelected,
            ]}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.frequencyButton,
              frequency === 'weekly' && styles.frequencyButtonSelected,
            ]}
            onPress={() => setFrequency('weekly')}
          >
            <Text style={[
              styles.frequencyText,
              frequency === 'weekly' && styles.frequencyTextSelected,
            ]}>Weekly</Text>
          </TouchableOpacity>
        </View>

        {frequency === 'weekly' && (
          <>
            <Text style={styles.label}>SELECT DAYS</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    targetDays.includes(day.key) && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(day.key)}
                >
                  <Text style={[
                    styles.dayText,
                    targetDays.includes(day.key) && styles.dayTextSelected,
                  ]}>{day.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.reminderRow}>
          <Text style={styles.label}>DAILY REMINDER</Text>
          <TouchableOpacity
            style={styles.reminderButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.reminderIcon}>
              {reminderTime ? '🔔' : '🔕'}
            </Text>
            <Text style={styles.reminderText}>
              {reminderTime ? formatReminderTime(reminderTime) : 'No Reminder'}
            </Text>
          </TouchableOpacity>
        </View>

        {showTimePicker && (
          <View style={{ width: '100%' }}>
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <input
                type="time"
                value={reminderTime}
                onChange={(e: any) => {
                  setReminderTime(e.target.value);
                }}
                style={{
                  fontSize: 16,
                  padding: 10,
                  backgroundColor: COLORS.surface,
                  color: COLORS.text,
                  borderRadius: 8,
                  marginTop: 10,
                  border: `1px solid ${COLORS.border}`,
                  outline: 'none',
                  width: '100%',
                  display: 'block',
                  height: 40,
                }}
              />
            ) : (
              <DateTimePicker
                value={reminderTime ? parseTime(reminderTime) : new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}
          </View>
        )}

        <Text style={styles.previewLabel}>PREVIEW</Text>
        <View style={[styles.previewCard, { borderLeftColor: selectedColor }]}>
          <View style={[styles.previewIndicator, { backgroundColor: selectedColor }]} />
          <View style={styles.previewContent}>
            <Text style={styles.previewName}>
              {habitName || 'Your Habit Name'}
            </Text>
            {reminderTime && (
              <Text style={styles.previewReminder}>
                Reminder at {formatReminderTime(reminderTime)}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>DELETE HABIT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.m,
  },
  saveText: {
    color: COLORS.primary,
    fontSize: FONTS.size.m,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.size.l,
    fontWeight: 'bold',
  },
  form: {
    padding: SPACING.l,
    paddingBottom: SPACING.xxl,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
    fontWeight: '600',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius.m,
    color: COLORS.text,
    fontSize: FONTS.size.m,
  },
  colorRow: {
    flexDirection: 'row',
    gap: SPACING.m,
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  frequencyButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  frequencyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.m,
    fontWeight: '600',
  },
  frequencyTextSelected: {
    color: COLORS.primary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: COLORS.background,
  },
  reminderRow: {
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
  },
  reminderButton: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    fontSize: 20,
    marginRight: SPACING.s,
  },
  reminderText: {
    color: COLORS.text,
    fontSize: FONTS.size.m,
    flex: 1,
  },
  reminderArrow: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
  },
  timePickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius.m,
    marginTop: SPACING.s,
    overflow: 'hidden',
  },
  timeOption: {
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timeOptionSelected: {
    backgroundColor: COLORS.primary + '20',
  },
  timeOptionText: {
    color: COLORS.text,
    fontSize: FONTS.size.m,
  },
  timeOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  previewLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: SPACING.xl,
    marginBottom: SPACING.s,
    fontWeight: '600',
    letterSpacing: 1,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  previewIndicator: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: SPACING.m,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    color: COLORS.text,
    fontSize: FONTS.size.m,
    fontWeight: '600',
  },
  previewReminder: {
    color: COLORS.textSecondary,
    fontSize: FONTS.size.s,
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius.l,
    alignItems: 'center',
    marginTop: SPACING.xxl,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  deleteButtonText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: FONTS.size.m,
  },
});
