import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    Switch,
    Linking,
    Share,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHabitContext } from '../context/HabitContext';
import { COLORS, FONTS, SPACING, LAYOUT } from '../constants/Theme';
import { X, Trash, User, Bell, Shield, FileText, Export, Archive } from 'phosphor-react-native';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { userName, updateUserName, clearAllData, requestNotificationPermission, habits, checkIns, userProgress } = useHabitContext();
    const [name, setName] = useState(userName);

    const handleSaveName = () => {
        if (name.trim().length > 0) {
            updateUserName(name.trim());
            Alert.alert('Success', 'Profile name updated!');
        }
    };

    const handleExportData = async () => {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                userName,
                userProgress,
                habits,
                checkIns,
            };

            const jsonString = JSON.stringify(exportData, null, 2);

            if (Platform.OS === 'web') {
                // Web: Copy to clipboard
                navigator.clipboard.writeText(jsonString);
                Alert.alert('Exported', 'Data copied to clipboard!');
            } else {
                // Mobile: Use Share API
                await Share.share({
                    message: jsonString,
                    title: 'Habit Tracker Export',
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'Are you sure? This will delete all habits and progress permanently.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllData();
                        Alert.alert('Reset', 'All data has been cleared.');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <X size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.inputContainer}>
                    <User size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your Name"
                        placeholderTextColor={COLORS.textSecondary}
                        onEndEditing={handleSaveName}
                    />
                </View>
                <Text style={styles.hint}>Tap outside to save</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <TouchableOpacity
                    style={styles.row}
                    onPress={async () => {
                        const allowed = await requestNotificationPermission();
                        if (allowed) Alert.alert('Enabled', 'Notifications are enabled');
                        else Alert.alert('Disabled', 'Please enable notifications in system settings');
                    }}
                >
                    <View style={styles.rowContent}>
                        <Bell size={24} color={COLORS.text} />
                        <Text style={styles.rowText}>Check Permissions</Text>
                    </View>
                    <View style={styles.chevron}>
                        <Text style={{ color: COLORS.textSecondary }}>→</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Legal</Text>
                <TouchableOpacity
                    style={styles.row}
                    onPress={() => Linking.openURL('https://hasancanyildizz.github.io/fitzailegaldocs/habittracker/privacy-policy.html')}
                >
                    <View style={styles.rowContent}>
                        <Shield size={24} color={COLORS.text} />
                        <Text style={styles.rowText}>Privacy Policy</Text>
                    </View>
                    <View style={styles.chevron}>
                        <Text style={{ color: COLORS.textSecondary }}>→</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.row, { marginTop: SPACING.s }]}
                    onPress={() => Linking.openURL('https://hasancanyildizz.github.io/fitzailegaldocs/habittracker/terms-of-service.html')}
                >
                    <View style={styles.rowContent}>
                        <FileText size={24} color={COLORS.text} />
                        <Text style={styles.rowText}>Terms of Service</Text>
                    </View>
                    <View style={styles.chevron}>
                        <Text style={{ color: COLORS.textSecondary }}>→</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                <TouchableOpacity
                    style={styles.row}
                    onPress={() => navigation.navigate('Archive')}
                >
                    <View style={styles.rowContent}>
                        <Archive size={24} color={COLORS.text} />
                        <Text style={styles.rowText}>Archived Habits</Text>
                    </View>
                    <View style={styles.chevron}>
                        <Text style={{ color: COLORS.textSecondary }}>→</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.exportButton, { marginTop: SPACING.s }]} onPress={handleExportData}>
                    <Export size={20} color={COLORS.primary} />
                    <Text style={styles.exportButtonText}>Export Data</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.section, styles.dangerZone]}>
                <Text style={styles.sectionTitle}>Danger Zone</Text>
                <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
                    <Trash size={20} color="white" />
                    <Text style={styles.dangerButtonText}>Clear All Data</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Version 3.0.0 (Build 2025)</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.m,
    },
    title: {
        color: COLORS.text,
        fontSize: FONTS.size.xl,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: SPACING.s,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: FONTS.size.s,
        fontWeight: '600',
        marginBottom: SPACING.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius.m,
        gap: SPACING.m,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: FONTS.size.m,
    },
    hint: {
        color: COLORS.textSecondary,
        fontSize: FONTS.size.s,
        marginTop: SPACING.xs,
        marginLeft: SPACING.s,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius.m,
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    rowText: {
        color: COLORS.text,
        fontSize: FONTS.size.m,
    },
    chevron: {
        // Simple arrow
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius.m,
        gap: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    exportButtonText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: FONTS.size.m,
    },
    dangerZone: {
        marginTop: SPACING.m,
        marginBottom: SPACING.xxl,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.error,
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius.m,
        gap: SPACING.s,
    },
    dangerButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: FONTS.size.m,
    },
    version: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: FONTS.size.s,
        marginBottom: SPACING.m,
    },
});
