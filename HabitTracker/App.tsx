import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitProvider } from './src/context/HabitContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitProvider>
        <AppNavigator />
      </HabitProvider>
    </SafeAreaProvider>
  );
}
