import React, { useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useBleManager, ConnectedDevice } from '@/components/context/blecontext';
import { CHARACTERISTIC } from '@/enum/characteristic';
import OnePadMode from '@/components/ForbiddenColor/OnePadMode';
import tw from "twrnc";

const ForbiddenColorModeScreen = () => {
  const { connectedDevice } = useBleManager();

  // Create LED command function that works with existing BLE infrastructure
  const sendLedCommand = useCallback(async (padId: number, color: 'red' | 'green' | 'off') => {
    try {
      const device = connectedDevice[padId];
      if (!device) {
        console.warn(`No device connected for pad ${padId + 1}`);
        return;
      }

      let command = '';
      
      switch (color) {
        case 'red':
          command = "wAAA"; // Red LED
          break;
        case 'green':
          command = "AAEA"; // Green LED (G channel = 4, others = 0) 
          break;
        case 'off':
          command = "AAAA"; // All LEDs off
          break;
        default:
          console.warn(`Unknown color: ${color}`);
          return;
      }

      console.log(`💡 [LED] Sending LED command to pad ${padId + 1}: ${color} (${command}) at ${Date.now()}`);
      await device.writeCharacteristic(CHARACTERISTIC.LED, command);
    } catch (error) {
      console.error(`Error sending LED command to pad ${padId + 1}:`, error);
    }
  }, [connectedDevice]);

  // Get list of connected pad indices
  const getConnectedPadIds = (): number[] => {
    if (!Array.isArray(connectedDevice)) {
      const fallback = [0, 1, 2];
      console.log(`🔌 getConnectedPadIds: using fallback [${fallback.join(', ')}]`);
      return fallback; // Fallback to mock pads for testing
    }
    
    const result = connectedDevice
      .map((device: ConnectedDevice | null, index: number) => device ? index : -1)
      .filter((id: number) => id !== -1);
    
    console.log(`🔌 getConnectedPadIds: returning [${result.join(', ')}]`);
    return result;
  };

  const availablePads = getConnectedPadIds();

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const handleNavigateToHistory = useCallback(() => {
    router.push('/forbidden-color-history');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/home')}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        
        <Text
          style={[
            tw`text-center font-bold text-white`,
            styles.headerTitle,
          ]}
        >
          Forbidden Color
        </Text>
        
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={handleNavigateToHistory}
        >
          <MaterialIcons name="history" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Render One Pad Mode */}
        {availablePads.length === 0 ? (
          <View style={styles.noPadsContainer}>
            <ThemedText style={styles.noPadsText}>
              ไม่มีแผ่นกดเชื่อมต่อ กรุณาเชื่อมต่ออุปกรณ์เพื่อเล่น
            </ThemedText>
          </View>
        ) : (
          <OnePadMode availablePads={availablePads} sendLedCommand={sendLedCommand} />
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4e54a3',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 10,
    marginTop: 32
  },
  headerTitle: {
    fontSize: 36,
    flex: 1,
    textAlign: 'center',
  },
  historyButton: {
    padding: 4,
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  noPadsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 32,
    marginVertical: 16,
    alignItems: 'center',
  },
  noPadsText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  backButtonContainer: {
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4e54a3',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e63946',
    marginTop: 8,
  },
  padContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4e54a3',
    marginBottom: 16,
    textAlign: 'center',
  },
  padsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  pad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  padOff: {
    backgroundColor: '#e9ecef',
    borderColor: '#adb5bd',
  },
  padRed: {
    backgroundColor: '#ff6b6b',
    borderColor: '#e63946',
  },
  padGreen: {
    backgroundColor: '#51cf66',
    borderColor: '#2b8a3e',
  },
  padNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  reactionTimeRow: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  reactionTimeLabel: {
    fontSize: 14,
    color: '#4e54a3',
    fontWeight: '500',
  },
  pressTimesContainer: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  pressTimesTitle: {
    fontSize: 14,
    color: '#4e54a3',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  pressTimesList: {
    backgroundColor: 'transparent',
    gap: 4,
  },
  pressTimeItem: {
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pressTimeItemHit: {
    backgroundColor: '#d3f9d8',
    borderLeftWidth: 3,
    borderLeftColor: '#2b8a3e',
  },
  pressTimeItemMiss: {
    backgroundColor: '#ffe0e0',
    borderLeftWidth: 3,
    borderLeftColor: '#e63946',
  },
  pressTimeText: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4e54a3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  configCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  configItem: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  configLabel: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  controls: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4e54a3',
  },
  stopButton: {
    backgroundColor: '#e63946',
  },
  resetButton: {
    backgroundColor: '#6c757d',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ForbiddenColorModeScreen;