import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useBleManager, ConnectedDevice } from '@/components/context/blecontext';
import { CHARACTERISTIC } from '@/enum/characteristic';
import { PatternModeState } from './types';
import { hexToBase64 } from '@/util/encode';
import { ApiService } from '@/services/api.service';

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

// Level statistics tracking
interface LevelStats {
  level: number;
  startTime: number;
  endTime?: number;
  timeSpent?: number; // in milliseconds (only successful attempt)
  accumulatedFailedTime: number; // Time spent on failed attempts
  failureCount: number;
  completed: boolean;
}

// Session statistics
interface SessionStats {
  sessionStartTime: number;
  sessionEndTime?: number;
  totalTimeSpent?: number;
  levelStats: LevelStats[];
  gameMode: 'continue' | 'restart';
  finalLevel: number;
}

const IoTPatternGameScreen: React.FC<IoTPatternGameScreenProps> = ({ config, onBack }) => {
  // Use the BLE manager hook
  const { connectedDevice } = useBleManager();
  
  // Session statistics tracking
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    sessionStartTime: 0,
    levelStats: [],
    gameMode: 'continue',
    finalLevel: 0,
  });
  
  // Current level stats ref for real-time updates
  const currentLevelStatsRef = useRef<LevelStats | null>(null);
  
  // Save status tracking
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showNameInputModal, setShowNameInputModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const completedSessionStatsRef = useRef<SessionStats | null>(null);
  
  // Game state with logging wrapper
  const [gameState, setGameStateRaw] = useState<GameState>({
    isPlaying: false,
    level: 1,
    currentPattern: [],
    currentStep: 0,
    lastEvent: 'เชื่อมต่อ Pad เรียบร้อย พร้อมเริ่มโหมดจดจำรูปแบบ',
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
  
  // State to track which pad is currently being displayed during pattern phase
  const [displayingPadIndex, setDisplayingPadIndex] = useState<number>(-1);
  
  // Ref to debounce button presses
  const lastButtonPressTime = useRef<number[]>(new Array(9).fill(0));
  
  // Ref to track the 3-second timeout timer
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track all game timers that need to be cancelled on stop
  const nextLevelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startGameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track if game should continue (avoids stale closure issues)
  const shouldContinueGame = useRef<boolean>(false);
  
  // Play music/beep sound on all connected devices
  const playReadyBeep = async () => {
    try {
      console.log('🔔 Playing "ready to start" beep on all pads');
      const promises = connectedDevice.map(async (device) => {
        if (device && device.device) {
          // Send music/beep signal
          await device.writeCharacteristic(CHARACTERISTIC.MUSIC, hexToBase64("616161"));
          await new Promise((resolve) => setTimeout(resolve, 10));
          await device.writeCharacteristic(CHARACTERISTIC.MUSIC, hexToBase64("0"));
        }
      });
      await Promise.all(promises);
      console.log('🔔 Ready beep played successfully');
    } catch (error) {
      console.error('Error playing ready beep:', error);
    }
  };
  
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
    // Check if we have pre-defined level patterns
    if (config.levelPatterns && config.levelPatterns.length > 0) {
      const levelPattern = config.levelPatterns.find(lp => lp.level === level);
      if (levelPattern) {
        console.log(`📋 Using pre-defined pattern for level ${level}: [${levelPattern.pattern.join(', ')}]`);
        return levelPattern.pattern;
      }
    }

    // Otherwise, generate random pattern (existing behavior)
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
    
    console.log(`🎲 Generated random pattern for level ${level}: [${pattern.join(', ')}]`);
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
          // BLUE light for pattern display phase
          await device.writeCharacteristic(CHARACTERISTIC.LED, "AAD/"); // Red LED
          break;
        case 'PATTERN_DISPLAY_OFF':
        case 'LIGHT_OFF':
          // Turn off LED
          await device.writeCharacteristic(CHARACTERISTIC.LED, "AAAA");
          break;
        case 'CORRECT_FEEDBACK':
          // BLUE light for correct player input
          await device.writeCharacteristic(CHARACTERISTIC.LED, "AP8A"); // Blue LED
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
      
      // Highlight this pad in the UI
      setDisplayingPadIndex(padIndex);
      
      // Turn on RED light for this pad
      await sendPadCommand(padIndex, 'PATTERN_DISPLAY_ON');
      
      // Wait for display duration (500-800ms as requested)
      await new Promise(resolve => setTimeout(resolve, config.showPatternDurationMs || 600));
      
      // Turn off the light
      await sendPadCommand(padIndex, 'PATTERN_DISPLAY_OFF');
      
      // Clear UI highlight
      setDisplayingPadIndex(-1);
      
      // Small gap between steps (if not the last step)
      if (i < pattern.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.stepTimingMs || 300));
      }
    }
    
    // Ensure ALL LEDs are off before moving to input phase
    console.log('Pattern display complete - turning off all LEDs');
    await turnOffAllPads();
    
    // Play "ready to start" beep
    await playReadyBeep();
    
    // Start timing AFTER beep finishes - this is when player can actually interact
    if (currentLevelStatsRef.current && currentLevelStatsRef.current.startTime === 0) {
      const newStartTime = Date.now();
      currentLevelStatsRef.current.startTime = newStartTime;
      
      // Update state to match
      setSessionStats(prev => {
        const updates: Partial<SessionStats> = {
          levelStats: prev.levelStats.map(ls =>
            ls.level === gameState.level
              ? { ...ls, startTime: newStartTime }
              : ls
          ),
        };
        
        // Also set sessionStartTime on first level
        if (gameState.level === 1 && prev.sessionStartTime === 0) {
          updates.sessionStartTime = newStartTime;
        }
        
        return { ...prev, ...updates };
      });
      
      console.log(`⏱️ Level timer started at ${newStartTime}`);
    }
    
    // Brief pause before input phase (reduced from 500ms to 200ms)
    // await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`=== PLAYER INPUT PHASE ===`);
    console.log(`Waiting for player to repeat pattern...`);
    
    // Now activate input phase - this is when we start listening for button presses
    isInputPhaseActive.current = true;
    console.log(`🎯 Input phase activated - ready for player input`);
    
    // Start 3-second timeout - if player doesn't press anything, count as miss
    inputTimeoutRef.current = setTimeout(() => {
      console.log('⏰ 3-second timeout expired - counting as miss');
      handleInputTimeout();
    }, 3000);
    console.log('⏰ Started 3-second input timeout');
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

    // Initialize session statistics with startTime = 0 (will be set after first beep)
    const initialLevelStats: LevelStats = {
      level: 1,
      startTime: 0, // Will be set after beep plays
      accumulatedFailedTime: 0,
      failureCount: 0,
      completed: false,
    };
    
    setSessionStats({
      sessionStartTime: 0, // Will be set after first beep plays
      levelStats: [initialLevelStats],
      gameMode: config.mistakeBehavior === 'restart' ? 'restart' : 'continue',
      finalLevel: 1,
    });
    
    currentLevelStatsRef.current = initialLevelStats;

    // Reset all button states and timing to prevent auto-play
    previousButtonStates.current = new Array(9).fill(false);
    lastButtonPressTime.current = new Array(9).fill(0);
    isInputPhaseActive.current = false;
    shouldContinueGame.current = true; // Enable game continuation
    
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
    startGameTimeoutRef.current = setTimeout(async () => {
      // Don't check gameState.isPlaying here as it will use stale closure value
      console.log(`🔄 About to display pattern: [${newPattern.join(', ')}]`);
      await showPatternDisplay(newPattern);
      // After pattern display, we wait for user input (no active lights)
    }, 10);
  };

  // Save session statistics to backend (manual save)
  const saveSessionToBackend = async (stats: SessionStats, playerNameParam: string): Promise<boolean> => {
    try {
      setSaveStatus('saving');
      console.log('💾 Saving Pattern Mode session to backend...', stats);
      
      const response = await ApiService.savePatternSession({
        playerName: playerNameParam,
        sessionStartTime: stats.sessionStartTime,
        sessionEndTime: stats.sessionEndTime,
        totalTimeSpent: stats.totalTimeSpent,
        levelStats: stats.levelStats,
        gameMode: stats.gameMode,
        finalLevel: stats.finalLevel,
      });
      
      console.log('✅ Pattern Mode session saved successfully:', response);
      setSaveStatus('success');
      
      // Hide save modal after successful save
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveStatus('idle');
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving Pattern Mode session:', error);
      setSaveStatus('error');
      
      Alert.alert(
        'Save Failed',
        'Failed to save session to backend. Please check your connection.',
        [
          { text: 'OK', onPress: () => setSaveStatus('idle') }
        ]
      );
      
      return false;
    }
  };
  
  // Handle manual save button press
  const handleManualSave = async () => {
    setShowNameInputModal(true);
  };

  // Confirm save with player name
  const confirmSaveWithName = async () => {
    if (!playerName.trim()) {
      Alert.alert('Name Required', 'Please enter your name before saving.');
      return;
    }

    if (completedSessionStatsRef.current) {
      setShowNameInputModal(false);
      await saveSessionToBackend(completedSessionStatsRef.current, playerName.trim());
    }
  };
  
  // Helper function to format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = (ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  // Stop the game
  const stopGame = () => {
    // Disable game continuation immediately
    shouldContinueGame.current = false;
    
    // Clear all timeouts
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = null;
    }
    if (nextLevelTimeoutRef.current) {
      clearTimeout(nextLevelTimeoutRef.current);
      nextLevelTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (startGameTimeoutRef.current) {
      clearTimeout(startGameTimeoutRef.current);
      startGameTimeoutRef.current = null;
    }
    
    // Finalize session statistics
    if (currentLevelStatsRef.current && !currentLevelStatsRef.current.completed) {
      const endTime = Date.now();
      currentLevelStatsRef.current.endTime = endTime;
      currentLevelStatsRef.current.timeSpent = endTime - currentLevelStatsRef.current.startTime;
    }
    
    setSessionStats(prev => {
      const sessionEndTime = Date.now();
      
      console.log('\n📊 === CALCULATING TOTAL TIME ===');
      
      // Calculate total time including all failed attempts
      // Sum of: (successful level times + accumulated failed time for each level)
      const totalFromLevels = prev.levelStats.reduce((sum, ls) => {
        const successTime = ls.timeSpent || 0;
        const failedTime = ls.accumulatedFailedTime || 0;
        const levelTotal = successTime + failedTime;
        console.log(`Level ${ls.level}: Success=${successTime}ms (${(successTime/1000).toFixed(2)}s), Failed=${failedTime}ms (${(failedTime/1000).toFixed(2)}s), Total=${levelTotal}ms (${(levelTotal/1000).toFixed(2)}s)`);
        return sum + successTime + failedTime;
      }, 0);
      
      // Also add any time from current incomplete level if exists
      let currentLevelTime = 0;
      if (currentLevelStatsRef.current && !currentLevelStatsRef.current.completed && currentLevelStatsRef.current.startTime > 0) {
        currentLevelTime = sessionEndTime - currentLevelStatsRef.current.startTime;
        console.log(`Current incomplete level time: ${currentLevelTime}ms (${(currentLevelTime/1000).toFixed(2)}s)`);
      }
      
      const totalTimeSpent = totalFromLevels + currentLevelTime;
      console.log(`TOTAL TIME: ${totalTimeSpent}ms (${(totalTimeSpent/1000).toFixed(2)}s)`);
      console.log('=================================\n');
      
      const finalStats = {
        ...prev,
        sessionEndTime,
        totalTimeSpent,
        finalLevel: gameState.level,
      };
      
      // Log session statistics
      console.log('📊 Session Statistics:', JSON.stringify(finalStats, null, 2));
      
      // Store stats for manual save and show save modal
      completedSessionStatsRef.current = finalStats;
      setShowSaveModal(true);
      setSaveStatus('idle');
      
      return finalStats;
    });
    
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

  // Handle timeout when player doesn't press anything within 3 seconds
  const handleInputTimeout = async () => {
    console.log('❌ INPUT TIMEOUT - Player did not respond within 3 seconds');
    
    // Capture failed attempt time IMMEDIATELY before any delays or animations
    let failedAttemptTime = 0;
    if (currentLevelStatsRef.current && currentLevelStatsRef.current.startTime > 0) {
      failedAttemptTime = Date.now() - currentLevelStatsRef.current.startTime;
      console.log(`⏱️ Failed attempt time captured: ${failedAttemptTime}ms (${(failedAttemptTime/1000).toFixed(2)}s)`);
    }
    
    // Clear the timeout ref
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = null;
    }
    
    // Record failure in current level stats
    if (currentLevelStatsRef.current) {
      setSessionStats(prev => ({
        ...prev,
        levelStats: prev.levelStats.map(ls => 
          ls.level === gameState.level 
            ? { ...ls, failureCount: ls.failureCount + 1 }
            : ls
        ),
      }));
      
      // Update the ref to match (since it points to the same object)
      currentLevelStatsRef.current.failureCount = currentLevelStatsRef.current.failureCount + 1;
    }
    
    // Same logic as incorrect pad press - restart from Level 1
    isInputPhaseActive.current = false;
    
    // Blink error (all pads red)
    const blinkPromises = connectedDevice.map(async (device, index) => {
      if (device && device.device) {
        await blinkPadError(device);
      }
    });
    await Promise.all(blinkPromises);
    await turnOffAllPads();
    
    // Reset timer for current level on failure (apply to both modes)
    if (currentLevelStatsRef.current && failedAttemptTime > 0) {
      const newAccumulatedTime = currentLevelStatsRef.current.accumulatedFailedTime + failedAttemptTime;
      
      // Reset timing fields but keep failure count and accumulated failed time
      setSessionStats(prev => ({
        ...prev,
        levelStats: prev.levelStats.map(ls => 
          ls.level === gameState.level
            ? { ...ls, startTime: 0, endTime: undefined, timeSpent: undefined, accumulatedFailedTime: newAccumulatedTime }
            : ls
        ),
      }));
      
      // Update ref to match
      currentLevelStatsRef.current.startTime = 0;
      currentLevelStatsRef.current.endTime = undefined;
      currentLevelStatsRef.current.timeSpent = undefined;
      currentLevelStatsRef.current.accumulatedFailedTime = newAccumulatedTime;
      
      console.log(`⏱️ Total accumulated failed time: ${newAccumulatedTime}ms (${(newAccumulatedTime/1000).toFixed(2)}s)`);
    }
    
    // Restart from Level 1 (game over behavior)
    const newPattern = generatePattern(1);
    console.log(`🔄 Restarting from Level 1 due to timeout. New pattern: [${newPattern.join(', ')}]`);
    
    setGameState(prev => ({
      ...prev,
      level: 1,
      currentPattern: newPattern,
      currentStep: 0,
      lastEvent: `Timeout! Restarting from Level 1. New pattern: [${newPattern.map(p => `Pad ${p + 1}`).join(', ')}]`,
    }));
    
    // Display new pattern after brief delay
    restartTimeoutRef.current = setTimeout(async () => {
      if (!shouldContinueGame.current) return; // Safety check
      isInputPhaseActive.current = false; // Reset input phase
      await showPatternDisplay(newPattern);
    }, 800);
  };

  // Handle pad press from IoT device with BLUE feedback
  const handlePadPress = useCallback(async (pressedPadIndex: number) => {
    // Clear the input timeout as soon as player presses any button
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = null;
      console.log('⏰ Input timeout cleared due to button press');
    }
    
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
      feedbackTimeoutRef.current = setTimeout(async () => {
        if (!shouldContinueGame.current) return; // Safety check
        await sendPadCommand(pressedPadIndex, 'LIGHT_OFF');
      }, 300);
      
      if (currentStep === currentPattern.length - 1) {
        // Pattern completed successfully!
        console.log(`🎉 Pattern completed! Advancing to next level`);
        
        // Finalize current level stats
        if (currentLevelStatsRef.current) {
          const endTime = Date.now();
          const startTime = currentLevelStatsRef.current.startTime;
          // Only calculate timeSpent if startTime was properly set (not 0)
          const timeSpent = startTime > 0 ? endTime - startTime : 0;
          
          console.log(`\n✅ Level ${gameState.level} completed!`);
          console.log(`  Start: ${startTime}, End: ${endTime}`);
          console.log(`  Success time: ${timeSpent}ms (${(timeSpent/1000).toFixed(2)}s)`);
          console.log(`  Accumulated failed time: ${currentLevelStatsRef.current.accumulatedFailedTime}ms (${(currentLevelStatsRef.current.accumulatedFailedTime/1000).toFixed(2)}s)`);
          console.log(`  Level total: ${timeSpent + currentLevelStatsRef.current.accumulatedFailedTime}ms (${((timeSpent + currentLevelStatsRef.current.accumulatedFailedTime)/1000).toFixed(2)}s)\n`);
          
          currentLevelStatsRef.current.endTime = endTime;
          currentLevelStatsRef.current.timeSpent = timeSpent;
          currentLevelStatsRef.current.completed = true;
          
          setSessionStats(prev => ({
            ...prev,
            levelStats: prev.levelStats.map(ls => 
              ls.level === gameState.level 
                ? { 
                    ...ls, 
                    endTime, 
                    timeSpent: ls.startTime > 0 ? endTime - ls.startTime : 0,
                    completed: true 
                  }
                : ls
            ),
          }));
        }
        
        const nextLevel = gameState.level + 1;
        
        // Determine the maximum level
        const maxLevel = config.levelPatterns && config.levelPatterns.length > 0 
          ? config.levelPatterns.length 
          : config.maxLevel;
        
        // Check if we've reached the maximum level
        if (nextLevel > maxLevel) {
          // Game completed - finalize stats
          setSessionStats(prev => {
            const sessionEndTime = Date.now();
            
            console.log('\n📊 === GAME COMPLETED - CALCULATING TOTAL TIME ===');
            
            // Calculate total time including all failed attempts
            // Sum of: (successful level times + accumulated failed time for each level)
            const totalFromLevels = prev.levelStats.reduce((sum, ls) => {
              const successTime = ls.timeSpent || 0;
              const failedTime = ls.accumulatedFailedTime || 0;
              const levelTotal = successTime + failedTime;
              console.log(`Level ${ls.level}: Success=${successTime}ms (${(successTime/1000).toFixed(2)}s), Failed=${failedTime}ms (${(failedTime/1000).toFixed(2)}s), Total=${levelTotal}ms (${(levelTotal/1000).toFixed(2)}s)`);
              return sum + successTime + failedTime;
            }, 0);
            
            console.log(`TOTAL TIME: ${totalFromLevels}ms (${(totalFromLevels/1000).toFixed(2)}s)`);
            console.log('=================================================\n');
            
            const finalStats = {
              ...prev,
              sessionEndTime,
              totalTimeSpent: totalFromLevels,
              finalLevel: gameState.level,
            };
            
            // Store stats for manual save and show save modal
            completedSessionStatsRef.current = finalStats;
            setShowSaveModal(true);
            setSaveStatus('idle');
            
            return finalStats;
          });
          
          setGameState(prev => ({
            ...prev,
            isPlaying: false,
            lastEvent: `🎉 ยินดีด้วย! คุณผ่านครบ ${maxLevel} เลเวลแล้ว! เกมจบลงแล้ว`,
          }));
          return;
        }
        
        // Initialize stats for next level
        const newLevelStats: LevelStats = {
          level: nextLevel,
          startTime: 0, // Will be set after beep plays
          accumulatedFailedTime: 0,
          failureCount: 0,
          completed: false,
        };
        
        currentLevelStatsRef.current = newLevelStats;
        
        setSessionStats(prev => ({
          ...prev,
          levelStats: [...prev.levelStats, newLevelStats],
        }));
        
        const newPattern = generatePattern(nextLevel);
        setGameState(prev => ({
          ...prev,
          level: nextLevel,
          currentPattern: newPattern,
          currentStep: 0,
          lastEvent: `Level ${nextLevel} started! Pattern: [${newPattern.map(p => `Pad ${p + 1}`).join(', ')}]`,
        }));
        
        // Show new pattern after delay (reduced for faster progression)
        nextLevelTimeoutRef.current = setTimeout(async () => {
          if (!shouldContinueGame.current) return; // Safety check
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
      
      // Capture failed attempt time IMMEDIATELY before any delays or animations
      let failedAttemptTime = 0;
      if (currentLevelStatsRef.current && currentLevelStatsRef.current.startTime > 0) {
        failedAttemptTime = Date.now() - currentLevelStatsRef.current.startTime;
        console.log(`⏱️ Failed attempt time captured: ${failedAttemptTime}ms (${(failedAttemptTime/1000).toFixed(2)}s)`);
      }
      
      // Record failure in current level stats
      if (currentLevelStatsRef.current) {
        setSessionStats(prev => ({
          ...prev,
          levelStats: prev.levelStats.map(ls => 
            ls.level === gameState.level 
              ? { ...ls, failureCount: ls.failureCount + 1 }
              : ls
          ),
        }));
        
        // Update the ref to match (since it points to the same object)
        currentLevelStatsRef.current.failureCount = currentLevelStatsRef.current.failureCount + 1;
      }
      
      await sendPadCommand(pressedPadIndex, 'ERROR_FEEDBACK');
      
      // Capture and accumulate failed time (apply to both modes)
      if (currentLevelStatsRef.current && failedAttemptTime > 0) {
        const newAccumulatedTime = currentLevelStatsRef.current.accumulatedFailedTime + failedAttemptTime;
        
        // Reset timing fields but keep failure count and accumulated failed time
        setSessionStats(prev => ({
          ...prev,
          levelStats: prev.levelStats.map(ls => 
            ls.level === gameState.level
              ? { ...ls, startTime: 0, endTime: undefined, timeSpent: undefined, accumulatedFailedTime: newAccumulatedTime }
              : ls
          ),
        }));
        
        // Update ref to match
        currentLevelStatsRef.current.startTime = 0;
        currentLevelStatsRef.current.endTime = undefined;
        currentLevelStatsRef.current.timeSpent = undefined;
        currentLevelStatsRef.current.accumulatedFailedTime = newAccumulatedTime;
        
        console.log(`⏱️ Total accumulated failed time: ${newAccumulatedTime}ms (${(newAccumulatedTime/1000).toFixed(2)}s)`);
      }
      
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
        restartTimeoutRef.current = setTimeout(async () => {
          if (!shouldContinueGame.current) return; // Safety check
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
        restartTimeoutRef.current = setTimeout(async () => {
          if (!shouldContinueGame.current) return; // Safety check
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
          <Text style={styles.title}>Pattern Mode</Text>
          {/* <Text style={styles.subtitle}>จำนวนที่เชื่อมต่อ: {availablePads.length}</Text> */}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Configuration Display */}
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>การตั้งค่า</Text>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>จำนวน Pad ที่เพิ่มขึ้นต่อเลเวล:</Text>
          <Text style={styles.configValue}>+{config.padIncrementPerLevel}</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>เมื่อทำผิด/หมดเวลา:</Text>
          <Text style={styles.configValue}>
            {config.mistakeBehavior === 'restart' ? 'เริ่มใหม่ตั้งแต่ต้น' : 'เล่นต่อจนกว่าจะถูก'}
          </Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>เวลาหมดสำหรับการกด:</Text>
          <Text style={styles.configValue}>{config.inputTimeoutMs} ms</Text>
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
        <Text style={styles.padsTitle}>จำนวน Pad ที่เชื่อมต่อ: {availablePads.length} ปุ่ม</Text>
        <View style={styles.padsContainer}>
          {availablePads.length === 0 ? (
            <Text style={styles.noPadsText}>ไม่พบการเชื่อมต่ออุปกรณ์ โปรดเชื่อมต่อ Pad เพื่อเริ่มเล่น</Text>
          ) : (
            <View style={styles.padsGrid}>
              {availablePads.map((padIndex) => (
                <TouchableOpacity
                  key={padIndex}
                  style={[
                    styles.padButton,
                    displayingPadIndex === padIndex && styles.displayingPadButton,
                    currentTarget === padIndex && isInputPhaseActive.current && styles.targetPadButton,
                  ]}
                  onPress={() => handlePadPress(padIndex)}
                  disabled={!gameState.isPlaying}
                >
                  <Text style={[
                    styles.padButtonText,
                    (displayingPadIndex === padIndex || (currentTarget === padIndex && isInputPhaseActive.current)) && styles.highlightedPadButtonText,
                  ]}>
                    Pad {padIndex + 1}
                  </Text>
                  <Text style={styles.padStatus}>
                    {Array.isArray(connectedDevice) && connectedDevice[padIndex] ? '🟢 เชื่อมต่อแล้ว' : '🔴 ไม่ได้เชื่อมต่อ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Statistics Display */}
      {/* {sessionStats.levelStats.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Session Statistics:</Text>
          {config.mistakeBehavior === 'continue' ? (
            // Show time spent per level
            <View>
              {sessionStats.levelStats.map((levelStat) => (
                <Text key={`${levelStat.level}-${levelStat.startTime}`} style={styles.statsText}>
                  Level {levelStat.level}: {levelStat.timeSpent ? `${(levelStat.timeSpent / 1000).toFixed(1)}s` : 'In progress...'}
                  {levelStat.completed && ' ✓'}
                </Text>
              ))}
            </View>
          ) : (
            // Show failure count per level
            <View>
              {sessionStats.levelStats.reduce((acc, levelStat) => {
                const existing = acc.find(item => item.level === levelStat.level);
                if (existing) {
                  existing.totalFailures += levelStat.failureCount;
                  existing.attempts++;
                } else {
                  acc.push({
                    level: levelStat.level,
                    totalFailures: levelStat.failureCount,
                    attempts: 1,
                    completed: levelStat.completed,
                  });
                }
                return acc;
              }, [] as Array<{level: number, totalFailures: number, attempts: number, completed: boolean}>).map((stat) => (
                <Text key={stat.level} style={styles.statsText}>
                  Level {stat.level}: {stat.totalFailures} {stat.totalFailures === 1 ? 'failure' : 'failures'} 
                  {stat.attempts > 1 && ` (${stat.attempts} attempts)`}
                  {stat.completed && ' ✓'}
                </Text>
              ))}
            </View>
          )}
        </View>
      )} */}

      {/* Manual Save Section */}
      {!gameState.isPlaying && showSaveModal && completedSessionStatsRef.current && (
        <Modal
          visible={showSaveModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            if (saveStatus !== 'saving') {
              setShowSaveModal(false);
              completedSessionStatsRef.current = null;
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <MaterialIcons name="emoji-events" size={48} color="#FFA500" />
                  <Text style={styles.modalTitle}>เกมจบแล้ว!</Text>
                  <Text style={styles.modalSubtitle}>
                    Level {completedSessionStatsRef.current.finalLevel}
                  </Text>
                </View>

                {/* Summary Stats */}
                <View style={styles.summarySection}>
                  <View style={styles.summaryRow}>
                    <MaterialIcons name="access-time" size={24} color="#2196F3" />
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryLabel}>เวลาทั้งหมด</Text>
                      <Text style={styles.summaryValue}>
                        {formatDuration(completedSessionStatsRef.current.totalTimeSpent)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryRow}>
                    <MaterialIcons name="layers" size={24} color="#4CAF50" />
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryLabel}>ด่านสูงสุด</Text>
                      <Text style={styles.summaryValue}>
                        {completedSessionStatsRef.current.finalLevel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryRow}>
                    <MaterialIcons name="check-circle" size={24} color="#FFA500" />
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryLabel}>ด่านที่ผ่าน</Text>
                      <Text style={styles.summaryValue}>
                        {completedSessionStatsRef.current.levelStats.filter(ls => ls.completed).length}
                      </Text>
                    </View>
                  </View>
                  {completedSessionStatsRef.current.gameMode === 'restart' && (
                    <View style={styles.summaryRow}>
                      <MaterialIcons name="error-outline" size={24} color="#f44336" />
                      <View style={styles.summaryTextContainer}>
                        <Text style={styles.summaryLabel}>ความผิดพลาดทั้งหมด</Text>
                        <Text style={styles.summaryValue}>
                          {completedSessionStatsRef.current.levelStats.reduce((sum, ls) => sum + ls.failureCount, 0)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Level Details */}
                <View style={styles.levelDetailsSection}>
                  <Text style={styles.sectionTitle}>รายละเอียดแต่ละด่าน</Text>
                  {(() => {
                    // Group level stats by level number and calculate average time
                    const levelGroups = completedSessionStatsRef.current.levelStats.reduce((acc, levelStat) => {
                      if (!acc[levelStat.level]) {
                        acc[levelStat.level] = {
                          attempts: [],
                          totalFailures: 0,
                          completed: false,
                        };
                      }
                      acc[levelStat.level].attempts.push(levelStat);
                      acc[levelStat.level].totalFailures += levelStat.failureCount;
                      if (levelStat.completed) {
                        acc[levelStat.level].completed = true;
                      }
                      return acc;
                    }, {} as Record<number, { attempts: LevelStats[], totalFailures: number, completed: boolean }>);

                    return Object.entries(levelGroups).map(([levelNum, data]) => {
                      const level = parseInt(levelNum);
                      // Only include completed (successful) attempts for time calculation
                      const completedAttemptsWithTime = data.attempts.filter(a => a.completed && a.timeSpent);
                      const avgTime = completedAttemptsWithTime.length > 0
                        ? completedAttemptsWithTime.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / completedAttemptsWithTime.length
                        : undefined;

                      return (
                        <View key={level} style={styles.levelCard}>
                          <View style={styles.levelCardHeader}>
                            <Text style={styles.levelCardTitle}>Level {level}</Text>
                            {data.completed && (
                              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                            )}
                          </View>
                          <View style={styles.levelCardStats}>
                            {avgTime && (
                              <View style={styles.levelStatRow}>
                                <MaterialIcons name="timer" size={16} color="#666" />
                                <Text style={styles.levelStatLabel}>
                                  {data.attempts.length > 1 ? 'เวลาเฉลี่ย:' : 'เวลา:'}
                                </Text>
                                <Text style={styles.levelStatValue}>
                                  {formatDuration(avgTime)}
                                </Text>
                              </View>
                            )}
                            {completedSessionStatsRef.current!.gameMode === 'restart' && (
                              <View style={styles.levelStatRow}>
                                <MaterialIcons name="error-outline" size={16} color="#666" />
                                <Text style={styles.levelStatLabel}>ความผิดพลาด:</Text>
                                <Text style={styles.levelStatValue}>
                                  {data.totalFailures}
                                </Text>
                              </View>
                            )}
                            {data.attempts.length > 1 && (
                              <View style={styles.levelStatRow}>
                                <MaterialIcons name="repeat" size={16} color="#666" />
                                <Text style={styles.levelStatLabel}>ครั้ง:</Text>
                                <Text style={styles.levelStatValue}>
                                  {data.attempts.length}
                                </Text>
                              </View>
                            )}
                            <View style={styles.levelStatRow}>
                              <MaterialIcons name="flag" size={16} color="#666" />
                              <Text style={styles.levelStatLabel}>สถานะ:</Text>
                              <Text style={[
                                styles.levelStatValue,
                                data.completed ? styles.completedText : styles.incompleteText
                              ]}>
                                {data.completed ? 'ผ่าน' : 'ไม่ผ่าน'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>
              </ScrollView>

              {/* Save Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saveStatus === 'saving' && styles.savingButton,
                    saveStatus === 'success' && styles.successButton,
                    saveStatus === 'error' && styles.errorButton,
                  ]}
                  onPress={handleManualSave}
                  disabled={saveStatus === 'saving' || saveStatus === 'success'}
                >
                  <MaterialIcons
                    name={
                      saveStatus === 'success'
                        ? 'check-circle'
                        : saveStatus === 'error'
                        ? 'error'
                        : saveStatus === 'saving'
                        ? 'hourglass-empty'
                        : 'save'
                    }
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.saveButtonText}>
                    {saveStatus === 'saving'
                      ? 'กำลังบันทึก...'
                      : saveStatus === 'success'
                      ? 'บันทึกแล้ว!'
                      : saveStatus === 'error'
                      ? 'ล้มเหลว - ลองใหม่'
                      : 'บันทึกสถิติการเล่น'}
                  </Text>
                </TouchableOpacity>
                {saveStatus === 'idle' && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => {
                      setShowSaveModal(false);
                      completedSessionStatsRef.current = null;
                    }}
                  >
                    <Text style={styles.skipButtonText}>ข้าม</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Player Name Input Modal */}
      <Modal
        visible={showNameInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.nameInputContainer}>
            <Text style={styles.nameInputTitle}>Enter Player Name</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              value={playerName}
              onChangeText={setPlayerName}
              autoFocus={true}
              maxLength={50}
            />
            <View style={styles.nameInputButtons}>
              <TouchableOpacity
                style={[styles.nameInputButton, styles.cancelButton]}
                onPress={() => {
                  setShowNameInputModal(false);
                  setPlayerName('');
                }}
              >
                <Text style={styles.nameInputButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nameInputButton, styles.confirmButton]}
                onPress={confirmSaveWithName}
              >
                <Text style={styles.nameInputButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Game Controls */}
      <View style={styles.controlsSection}>
        {!gameState.isPlaying ? (
          <TouchableOpacity 
            style={[styles.startButton, availablePads.length === 0 && styles.disabledButton]} 
            onPress={startGame}
            disabled={availablePads.length === 0}
          >
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
            <Text style={styles.startButtonText}>เริ่มเกม</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopGame}>
            <MaterialIcons name="stop" size={24} color="#fff" />
            <Text style={styles.stopButtonText}>หยุดเกม</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Event Log */}
      <View style={styles.eventSection}>
        <Text style={styles.eventTitle}>เหตุการณ์เกม</Text>
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
    backgroundColor: '#4e54a3',
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
    fontSize: 32,
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
    color: '#4e54a3',
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
  displayingPadButton: {
    backgroundColor: '#f44336',
    borderColor: '#d32f2f',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  highlightedPadButtonText: {
    color: '#fff',
  },
  padStatus: {
    fontSize: 10,
    color: '#999',
  },
  statsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  statsText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 18,
    paddingLeft: 8,
  },
  saveSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  savingButton: {
    backgroundColor: '#9E9E9E',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#f44336',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalScrollView: {
    maxHeight: '75%',
  },
  modalHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fbff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  summarySection: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    width: '47%',
  },
  summaryTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  levelDetailsSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  levelCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  levelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  levelCardStats: {
    gap: 6,
  },
  levelStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelStatLabel: {
    fontSize: 13,
    color: '#666',
  },
  levelStatValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  completedText: {
    color: '#4CAF50',
  },
  incompleteText: {
    color: '#999',
  },
  modalButtons: {
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nameInputContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  nameInputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  nameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  nameInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  nameInputButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  nameInputButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  confirmButton: {
    backgroundColor: '#4e54a3',
  },
});

export default IoTPatternGameScreen;