import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useBleManager } from '@/components/context/blecontext';
import { useForbiddenColorGame } from '@/hooks/useForbiddenColorGame';
import { getApiUrl, API_CONFIG } from '@/config/api.config';
import { CHARACTERISTIC } from '@/enum/characteristic';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnePadGameplayScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedPad = params.padId ? parseInt(params.padId as string) : null;
  
  const { connectedDevice } = useBleManager();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaveStatus, setLastSaveStatus] = useState<'success' | 'error' | null>(null);
  const [isSessionSaved, setIsSessionSaved] = useState<boolean>(false);
  const sessionStartTimeRef = useRef<number>(0);

  // LED command function
  const sendLedCommand = useCallback(async (padId: number, color: 'red' | 'green' | 'off') => {
    if (padId !== selectedPad) return;
    
    try {
      const device = connectedDevice[padId];
      if (!device) return;

      let command = '';
      switch (color) {
        case 'red':
          command = "wAAA";
          break;
        case 'green':
          command = "AAEA";
          break;
        case 'off':
          command = "AAAA";
          break;
      }

      await device.writeCharacteristic(CHARACTERISTIC.LED, command);
    } catch (error) {
      console.error(`Error sending LED command:`, error);
    }
  }, [connectedDevice, selectedPad]);

  const {
    gameState,
    currentRound,
    stats,
    config,
    startGame,
    stopGame,
    handlePadPress,
    resetStats,
    updateConfig,
    timeLeft,
  } = useForbiddenColorGame(sendLedCommand, selectedPad !== null ? [selectedPad] : []);

  // Initialize config from params
  useEffect(() => {
    // Parse and apply config from params
    if (params.config) {
      try {
        const parsedConfig = JSON.parse(params.config as string);
        console.log('📋 Parsed config from params:', parsedConfig);
        console.log('⏰ Session Time Limit from params:', parsedConfig.sessionTimeLimit);
        updateConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [params.config, updateConfig]);

  // Save session to backend
  const saveSessionToBackend = useCallback(async () => {
    if (selectedPad === null || stats.totalRounds === 0) return;
    if (isSessionSaved) {
      Alert.alert('บันทึกแล้ว', 'เซสชันนี้ถูกบันทึกแล้ว');
      return;
    }

    setIsSaving(true);
    setLastSaveStatus(null);

    try {
      const sessionDuration = sessionStartTimeRef.current > 0 
        ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000) 
        : 0;

      const sessionData = {
        padId: selectedPad,
        hitCount: stats.hitCount,
        missCount: stats.missCount,
        totalRounds: stats.totalRounds,
        accuracy: stats.accuracy,
        sessionStartTime: stats.sessionStartTime,
        sessionDuration: sessionDuration,
        averageReactionTime: stats.averageReactionTime,
        pressTimes: stats.pressTimes,
        pressRecords: stats.pressRecords.map(record => ({
          pressNumber: record.pressNumber,
          color: record.color,
          result: record.result,
          reactionTime: record.reactionTime,
          timestamp: record.timestamp,
        })),
        gameConfig: {
          redProbability: config.redProbability,
          redDisplayDuration: config.redDisplayDuration,
          greenTimeout: config.greenTimeout,
          enableGreenTimeout: config.enableGreenTimeout,
          sessionTimeLimit: config.sessionTimeLimit,
        },
      };

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ONE_PAD_MODE_SESSIONS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLastSaveStatus('success');
      setIsSessionSaved(true);
      
      Alert.alert('สำเร็จ', 'บันทึกเซสชันเกมสำเร็จ!');
    } catch (error) {
      console.error('❌ Error saving session:', error);
      setLastSaveStatus('error');
      Alert.alert('ข้อผิดพลาด', 'บันทึกเซสชันเกมไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  }, [selectedPad, stats, config, isSessionSaved]);

  // Button monitoring
  const lastButtonPressTime = useRef<number>(0);
  const hasInitializedButton = useRef<boolean>(false);
  const previousButtonState = useRef<boolean>(false);

  useEffect(() => {
    if (gameState === 'running' && selectedPad !== null && !hasInitializedButton.current) {
      const device = connectedDevice[selectedPad];
      if (device) {
        device.monitorButton();
        previousButtonState.current = device.button;
      }
      hasInitializedButton.current = true;
    } else if (gameState === 'idle' && hasInitializedButton.current) {
      hasInitializedButton.current = false;
      previousButtonState.current = false;
    }
  }, [connectedDevice, gameState, selectedPad]);

  useEffect(() => {
    if (gameState !== 'running' || selectedPad === null || !hasInitializedButton.current) return;

    const startDelay = setTimeout(() => {
      const monitorButton = () => {
        if (gameState !== 'running' || selectedPad === null) return;
        
        const device = connectedDevice[selectedPad];
        if (!device) return;

        const currentButtonState = device.button;
        const previousState = previousButtonState.current;
        
        if (currentButtonState && !previousState) {
          const currentTime = Date.now();
          
          if (currentTime - lastButtonPressTime.current > 500) {
            lastButtonPressTime.current = currentTime;
            handlePadPress(selectedPad);
          }
        }
        
        previousButtonState.current = currentButtonState;
      };

      const interval = setInterval(monitorButton, 100);
      
      return () => {
        clearInterval(interval);
        clearTimeout(startDelay);
      };
    }, 300);

    return () => clearTimeout(startDelay);
  }, [connectedDevice, gameState, selectedPad, handlePadPress]);

  const handleStopGame = useCallback(() => {
    stopGame();
  }, [stopGame]);

  const handleStartGame = useCallback(() => {
    console.log('🎮 Starting game...');
    resetStats();
    setIsSessionSaved(false);
    sessionStartTimeRef.current = Date.now();
    startGame();
  }, [resetStats, startGame]);

  const handleBackToSetup = useCallback(() => {
    if (gameState === 'running') {
      stopGame();
    }
    router.push('/(tabs)/ForbiddenColorMode');
  }, [gameState, stopGame, router]);
if (selectedPad === null) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>ไม่ได้เลือกแผ่นกด</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToSetup}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedView style={styles.headerContent}>
          <ThemedText style={styles.title}>โหมดแผ่นเดียว</ThemedText>
          {/* <ThemedText style={styles.subtitle}>Pad {selectedPad + 1}</ThemedText> */}
        </ThemedView>
        <ThemedView style={{ width: 40 }} />
      </ThemedView>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Configuration Display */}
        <ThemedView style={styles.configSection}>
          {/* <ThemedText style={styles.configTitle}>การตั้งค่า</ThemedText> */}
          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>แผ่นกด:</ThemedText>
            <ThemedText style={styles.configValue}>Pad {selectedPad + 1}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>โอกาสสีแดง:</ThemedText>
            <ThemedText style={styles.configValue}>{(config.redProbability * 100).toFixed(0)}%</ThemedText>
          </ThemedView>
          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>ระยะเวลาแสดงสีแดง:</ThemedText>
            <ThemedText style={styles.configValue}>{config.redDisplayDuration}ms</ThemedText>
          </ThemedView>
          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>หมดเวลาสีเขียว:</ThemedText>
            <ThemedText style={styles.configValue}>
              {config.enableGreenTimeout ? `${config.greenTimeout}ms` : 'ปิด'}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>ระยะเวลาเซสชัน:</ThemedText>
            <ThemedText style={styles.configValue}>
              {config.sessionTimeLimit > 0 ? `${config.sessionTimeLimit}s` : 'ไม่จำกัด'}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Countdown Timer */}
        {gameState === 'running' && config.sessionTimeLimit > 0 && (
          <ThemedView style={styles.timerCard}>
            <ThemedText style={styles.timerLabel}>เวลาที่เหลือ</ThemedText>
            <ThemedText style={[
              styles.timerValue,
              timeLeft <= 10 && styles.timerWarning,
              timeLeft <= 5 && styles.timerCritical
            ]}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </ThemedText>
          </ThemedView>
        )}

        {/* Game Status */}
        <ThemedView style={styles.statusCard}>
          <ThemedText style={styles.statusText}>
            {gameState === 'running' && currentRound?.isActive && 
              `${currentRound?.color.toUpperCase()}`
            }
            {gameState === 'running' && !currentRound?.isActive && 'เตรียมพร้อม...'}
            {gameState === 'idle' && 'หยุดเกม'}
          </ThemedText>
        </ThemedView>

        {/* Pad Display */}
        <ThemedView style={styles.padContainer}>
          <ThemedView 
            style={[
              styles.pad,
              currentRound?.isActive && currentRound?.color === 'red' && styles.padRed,
              currentRound?.isActive && currentRound?.color === 'green' && styles.padGreen,
              (!currentRound?.isActive || gameState === 'idle') && styles.padOff,
            ]}
          >
            <ThemedText style={styles.padNumber}>{selectedPad + 1}</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Statistics */}
        <ThemedView style={styles.statsCard}>
          <ThemedText style={styles.sectionTitle}>สถิติ</ThemedText>
          
          <ThemedView style={styles.statsRow}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{stats.hitCount}</ThemedText>
              <ThemedText style={styles.statLabel}>ฮิต</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{stats.missCount}</ThemedText>
              <ThemedText style={styles.statLabel}>พลาด</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{stats.accuracy.toFixed(1)}%</ThemedText>
              <ThemedText style={styles.statLabel}>ความแม่นยำ</ThemedText>
            </ThemedView>
          </ThemedView>
          
          {stats.averageReactionTime > 0 && (
            <ThemedView style={styles.reactionTimeRow}>
              <ThemedText style={styles.reactionTimeLabel}>
                ปฏิกิริยาเฉลี่ย: {stats.averageReactionTime}ms
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Press Records */}
        {stats.pressRecords && stats.pressRecords.length > 0 && (
          <ThemedView style={styles.pressTimesContainer}>
            <ThemedText style={styles.pressTimesTitle}>ประวัติการกด</ThemedText>
            <ThemedView style={styles.pressTimesList}>
              {stats.pressRecords.slice(-10).reverse().map((record, index) => (
                <ThemedView 
                  key={index} 
                  style={[
                    styles.pressTimeItem,
                    record.result === 'hit' ? styles.pressTimeItemHit : styles.pressTimeItemMiss
                  ]}
                >
                  <ThemedText style={styles.pressTimeText}>
                    {record.color.toUpperCase()}: {record.result === 'hit' ? '✓' : '✗'} 
                    {record.reactionTime > 0 ? ` ${record.reactionTime}ms` : ' timeout'}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        )}
      </ScrollView>

      {/* Fixed Bottom Controls */}
      <ThemedView style={styles.bottomControls}>
        {gameState === 'running' ? (
          <ThemedView style={[styles.button, styles.stopButton]} onTouchEnd={handleStopGame}>
            <ThemedText style={styles.buttonText}>หยุดเกม</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.idleButtons}>
            {stats.totalRounds > 0 && !isSessionSaved && (
              <ThemedView 
                style={[styles.button, styles.saveButton, isSaving && styles.disabledButton]}
                onTouchEnd={!isSaving ? saveSessionToBackend : undefined}
              >
                <ThemedText style={styles.buttonText}>
                  {isSaving ? 'กำลังบันทึก...' : '💾 บันทึกเซสชัน'}
                </ThemedText>
              </ThemedView>
            )}
            <ThemedView 
              style={[styles.button, styles.startButton]}
              onTouchEnd={handleStartGame}
            >
              <ThemedText style={styles.buttonText}>
                เริ่มเกม
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#4e54a3',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  configSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
  },
  configValue: {
    fontSize: 14,
    color: '#4e54a3',
    fontWeight: '500',
  },
  timerCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4e54a3',
  },
  timerLabel: {
    fontSize: 14,
    color: '#4e54a3',
    fontWeight: '600',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 36,
    color: '#4e54a3',
    fontWeight: 'bold',
    letterSpacing: 2,
    lineHeight: 48,
  },
  timerWarning: {
    color: '#f59e0b',
  },
  timerCritical: {
    color: '#e63946',
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
  },
  padContainer: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  pad: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4e54a3',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
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
    fontSize: 13,
    color: '#666',
  },
  reactionTimeRow: {
    marginTop: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  reactionTimeLabel: {
    fontSize: 14,
    color: '#4e54a3',
    fontWeight: '600',
  },
  pressTimesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  pressTimesTitle: {
    fontSize: 15,
    color: '#4e54a3',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  pressTimesList: {
    backgroundColor: 'transparent',
    gap: 6,
  },
  pressTimeItem: {
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    paddingVertical: 8,
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
    color: '#333',
    fontWeight: '500',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  idleButtons: {
    gap: 12,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
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
  stopButton: {
    backgroundColor: '#e63946',
  },
  startButton: {
    backgroundColor: '#2b8a3e',
  },
  saveButton: {
    backgroundColor: '#20c997',
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
  errorText: {
    fontSize: 16,
    color: '#e63946',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default OnePadGameplayScreen;
