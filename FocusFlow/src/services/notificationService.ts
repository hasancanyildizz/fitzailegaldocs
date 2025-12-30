import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { TimerMode } from '../store/timerStore';

// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('timer', {
            name: 'Timer Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00FF88',
            sound: 'default',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'your-project-id', // Replace with actual project ID if using EAS
            });
            token = tokenData.data;
        } catch (error) {
            // Expo push token not required for local notifications
            console.log('Push token not available, using local notifications only');
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export async function sendTimerCompleteNotification(mode: TimerMode): Promise<void> {
    const titles = {
        focus: 'Focus Session Complete!',
        shortBreak: 'Short Break Over!',
        longBreak: 'Long Break Over!',
    };

    const bodies = {
        focus: 'Great job! Time for a well-deserved break.',
        shortBreak: 'Ready to focus again?',
        longBreak: 'Feeling refreshed? Time to get back to work!',
    };

    await Notifications.scheduleNotificationAsync({
        content: {
            title: titles[mode],
            body: bodies[mode],
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Immediate notification
    });
}

export async function scheduleTimerReminder(seconds: number, mode: TimerMode): Promise<string> {
    const titles = {
        focus: 'Focus Session Complete!',
        shortBreak: 'Break is over!',
        longBreak: 'Long break is over!',
    };

    const bodies = {
        focus: 'You did it! Take a break now.',
        shortBreak: 'Time to focus again!',
        longBreak: 'Ready to be productive?',
    };

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: titles[mode],
            body: bodies[mode],
            sound: 'default',
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: seconds,
        },
    });

    return identifier;
}

export async function cancelScheduledNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}
