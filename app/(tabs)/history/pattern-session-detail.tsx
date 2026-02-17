import { Stack } from 'expo-router';
import PatternSessionDetailScreen from '@/components/pattern/History/PatternSessionDetailScreen';

export default function PatternSessionDetailPage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Session Details',
          headerStyle: {
            backgroundColor: '#FFA500',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <PatternSessionDetailScreen />
    </>
  );
}
