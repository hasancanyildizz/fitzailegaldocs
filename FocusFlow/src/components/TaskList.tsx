import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Keyboard
} from 'react-native';
import { useTaskStore, BoxTask } from '../store/taskStore';
import { COLORS, FONTS, SPACING, LAYOUT } from '../constants/Theme';
import { Check, Trash, Plus, Target } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';

export default function TaskList() {
    const { tasks, addTask, toggleTask, deleteTask, selectTask, selectedTaskId } = useTaskStore();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddTask = () => {
        if (newTaskTitle.trim()) {
            addTask(newTaskTitle.trim(), 1); // Default estimate 1
            setNewTaskTitle('');
            setIsAdding(false);
            Keyboard.dismiss();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const renderItem = ({ item }: { item: BoxTask }) => (
        <TouchableOpacity
            style={[
                styles.taskItem,
                selectedTaskId === item.id && styles.selectedTaskItem
            ]}
            onPress={() => {
                selectTask(item.id);
                Haptics.selectionAsync();
            }}
            activeOpacity={0.7}
        >
            <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkedCheckbox]}
                onPress={() => {
                    toggleTask(item.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                {item.completed && <Check size={14} color={COLORS.background} weight="bold" />}
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, item.completed && styles.completedText]}>
                    {item.title}
                </Text>
                <View style={styles.taskMeta}>
                    <Target size={14} color={COLORS.textSecondary} />
                    <Text style={styles.taskCount}>
                        {item.pomodorosActual} / {item.pomodorosEstimate}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => {
                    deleteTask(item.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                style={styles.deleteButton}
            >
                <Trash size={18} color={COLORS.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>TASKS</Text>

            <FlatList
                data={tasks}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a task..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    onSubmitEditing={handleAddTask}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                    <Plus size={24} color={COLORS.background} weight="bold" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        paddingTop: SPACING.l,
    },
    header: {
        color: COLORS.textSecondary,
        fontSize: FONTS.size.s,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: SPACING.m,
    },
    list: {
        flex: 1,
    },
    listContent: {
        gap: SPACING.s,
        paddingBottom: SPACING.xxl,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius.m,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedTaskItem: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surfaceLight,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    checkedCheckbox: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        color: COLORS.text,
        fontSize: FONTS.size.m,
    },
    completedText: {
        color: COLORS.textSecondary,
        textDecorationLine: 'line-through',
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    taskCount: {
        color: COLORS.textSecondary,
        fontSize: FONTS.size.s,
    },
    deleteButton: {
        padding: SPACING.s,
    },
    inputContainer: {
        flexDirection: 'row',
        gap: SPACING.s,
        marginTop: SPACING.m,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        color: COLORS.text,
        fontSize: FONTS.size.m,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
