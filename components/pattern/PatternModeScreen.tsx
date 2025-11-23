import React, { useState, useEffect, useRef } from 'react';
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

// Configuration interface
interface PatternConfig {
  padIncrementPerLevel: number;
  mistakeBehavior: 'restart' | 'continue';
}

// Game state interface
interface GameState {
  isPlaying: boolean;
  level: number;
  currentPattern: string[];
  currentStep: number;
  lastEvent: string;
  timeoutId: number | null;
}

// Available pad IDs
const AVAILABLE_PADS = ['L1', 'L2', 'R1', 'R2', 'C'];

// Timeout duration for each step (milliseconds)
const STEP_TIMEOUT = 3000;

const PatternModeScreen: React.FC = () => {
  // Default configuration - can be replaced with Manual/QR config later
  const [config] = useState<PatternConfig>({
    padIncrementPerLevel: 2,
    mistakeBehavior: 'restart',
  });

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    level: 1,
    currentPattern: [],
    currentStep: 0,
    lastEvent: 'Ready to start',
    timeoutId: null,
  });

  // Ref to store timeout ID for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a random pattern for the current level
  const generatePattern = (level: number): string[] => {
    const patternLength = level * config.padIncrementPerLevel;
    const pattern: string[] = [];
    
    for (let i = 0; i < patternLength; i++) {
      const randomIndex = Math.floor(Math.random() * AVAILABLE_PADS.length);
      pattern.push(AVAILABLE_PADS[randomIndex]);
    }
    
    return pattern;
  };

  // Start a new game
  const startGame = () => {
    const newPattern = generatePattern(1);
    setGameState({
      isPlaying: true,
      level: 1,
      currentPattern: newPattern,
      currentStep: 0,
      lastEvent: `Level 1 started! Pattern: [${newPattern.join(', ')}]`,
      timeoutId: null,
    });
    startStepTimeout();
  };

  // Start timeout for current step
  const startStepTimeout = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start new timeout
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, STEP_TIMEOUT);
  };

  // Handle timeout (treat as mistake)
  const handleTimeout = () => {
    if (!gameState.isPlaying) return;

    if (config.mistakeBehavior === 'restart') {
      // Restart from Level 1
      const newPattern = generatePattern(1);
      setGameState(prev => ({
        ...prev,
        level: 1,
        currentPattern: newPattern,
        currentStep: 0,
        lastEvent: `Timeout! Restarting from Level 1. Pattern: [${newPattern.join(', ')}]`,
      }));
      startStepTimeout();
    } else {
      // Continue on same step
      setGameState(prev => ({
        ...prev,
        lastEvent: `Timeout! Try again. Target: ${prev.currentPattern[prev.currentStep]}`,
      }));
      startStepTimeout();
    }
  };

  // Handle pad press
  const handlePadPress = (padId: string) => {
    if (!gameState.isPlaying) return;

    // Clear current timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const targetPad = gameState.currentPattern[gameState.currentStep];

    if (padId === targetPad) {
      // Correct pad pressed
      const isLastStep = gameState.currentStep === gameState.currentPattern.length - 1;
      
      if (isLastStep) {
        // Level completed - move to next level
        const nextLevel = gameState.level + 1;
        const newPattern = generatePattern(nextLevel);
        
        setGameState(prev => ({
          ...prev,
          level: nextLevel,
          currentPattern: newPattern,
          currentStep: 0,
          lastEvent: `Level ${prev.level} completed! Level ${nextLevel} - Pattern: [${newPattern.join(', ')}]`,
        }));
        startStepTimeout();
      } else {
        // Move to next step in current level
        setGameState(prev => ({
          ...prev,
          currentStep: prev.currentStep + 1,
          lastEvent: `Correct! Next target: ${prev.currentPattern[prev.currentStep + 1]}`,
        }));
        startStepTimeout();
      }
    } else {
      // Wrong pad pressed
      if (config.mistakeBehavior === 'restart') {
        // Restart from Level 1
        const newPattern = generatePattern(1);
        setGameState(prev => ({
          ...prev,
          level: 1,
          currentPattern: newPattern,
          currentStep: 0,
          lastEvent: `Wrong pad! Expected ${targetPad}, got ${padId}. Restarting from Level 1. Pattern: [${newPattern.join(', ')}]`,
        }));
        startStepTimeout();
      } else {
        // Continue on same step
        setGameState(prev => ({
          ...prev,
          lastEvent: `Wrong pad! Expected ${targetPad}, got ${padId}. Try again.`,
        }));
        startStepTimeout();
      }
    }
  };

  // Stop the game
  const stopGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setGameState({
      isPlaying: false,
      level: 1,
      currentPattern: [],
      currentStep: 0,
      lastEvent: 'Game stopped',
      timeoutId: null,
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get current target pad
  const getCurrentTarget = (): string => {
    if (!gameState.isPlaying || gameState.currentPattern.length === 0) return '';
    return gameState.currentPattern[gameState.currentStep] || '';
  };

  // Get pad button style based on whether it's the target
  const getPadButtonStyle = (padId: string) => {
    const isTarget = gameState.isPlaying && padId === getCurrentTarget();
    return [
      styles.padButton,
      isTarget && styles.targetPadButton,
    ];
  };

  const getPadButtonTextStyle = (padId: string) => {
    const isTarget = gameState.isPlaying && padId === getCurrentTarget();
    return [
      styles.padButtonText,
      isTarget && styles.targetPadButtonText,
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pattern Mode</Text>
        <Text style={styles.subtitle}>Memory Training Game</Text>
      </View>

      {/* Configuration Display */}
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Configuration</Text>
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
              {getCurrentTarget() || '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* Pattern Display */}
      {gameState.isPlaying && (
        <View style={styles.patternSection}>
          <Text style={styles.patternTitle}>Current Pattern</Text>
          <View style={styles.patternContainer}>
            {gameState.currentPattern.map((pad, index) => (
              <View
                key={index}
                style={[
                  styles.patternPad,
                  index === gameState.currentStep && styles.currentPatternPad,
                  index < gameState.currentStep && styles.completedPatternPad,
                ]}
              >
                <Text
                  style={[
                    styles.patternPadText,
                    index === gameState.currentStep && styles.currentPatternPadText,
                    index < gameState.currentStep && styles.completedPatternPadText,
                  ]}
                >
                  {pad}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Game Controls */}
      <View style={styles.controlsSection}>
        {!gameState.isPlaying ? (
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
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

      {/* Pad Buttons */}
      <View style={styles.padsSection}>
        <Text style={styles.padsTitle}>Tap the Pads</Text>
        <View style={styles.padsContainer}>
          <View style={styles.padsRow}>
            {/* Top row: L1, L2 */}
            <TouchableOpacity
              style={getPadButtonStyle('L1')}
              onPress={() => handlePadPress('L1')}
              disabled={!gameState.isPlaying}
            >
              <Text style={getPadButtonTextStyle('L1')}>L1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getPadButtonStyle('L2')}
              onPress={() => handlePadPress('L2')}
              disabled={!gameState.isPlaying}
            >
              <Text style={getPadButtonTextStyle('L2')}>L2</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.padsRow}>
            {/* Middle row: C */}
            <TouchableOpacity
              style={getPadButtonStyle('C')}
              onPress={() => handlePadPress('C')}
              disabled={!gameState.isPlaying}
            >
              <Text style={getPadButtonTextStyle('C')}>C</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.padsRow}>
            {/* Bottom row: R1, R2 */}
            <TouchableOpacity
              style={getPadButtonStyle('R1')}
              onPress={() => handlePadPress('R1')}
              disabled={!gameState.isPlaying}
            >
              <Text style={getPadButtonTextStyle('R1')}>R1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getPadButtonStyle('R2')}
              onPress={() => handlePadPress('R2')}
              disabled={!gameState.isPlaying}
            >
              <Text style={getPadButtonTextStyle('R2')}>R2</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Event Log */}
      <View style={styles.eventSection}>
        <Text style={styles.eventTitle}>Last Event</Text>
        <Text style={styles.eventText}>{gameState.lastEvent}</Text>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const padSize = Math.min(width * 0.25, 80);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFA500',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
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
  patternSection: {
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
  patternTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  patternContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  patternPad: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentPatternPad: {
    backgroundColor: '#FFA500',
    borderColor: '#FF8C00',
  },
  completedPatternPad: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049',
  },
  patternPadText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  currentPatternPadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  completedPatternPadText: {
    color: '#fff',
    fontWeight: 'bold',
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
  padsSection: {
    flex: 1,
    paddingHorizontal: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  padsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  padButton: {
    width: padSize,
    height: padSize,
    borderRadius: padSize / 2,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  targetPadButtonText: {
    color: '#fff',
  },
  eventSection: {
    backgroundColor: '#fff',
    margin: 16,
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

export default PatternModeScreen;