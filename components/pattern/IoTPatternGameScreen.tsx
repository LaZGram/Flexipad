import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useBleManager, ConnectedDevice } from '@/components/context/blecontext';
import { CHARACTERISTIC } from '@/enum/characteristic';
import { PatternModeState } from './types';

// IoT Pattern Mode Game Screen
interface IoTPatternGameScreenProps {
  config: PatternModeState;
  onBack: () => void;
}

// Game state interface
interface GameState {
  isPlaying: boolean;
  level: number;
  currentPattern: number[];
  currentStep: number;
  lastEvent: string;
}

const IoTPatternGameScreen: React.FC<IoTPatternGameScreenProps> = ({ config, onBack }) => {
  // Use the BLE manager hook
  const { connectedDevice } = useBleManager();
  
  // Game state with logging wrapper
  const [gameState, setGameStateRaw] = useState<GameState>({
    isPlaying: false,
    level: 1,
    currentPattern: [],
    currentStep: 0,
    lastEvent: 'Ready to start Pattern Mode with IoT pads',
  });

  // Wrapper to log all state changes
  const setGameState = useCallback((update: React.SetStateAction<GameState>) => {
    if (typeof update === 'function') {
      setGameStateRaw(prev => {
        const newState = update(prev);
        console.log(`🔧 setState (function): pattern ${prev.currentPattern.join(',')} -> ${newState.currentPattern.join(',')}, step ${prev.currentStep} -> ${newState.currentStep}`);
        return newState;
      });
    } else {
      console.log(`🔧 setState (direct): pattern -> [${update.currentPattern.join(',')}], step -> ${update.currentStep}`);
      setGameStateRaw(update);
    }
  }, []);

  // Add effect to monitor gameState changes
  useEffect(() => {
    console.log(`🔍 GameState changed: isPlaying=${gameState.isPlaying}, level=${gameState.level}, currentStep=${gameState.currentStep}, pattern=[${gameState.currentPattern.join(', ')}], patternLength=${gameState.currentPattern.length}`);
  }, [gameState]);

  // Ref to track previous button states
  const previousButtonStates = useRef<boolean[]>(new Array(9).fill(false));
  
  // Ref to track current lit pad to prevent duplicate commands
  const currentLitPad = useRef<number>(-1);
  
  // Ref to track if we're in the input phase (prevents auto-play during pattern display)
  const isInputPhaseActive = useRef<boolean>(false);
  
  // Ref to debounce button presses
  const lastButtonPressTime = useRef<number[]>(new Array(9).fill(0));
  
  // Monitor button state for all connected pads
  useEffect(() => {
    const connectedPads = connectedDevice.filter(device => device !== null);
    connectedPads.forEach((device, index) => {
      if (device) {
        // Monitor button state for this pad
        device.monitorButton();
      }
    });
  }, [connectedDevice]);

  // Blink function for error feedback (adapted from start.tsx)
  const blinkPadError = async (device: ConnectedDevice) => {
    try {
      console.log("Blinking error feedback");
      const redColor = "/wAB";
      const offColor = "AAAA";
      for (let i = 0; i < 6; i++) {
        await device.writeCharacteristic(CHARACTERISTIC.LED, redColor);
        await new Promise((resolve) => setTimeout(resolve, 150));
        await device.writeCharacteristic(CHARACTERISTIC.LED, offColor);
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.error("Error in blink feedback:", error);
    }
  };

  // Get available connected pads with proper typing
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

  // Generate a random pattern for the current level
  const generatePattern = (level: number): number[] => {
    const connectedPads = getConnectedPadIds();
    if (connectedPads.length === 0) {
      Alert.alert('No Connected Pads', 'Please connect IoT pads before starting Pattern Mode');
      return [];
    }

    const patternLength = config.initialSequenceLength + (level - 1) * config.padIncrementPerLevel;
    const pattern: number[] = [];
    
    for (let i = 0; i < Math.min(patternLength, config.maxSequenceLength); i++) {
      const randomIndex = Math.floor(Math.random() * connectedPads.length);
      pattern.push(connectedPads[randomIndex]);
    }
    
    return pattern;
  };

  // Send command to IoT pad with proper color mapping
  const sendPadCommand = async (padIndex: number, command: string) => {
    const device = connectedDevice[padIndex];
    if (!device || !device.device) return;

    try {
      console.log(`Sending command "${command}" to pad ${padIndex + 1}`);
      
      // Map commands to actual BLE commands with proper colors
      switch (command) {
        case 'PATTERN_DISPLAY_ON':
          // RED light for pattern display phase
          await device.writeCharacteristic(CHARACTERISTIC.LED, "wAAA"); // Red LED
          break;
        case 'PATTERN_DISPLAY_OFF':
        case 'LIGHT_OFF':
          // Turn off LED
          await device.writeCharacteristic(CHARACTERISTIC.LED, "AAAA");
          break;
        case 'CORRECT_FEEDBACK':
          // BLUE light for correct player input
          await device.writeCharacteristic(CHARACTERISTIC.LED, "AAD/"); // Blue LED
          break;
        case 'ERROR_FEEDBACK':
          // Red blinking feedback for error
          await blinkPadError(device);
          break;
      }
    } catch (error) {
      console.error(`Failed to send command to pad ${padIndex}:`, error);
    }
  };

  // Phase 1: Show pattern using RED lights
  const showPatternDisplay = async (pattern: number[]) => {
    console.log(`\n=== PATTERN DISPLAY PHASE ===`);
    console.log(`🔍 showPatternDisplay received pattern: [${pattern.join(', ')}] (length: ${pattern.length})`);
    console.log(`🔍 Current gameState.currentPattern: [${gameState.currentPattern.join(', ')}] (length: ${gameState.currentPattern.length})`);
    console.log(`Pattern array (0-based): [${pattern.join(', ')}]`);
    console.log(`Showing pattern: [${pattern.map(p => `Pad ${p + 1}`).join(', ')}]`);
    
    // Show each pad in the pattern sequence with RED lights
    for (let i = 0; i < pattern.length; i++) {
      const padIndex = pattern[i];
      console.log(`Step ${i + 1}/${pattern.length}: Lighting Pad ${padIndex + 1} in RED`);
      
      // Turn on RED light for this pad
      await sendPadCommand(padIndex, 'PATTERN_DISPLAY_ON');
      
      // Wait for display duration (500-800ms as requested)
      await new Promise(resolve => setTimeout(resolve, config.showPatternDurationMs || 600));
      
      // Turn off the light
      await sendPadCommand(padIndex, 'PATTERN_DISPLAY_OFF');
      
      // Small gap between steps (if not the last step)
      if (i < pattern.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.stepTimingMs || 300));
      }
    }
    
    // Ensure ALL LEDs are off before moving to input phase
    console.log('Pattern display complete - turning off all LEDs');
    await turnOffAllPads();
    
    // Brief pause before input phase (reduced from 500ms to 200ms)
    // await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`=== PLAYER INPUT PHASE ===`);
    console.log(`Waiting for player to repeat pattern...`);
    
    // Now activate input phase - this is when we start listening for button presses
    isInputPhaseActive.current = true;
    console.log(`🎯 Input phase activated - ready for player input`);
  };

  // Turn off all connected pads
  const turnOffAllPads = async () => {
    const promises = connectedDevice.map(async (device, index) => {
      if (device && device.device) {
        await sendPadCommand(index, 'LIGHT_OFF');
      }
    });
    await Promise.all(promises);
    currentLitPad.current = -1;
  };

  // Start a new game
  const startGame = async () => {
    const connectedPads = getConnectedPadIds();
    if (connectedPads.length === 0) {
      Alert.alert('No Connected Pads', 'Please connect IoT pads before starting Pattern Mode');
      return;
    }

    const newPattern = generatePattern(1);
    if (newPattern.length === 0) return;

    console.log(`🎮 Starting game with pattern: [${newPattern.join(', ')}] -> [${newPattern.map(p => `Pad ${p + 1}`).join(', ')}]`);

    // Reset all button states and timing to prevent auto-play
    previousButtonStates.current = new Array(9).fill(false);
    lastButtonPressTime.current = new Array(9).fill(0);
    isInputPhaseActive.current = false;
    
    // Initialize current button states to prevent false triggers
    if (Array.isArray(connectedDevice)) {
      connectedDevice.forEach((device, index) => {
        if (device && device.device) {
          previousButtonStates.current[index] = device.button || false;
        }
      });
    }

    setGameState({
      isPlaying: true,
      level: 1,
      currentPattern: newPattern,
      currentStep: 0,
      lastEvent: `Level 1 started! Pattern: [${newPattern.map(p => `Pad ${p + 1}`).join(', ')}]`,
    });

    // Start with pattern display phase (reduced delay for faster start)
    setTimeout(async () => {
      console.log(`🔄 About to display pattern: [${newPattern.join(', ')}]`);
      await showPatternDisplay(newPattern);
      // After pattern display, we wait for user input (no active lights)
    }, 10);
  };

  // Stop the game
  const stopGame = () => {
    // Turn off all pad lights
    currentLitPad.current = -1; // Reset lit pad tracking
    isInputPhaseActive.current = false; // Deactivate input phase
    
    if (Array.isArray(connectedDevice)) {
      connectedDevice.forEach((device: ConnectedDevice | null, index: number) => {
        if (device) {
          // Direct LED off command to avoid duplicate prevention
          device.writeCharacteristic(CHARACTERISTIC.LED, "AAAA").catch(console.error);
        }
      });
    }
    
    setGameState({
      isPlaying: false,
      level: 1,
      currentPattern: [],
      currentStep: 0,
      lastEvent: 'Game stopped',
    });
  };

  // Handle pad press from IoT device with BLUE feedback
  const handlePadPress = useCallback(async (pressedPadIndex: number) => {
    console.log(`🚨 HANDLEPADPRESS START: pressedPadIndex=${pressedPadIndex}, gameState.currentPattern=[${gameState.currentPattern.join(', ')}]`);
    
    if (!gameState.isPlaying) {
      console.log(`⚠️ Game not playing, ignoring pad press`);
      return;
    }
    
    // Use the pattern from gameState directly (don't rely on closures)
    const currentPattern = gameState.currentPattern;
    const currentStep = gameState.currentStep;
    
    if (currentPattern.length === 0) {
      console.log(`⚠️ No pattern available, ignoring pad press`);
      return;
    }
    
    const expectedPadIndex = currentPattern[currentStep];
    const stepDisplay = currentStep + 1;
    const totalSteps = currentPattern.length;
    
    console.log(`\nPad ${pressedPadIndex + 1} pressed (Step ${stepDisplay}/${totalSteps})`);
    console.log(`Pattern array: [${currentPattern.join(', ')}]`);
    console.log(`Current step: ${currentStep}, Expected index: ${expectedPadIndex}, Pressed index: ${pressedPadIndex}`);
    console.log(`Expected: Pad ${expectedPadIndex + 1}, Got: Pad ${pressedPadIndex + 1}`);
    
    if (pressedPadIndex === expectedPadIndex) {
      // Correct pad pressed - give BLUE feedback
      console.log(`✅ Correct! Giving BLUE feedback`);
      
      // Send BLUE light feedback
      await sendPadCommand(pressedPadIndex, 'CORRECT_FEEDBACK');
      
      // Turn off BLUE light after short moment (reduced for snappier feedback)
      setTimeout(async () => {
        await sendPadCommand(pressedPadIndex, 'LIGHT_OFF');
      }, 300);
      
      if (currentStep === currentPattern.length - 1) {
        // Pattern completed successfully!
        console.log(`🎉 Pattern completed! Advancing to next level`);
        
        const nextLevel = gameState.level + 1;
        
        // Check if we've reached the maximum level
        if (nextLevel > config.maxLevel) {
          // Game completed
          setGameState(prev => ({
            ...prev,
            isPlaying: false,
            lastEvent: `🎉 Congratulations! You completed all ${config.maxLevel} levels! Game finished!`,
          }));
          await turnOffAllPads();
          return;
        }
        
        // Generate new pattern for next level
        const newPattern = generatePattern(nextLevel);
        setGameState(prev => ({
          ...prev,
          level: nextLevel,
          currentPattern: newPattern,
          currentStep: 0,
          lastEvent: `Level ${nextLevel} started! Pattern: [${newPattern.map(p => `Pad ${p + 1}`).join(', ')}]`,
        }));
        
        // Show new pattern after delay (reduced for faster progression)
        setTimeout(async () => {
          console.log(`\n=== LEVEL ${nextLevel} ===`);
          isInputPhaseActive.current = false; // Reset input phase before showing pattern
          await showPatternDisplay(newPattern);
        }, 800);
      } else {
        // Continue to next step in current pattern
        const nextStep = currentStep + 1;
        const nextTarget = currentPattern[nextStep];
        
        setGameState(prev => ({
          ...prev,
          currentStep: nextStep,
          lastEvent: `Correct! Next target: Pad ${nextTarget + 1} (${nextStep + 1}/${totalSteps})`,
        }));
        
        console.log(`Moving to step ${nextStep + 1}/${totalSteps}, waiting for Pad ${nextTarget + 1}`);
      }
    } else {
      // Wrong pad pressed
      console.log(`❌ Wrong pad! Giving error feedback`);
      await sendPadCommand(pressedPadIndex, 'ERROR_FEEDBACK');
      
      if (config.mistakeBehavior === 'restart') {
        // Restart from Level 1 completely
        console.log(`Restarting from Level 1 due to mistake`);
        const newPattern = generatePattern(1);
        setGameState(prev => ({
          ...prev,
          level: 1,
          currentPattern: newPattern,
          currentStep: 0,
          lastEvent: `Wrong pad! Restarting from Level 1. Pattern: [${newPattern.map(p => `Pad ${p + 1}`).join(', ')}]`,
        }));
        setTimeout(async () => {
          isInputPhaseActive.current = false; // Reset input phase before showing pattern
          await showPatternDisplay(newPattern);
        }, 800);
      } else {
        // Continue - restart current pattern from the beginning
        console.log(`Restarting current pattern from beginning`);
        const currentPatternCopy = [...gameState.currentPattern]; // Save current pattern
        setGameState(prev => ({
          ...prev,
          currentStep: 0, // Reset to beginning of current pattern
          lastEvent: `Wrong pad! Restarting current pattern. Pattern: [${prev.currentPattern.map(p => `Pad ${p + 1}`).join(', ')}]`,
        }));
        setTimeout(async () => {
          console.log(`🔄 Restarting with current pattern: [${currentPatternCopy.join(', ')}]`);
          isInputPhaseActive.current = false; // Reset input phase before showing pattern
          await showPatternDisplay(currentPatternCopy);
        }, 600);
      }
    }
  }, [gameState, config, sendPadCommand, turnOffAllPads, generatePattern, showPatternDisplay]);
  
  // Monitor button presses from connected pads using button state polling
  useEffect(() => {
    if (!gameState.isPlaying) return;
    
    const checkButtonStates = () => {
      // Only check button states if we're in the input phase
      if (!isInputPhaseActive.current) {
        // During pattern display phase, just update button states without triggering actions
        connectedDevice.forEach((device, index) => {
          if (device && device.device) {
            previousButtonStates.current[index] = device.button || false;
          }
        });
        return;
      }
      
      connectedDevice.forEach((device, index) => {
        if (device && device.device) {
          const currentButtonState = device.button || false;
          const previousState = previousButtonStates.current[index];
          const currentTime = Date.now();
          const lastPressTime = lastButtonPressTime.current[index];
          
          // Detect button press (transition from false to true) with debouncing
          if (currentButtonState && !previousState) {
            // Debounce: ignore if pressed too recently (within 200ms)
            if (currentTime - lastPressTime > 200) {
              console.log(`🔘 Button ${index + 1} pressed - triggering handlePadPress`);
              lastButtonPressTime.current[index] = currentTime;
              handlePadPress(index);
            } else {
              console.log(`🔘 Button ${index + 1} press ignored (debounced)`);
            }
          }
          
          previousButtonStates.current[index] = currentButtonState;
        }
      });
    };
    
    // Check button states every 100ms
    const interval = setInterval(checkButtonStates, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [gameState.isPlaying, handlePadPress, connectedDevice]);

  // Get current target pad
  const getCurrentTarget = (): number => {
    if (!gameState.isPlaying || gameState.currentPattern.length === 0) return -1;
    return gameState.currentPattern[gameState.currentStep] || -1;
  };

  const currentTarget = getCurrentTarget();
  const availablePads = getConnectedPadIds();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>IoT Pattern Mode</Text>
          <Text style={styles.subtitle}>Connected Pads: {availablePads.length}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Configuration Display */}
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Game Configuration</Text>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Pads per Level:</Text>
          <Text style={styles.configValue}>+{config.padIncrementPerLevel}</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>On Mistake:</Text>
          <Text style={styles.configValue}>
            {config.mistakeBehavior === 'restart' ? 'Restart from Level 1' : 'Continue until correct'}
          </Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Input Timeout:</Text>
          <Text style={styles.configValue}>{config.inputTimeoutMs}ms</Text>
        </View>
      </View>

      {/* Game Status */}
      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Level</Text>
            <Text style={styles.statusValue}>{gameState.level}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Step</Text>
            <Text style={styles.statusValue}>
              {gameState.isPlaying ? `${gameState.currentStep + 1}/${gameState.currentPattern.length}` : '0/0'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Target</Text>
            <Text style={styles.statusValue}>
              {currentTarget >= 0 ? `Pad ${currentTarget + 1}` : '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* Connected Pads Display */}
      <View style={styles.padsSection}>
        <Text style={styles.padsTitle}>Connected IoT Pads</Text>
        <View style={styles.padsContainer}>
          {availablePads.length === 0 ? (
            <Text style={styles.noPadsText}>No connected pads. Please connect IoT pads to play.</Text>
          ) : (
            <View style={styles.padsGrid}>
              {availablePads.map((padIndex) => (
                <TouchableOpacity
                  key={padIndex}
                  style={[
                    styles.padButton,
                    currentTarget === padIndex && styles.targetPadButton,
                  ]}
                  onPress={() => handlePadPress(padIndex)}
                  disabled={!gameState.isPlaying}
                >
                  <Text style={[
                    styles.padButtonText,
                    currentTarget === padIndex && styles.targetPadButtonText,
                  ]}>
                    Pad {padIndex + 1}
                  </Text>
                  <Text style={styles.padStatus}>
                    {Array.isArray(connectedDevice) && connectedDevice[padIndex] ? '🟢 Connected' : '🔴 Disconnected'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Game Controls */}
      <View style={styles.controlsSection}>
        {!gameState.isPlaying ? (
          <TouchableOpacity 
            style={[styles.startButton, availablePads.length === 0 && styles.disabledButton]} 
            onPress={startGame}
            disabled={availablePads.length === 0}
          >
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Pattern Mode</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopGame}>
            <MaterialIcons name="stop" size={24} color="#fff" />
            <Text style={styles.stopButtonText}>Stop Game</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Event Log */}
      <View style={styles.eventSection}>
        <Text style={styles.eventTitle}>Game Events</Text>
        <Text style={styles.eventText}>{gameState.lastEvent}</Text>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFA500',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  configSection: {
    backgroundColor: '#fff',
    margin: 16,
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
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
  },
  configValue: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '500',
  },
  statusSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  padsSection: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  padsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  padsContainer: {
    flex: 1,
  },
  noPadsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 40,
  },
  padsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  padButton: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  targetPadButton: {
    backgroundColor: '#FFA500',
    borderColor: '#FF8C00',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  padButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  targetPadButtonText: {
    color: '#fff',
  },
  padStatus: {
    fontSize: 10,
    color: '#999',
  },
  controlsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  eventSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default IoTPatternGameScreen;