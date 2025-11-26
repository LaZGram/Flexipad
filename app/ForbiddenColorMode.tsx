import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useForbiddenColorGame } from '@/hooks/useForbiddenColorGame';
import { useBleManager, ConnectedDevice } from '@/components/context/blecontext';
import { CHARACTERISTIC } from '@/enum/characteristic';

const ForbiddenColorModeScreen = () => {
  const { connectedDevice } = useBleManager();
  const buttonLogsRef = useRef<string[]>([]);
  const mountedRef = useRef<boolean>(true);

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

  const {
    gameState,
    currentRound,
    stats,
    config,
    startGame,
    stopGame,
    handlePadPress,
    updateConfig,
    resetStats,
    timeLeft
  } = useForbiddenColorGame(sendLedCommand, availablePads);

  // Monitor button presses from connected devices
  const lastButtonPressTime = useRef<number[]>(new Array(9).fill(0));
  const hasInitializedButtons = useRef<boolean>(false);
  const previousButtonStates = useRef<boolean[]>(new Array(9).fill(false));

  // Set up button monitoring for all connected devices - only when game starts
  useEffect(() => {
    if (gameState === 'running' && !hasInitializedButtons.current) {
      console.log('🔧 Initializing button monitoring for game...');
      
      // Reset button press times
      lastButtonPressTime.current = new Array(9).fill(0);
      
      // Initialize previous button states to current states to prevent false triggers
      connectedDevice.forEach((device, index) => {
        if (device) {
          // Monitor button state for this pad
          device.monitorButton();
          console.log(`🔘 Started monitoring pad ${index + 1}`);
          
          // Initialize previous state to current state to prevent false triggers
          previousButtonStates.current[index] = device.button;
          console.log(`📋 Initialized pad ${index + 1} button state to: ${device.button}`);
        }
      });
      
      hasInitializedButtons.current = true;
    } else if (gameState === 'idle' && hasInitializedButtons.current) {
      console.log('🔧 Stopping button monitoring...');
      hasInitializedButtons.current = false;
      // Reset previous states
      previousButtonStates.current = new Array(9).fill(false);
    }
  }, [connectedDevice, gameState]);

  // Monitor button state changes for input detection
  useEffect(() => {
    if (gameState !== 'running' || !hasInitializedButtons.current) return;

    // Add initial delay to prevent false triggers on game start
    const startDelay = setTimeout(() => {      
      const monitorButtonPresses = () => {
        if (gameState !== 'running') return; // Double check
        
        const currentTime = Date.now();
        
        connectedDevice.forEach((device, index) => {
          if (device) {
            const currentButtonState = device.button;
            const previousButtonState = previousButtonStates.current[index];
            
            // Only process if button state changed from false to true (press event)
            if (currentButtonState && !previousButtonState) {
              const lastPressTime = lastButtonPressTime.current[index];
              
              // Detect button press with debouncing (minimum 500ms between presses)
              if (currentTime - lastPressTime > 500) {
                console.log(`🔘 Button ${index + 1} pressed - triggering handlePadPress`);
                lastButtonPressTime.current[index] = currentTime;
                handlePadPress(index);
              } else {
                console.log(`🔘 Button ${index + 1} press ignored (debounced)`);
              }
            } else if (currentButtonState !== previousButtonState) {
              console.log(`🔍 Pad ${index + 1} state change: ${previousButtonState} → ${currentButtonState}`);
            }
            
            // Update previous state
            previousButtonStates.current[index] = currentButtonState;
          }
        });
      };

      const interval = setInterval(monitorButtonPresses, 100);
      
      return () => {
        clearInterval(interval);
        clearTimeout(startDelay);
      };
    }, 1500); // Wait 1.5 seconds after game start before monitoring buttons

    return () => clearTimeout(startDelay);
  }, [connectedDevice, gameState, handlePadPress]);

  // Update config when available pads change
  useEffect(() => {
    if (availablePads.length > 0 && config.totalPads !== availablePads.length) {
      updateConfig({ totalPads: availablePads.length });
    }
  }, [availablePads.length, config.totalPads, updateConfig]);

  // Create a stable ref to stopGame for cleanup
  const stopGameRef = useRef(stopGame);
  stopGameRef.current = stopGame;

  // Cleanup on unmount only (not on re-renders)
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      console.log('🧹 Component unmounting - stopping game');
      // Add delay to ensure this is actual unmount, not React StrictMode
      setTimeout(() => {
        if (!mountedRef.current) {
          stopGameRef.current();
        }
      }, 100);
    };
  }, []); // Remove dependencies to only run on actual unmount

  const handleStartGame = useCallback(() => {
    if (gameState === 'idle') {
      startGame();
    } else {
      stopGame();
    }
  }, [gameState, startGame, stopGame]);

  const handleGoBack = useCallback(() => {
    if (gameState === 'running') {
      Alert.alert(
        'Game in Progress',
        'Are you sure you want to stop the game and go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop Game', style: 'destructive', onPress: () => {
            stopGame();
            router.back();
          }}
        ]
      );
    } else {
      router.back();
    }
  }, [gameState, stopGame]);

  const handleConfigChange = useCallback((key: string, value: number | boolean) => {
    updateConfig({ [key]: value });
  }, [updateConfig]);

  const formatAccuracy = (accuracy: number) => {
    return `${accuracy.toFixed(1)}%`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Forbidden Color</ThemedText>
          <ThemedText style={styles.subtitle}>
            Hit GREEN pads, avoid RED pads
          </ThemedText>
          <ThemedText style={styles.connectionInfo}>
            Connected Pads: {availablePads.length}
          </ThemedText>
        </ThemedView>

        {/* Game Status */}
        <ThemedView style={styles.statusCard}>
          <ThemedText style={styles.statusTitle}>Game Status</ThemedText>
          <ThemedText style={styles.statusText}>
            {gameState === 'idle' && 'Ready to start'}
            {gameState === 'running' && currentRound && 
              `Pad ${currentRound.padId + 1}: ${currentRound.color.toUpperCase()}`
            }
            {gameState === 'running' && !currentRound && 'Starting next round...'}
          </ThemedText>
          {gameState === 'running' && config.sessionTimeLimit > 0 && (
            <ThemedText style={[styles.statusText, styles.timeText]}>
              ⏰ Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </ThemedText>
          )}
        </ThemedView>

        {/* Pad Visualization */}
        <ThemedView style={styles.padContainer}>
          <ThemedText style={styles.sectionTitle}>Pads</ThemedText>
          {availablePads.length === 0 ? (
            <ThemedText style={styles.noPadsText}>
              No pads connected. Please connect devices to play.
            </ThemedText>
          ) : (
            <ThemedView style={styles.padsGrid}>
              {availablePads.map((padIndex) => {
                const isActive = currentRound?.padId === padIndex && currentRound?.isActive;
                const currentColor = isActive ? currentRound?.color : 'off';
                
                return (
                  <ThemedView 
                    key={padIndex} 
                    style={[
                      styles.pad,
                      currentColor === 'red' && styles.padRed,
                      currentColor === 'green' && styles.padGreen,
                      currentColor === 'off' && styles.padOff,
                    ]}
                  >
                    <ThemedText style={styles.padNumber}>{padIndex + 1}</ThemedText>
                  </ThemedView>
                );
              })}
            </ThemedView>
          )}
        </ThemedView>

        {/* Statistics */}
        <ThemedView style={styles.statsCard}>
          <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>
          <ThemedView style={styles.statsRow}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{stats.hitCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Hits</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{stats.missCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Misses</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{formatAccuracy(stats.accuracy)}</ThemedText>
              <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
            </ThemedView>
          </ThemedView>
          {stats.averageReactionTime > 0 && (
            <ThemedView style={styles.reactionTimeRow}>
              <ThemedText style={styles.reactionTimeLabel}>
                Avg Reaction Time: {stats.averageReactionTime}ms
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Configuration */}
        <ThemedView style={styles.configCard}>
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
          
          <ThemedView style={styles.configItem}>
            <ThemedText style={styles.configLabel}>
              Session Time Limit: {config.sessionTimeLimit === 0 ? 'Unlimited' : `${config.sessionTimeLimit}s`}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.configItem}>
            <ThemedText style={styles.configLabel}>
              Red Probability: {(config.redProbability * 100).toFixed(0)}%
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.configItem}>
            <ThemedText style={styles.configLabel}>
              Red Duration: {(config.redDisplayDuration / 1000).toFixed(1)}s
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.configItem}>
            <ThemedText style={styles.configLabel}>
              Green Timeout: {config.enableGreenTimeout ? (config.greenTimeout / 1000).toFixed(1) + 's' : 'Off'}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.configItem}>
            <ThemedText style={styles.configLabel}>
              Max Round Time: {(config.roundTimeLimit / 1000).toFixed(1)}s
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Controls */}
        <ThemedView style={styles.controls}>
          <ThemedView 
            style={[
              styles.button, 
              gameState === 'running' ? styles.stopButton : styles.startButton,
              availablePads.length === 0 && styles.disabledButton
            ]}
            onTouchEnd={availablePads.length > 0 ? handleStartGame : undefined}
          >
            <ThemedText style={styles.buttonText}>
              {gameState === 'running' ? 'Stop Game' : 'Start Game'}
            </ThemedText>
          </ThemedView>

          <ThemedView 
            style={[styles.button, styles.resetButton]}
            onTouchEnd={resetStats}
          >
            <ThemedText style={styles.buttonText}>Reset Stats</ThemedText>
          </ThemedView>

          <ThemedView 
            style={[styles.button, styles.backButton]}
            onTouchEnd={handleGoBack}
          >
            <ThemedText style={styles.buttonText}>Back to Menu</ThemedText>
          </ThemedView>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4e54a3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  connectionInfo: {
    fontSize: 14,
    color: '#4e54a3',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  noPadsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
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
    gap: 16,
    backgroundColor: 'transparent',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
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
    backgroundColor: '#adb5bd',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ForbiddenColorModeScreen;