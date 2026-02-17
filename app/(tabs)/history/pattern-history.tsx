import { Stack } from 'expo-router';
import PatternHistoryScreen from '@/components/pattern/History/PatternHistoryScreen';

export default function PatternHistoryPage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Pattern Mode History',
          headerStyle: {
            backgroundColor: '#d89312ff',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <PatternHistoryScreen />
    </>
  );
}
