import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Keyboard,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useTaskStore, BoxTask } from '../store/taskStore';
import { COLORS, FONTS, SPACING, LAYOUT } from '../constants/Theme';
import { Check, Trash, Plus, Target, PencilSimple, X, Minus } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';

export default function TaskList() {
    const { tasks, addTask, updateTask, toggleTask, deleteTask, selectTask, selectedTaskId } = useTaskStore();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskEstimate, setNewTaskEstimate] = useState(1);
    const [isAdding, setIsAdding] = useState(false);

    // Edit modal state
    const [editingTask, setEditingTask] = useState<BoxTask | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editEstimate, setEditEstimate] = useState(1);

    const handleAddTask = () => {
        if (newTaskTitle.trim()) {
            addTask(newTaskTitle.trim(), newTaskEstimate);
            setNewTaskTitle('');
            setNewTaskEstimate(1);
            setIsAdding(false);
            Keyboard.dismiss();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const openEditModal = (task: BoxTask) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditEstimate(task.pomodorosEstimate);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSaveEdit = () => {
        if (editingTask && editTitle.trim()) {
            updateTask(editingTask.id, editTitle.trim(), editEstimate);
            setEditingTask(null);
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
                onPress={() => openEditModal(item)}
                style={styles.editButton}
            >
                <PencilSimple size={18} color={COLORS.primary} />
            </TouchableOpacity>

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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <Text style={styles.header}>TASKS</Text>

            <FlatList
                data={tasks}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a task..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                    <Plus size={24} color={COLORS.background} weight="bold" />
                </TouchableOpacity>
            </View>

            {/* Edit Task Modal */}
            <Modal
                visible={editingTask !== null}
                animationType="fade"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Task</Text>
                            <TouchableOpacity onPress={() => setEditingTask(null)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Task Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder="Task name"
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <Text style={styles.modalLabel}>Estimated Pomodoros</Text>
                        <View style={styles.estimateContainer}>
                            <TouchableOpacity
                                style={styles.estimateButton}
                                onPress={() => setEditEstimate(Math.max(1, editEstimate - 1))}
                            >
                                <Minus size={20} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                            <Text style={styles.estimateValue}>{editEstimate}</Text>
                            <TouchableOpacity
                                style={styles.estimateButton}
                                onPress={() => setEditEstimate(editEstimate + 1)}
                            >
                                <Plus size={20} color={COLORS.text} weight="bold" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
    editButton: {
        padding: SPACING.s,
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: LAYOUT.borderRadius.l,
        padding: SPACING.l,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: FONTS.size.xl,
        fontWeight: 'bold',
    },
    modalLabel: {
        color: COLORS.textSecondary,
        fontSize: FONTS.size.s,
        marginBottom: SPACING.xs,
        marginTop: SPACING.m,
    },
    modalInput: {
        backgroundColor: COLORS.background,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        color: COLORS.text,
        fontSize: FONTS.size.m,
    },
    estimateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.l,
        marginTop: SPACING.s,
    },
    estimateButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    estimateValue: {
        color: COLORS.text,
        fontSize: FONTS.size.xxl,
        fontWeight: 'bold',
        minWidth: 40,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: LAYOUT.borderRadius.m,
        padding: SPACING.m,
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    saveButtonText: {
        color: COLORS.background,
        fontSize: FONTS.size.m,
        fontWeight: 'bold',
    },
});
