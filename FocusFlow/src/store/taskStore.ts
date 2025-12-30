import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface BoxTask {
    id: string;
    title: string;
    completed: boolean;
    pomodorosEstimate: number;
    pomodorosActual: number;
    createdAt: string;
}

interface TaskState {
    tasks: BoxTask[];
    selectedTaskId: string | null;

    addTask: (title: string, estimate: number) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    selectTask: (id: string | null) => void;
    incrementActual: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            tasks: [],
            selectedTaskId: null,

            addTask: (title, estimate) => {
                const newTask: BoxTask = {
                    id: Date.now().toString(),
                    title,
                    completed: false,
                    pomodorosEstimate: estimate,
                    pomodorosActual: 0,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ tasks: [newTask, ...state.tasks] }));
            },

            toggleTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, completed: !t.completed } : t
                    ),
                })),

            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                    selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
                })),

            selectTask: (id) => set({ selectedTaskId: id }),

            incrementActual: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, pomodorosActual: t.pomodorosActual + 1 } : t
                    ),
                })),
        }),
        {
            name: 'task-storage',
            storage: createJSONStorage(() =>
                Platform.OS === 'web' ? localStorage : AsyncStorage
            ),
        }
    )
);
