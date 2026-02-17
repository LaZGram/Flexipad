import { useState, useRef, useCallback } from 'react';

export type PadColor = 'red' | 'green' | 'off';
export type GameState = 'idle' | 'running' | 'finished';

export interface PressRecord {
  pressNumber: number; // sequential press number
  color: PadColor; // color of the pad pressed (red or green)
  result: 'hit' | 'miss'; // hit = correct action, miss = wrong action
  reactionTime: number; // time taken to press (0 if timeout/miss on green)
  timestamp: number; // when the press occurred
}

export interface ForbiddenColorGameConfig {
  redProbability: number; // 0.0 to 1.0 (e.g., 0.3 = 30% chance of red)
  redDisplayDuration: number; // milliseconds to show red light
  greenTimeout: number; // milliseconds before green times out (optional)
  enableGreenTimeout: boolean;
  totalPads: number; // number of available pads
  sessionTimeLimit: number; // total session time in seconds (0 = unlimited)
  roundTimeLimit: number; // maximum time per round in milliseconds
}

export interface GameStats {
  hitCount: number; // correct green hits
  missCount: number; // mistakes (red presses + green timeouts)
  totalRounds: number;
  accuracy: number; // hitCount / (hitCount + missCount)
  sessionStartTime: number; // timestamp when session started
  remainingTime: number; // remaining session time in seconds
  averageReactionTime: number; // average reaction time for green hits
  pressTimes: number[]; // individual reaction times for each successful press
  pressRecords: PressRecord[]; // detailed record of all presses
}

export interface GameRound {
  padId: number;
  color: PadColor;
  isActive: boolean;
  timestamp: number; // Add timestamp to track round freshness
}

export interface ForbiddenColorGameHook {
  gameState: GameState;
  currentRound: GameRound | null;
  stats: GameStats;
  config: ForbiddenColorGameConfig;
  startGame: () => void;
  stopGame: () => void;
  handlePadPress: (padId: number) => void;
  updateConfig: (newConfig: Partial<ForbiddenColorGameConfig>) => void;
  resetStats: () => void;
  timeLeft: number; // remaining session time in seconds
}

const DEFAULT_CONFIG: ForbiddenColorGameConfig = {
  redProbability: 0.3,
  redDisplayDuration: 800, // Reduced from 1000ms to 800ms for speed testing
  greenTimeout: 3000, // Keep at 3s for green (user needs time to respond)
  enableGreenTimeout: true,
  totalPads: 3,
  sessionTimeLimit: 10, // 1 minute default
  roundTimeLimit: 1000, // 1 second max per round
};

const INITIAL_STATS: GameStats = {
  hitCount: 0,
  missCount: 0,
  totalRounds: 0,
  accuracy: 0,
  sessionStartTime: 0,
  remainingTime: 0,
  averageReactionTime: 0,
  pressTimes: [],
  pressRecords: [],
};

export const useForbiddenColorGame = (
  sendLedCommand?: (padId: number, color: PadColor) => Promise<void>,
  availablePadIds?: number[]
): ForbiddenColorGameHook => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [config, setConfig] = useState<ForbiddenColorGameConfig>(DEFAULT_CONFIG);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<boolean>(false);
  const currentRoundRef = useRef<GameRound | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);

  // Mock LED command function if none provided
  const mockSendLedCommand = useCallback(async (padId: number, color: PadColor) => {
    console.log(`[MOCK] Pad ${padId + 1}: ${color}`);
  }, []);

  const sendLed = sendLedCommand || mockSendLedCommand;

  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      console.log('🧹 Clearing current timeout');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const updateStats = useCallback((hit: boolean, color: PadColor, reactionTime?: number) => {
    setStats(prev => {
      const newHitCount = hit ? prev.hitCount + 1 : prev.hitCount;
      const newMissCount = hit ? prev.missCount : prev.missCount + 1;
      const newTotal = prev.totalRounds + 1;
      const newAccuracy = newTotal > 0 ? (newHitCount / (newHitCount + newMissCount)) * 100 : 0;
      
      // Update press times array and average reaction time
      // Count any actual press with reaction time (exclude timeouts where reactionTime = 0)
      let newPressTimes = [...prev.pressTimes];
      let newAvgReactionTime = prev.averageReactionTime;
      if (reactionTime && reactionTime > 0) {
        newPressTimes.push(reactionTime);
        const totalValidPresses = newPressTimes.length;
        const previousTotal = (totalValidPresses - 1) * prev.averageReactionTime;
        newAvgReactionTime = totalValidPresses > 0 ? (previousTotal + reactionTime) / totalValidPresses : 0;
      }
      
      // Create detailed press record
      const pressRecord: PressRecord = {
        pressNumber: prev.pressRecords.length + 1,
        color: color,
        result: hit ? 'hit' : 'miss',
        reactionTime: reactionTime || 0,
        timestamp: Date.now(),
      };
      const newPressRecords = [...prev.pressRecords, pressRecord];

      return {
        hitCount: newHitCount,
        missCount: newMissCount,
        totalRounds: newTotal,
        accuracy: parseFloat(newAccuracy.toFixed(1)),
        sessionStartTime: prev.sessionStartTime,
        remainingTime: prev.remainingTime,
        averageReactionTime: parseFloat(newAvgReactionTime.toFixed(0)),
        pressTimes: newPressTimes,
        pressRecords: newPressRecords,
      };
    });
  }, []);

  const generateNextRound = useCallback((): GameRound => {
    // Use available pad IDs, fallback to config.totalPads range if not provided
    const connectedPads = availablePadIds && availablePadIds.length > 0 
      ? availablePadIds 
      : Array.from({ length: config.totalPads }, (_, i) => i);
    
    if (connectedPads.length === 0) {
      throw new Error('No connected pads available for game');
    }
    
    console.log(`🎮 Available pads for selection: [${connectedPads.join(', ')}]`);
    
    const randomIndex = Math.floor(Math.random() * connectedPads.length);
    const padId = connectedPads[randomIndex];
    const isRed = Math.random() < config.redProbability;
    
    console.log(`🎯 Selected pad ${padId + 1} from available pads`);
    
    return {
      padId,
      color: isRed ? 'red' : 'green',
      isActive: true,
      timestamp: Date.now(),
    };
  }, [config.redProbability, config.totalPads, availablePadIds]);

  const endCurrentRound = useCallback(async () => {
    const activeRound = currentRoundRef.current;
    if (!activeRound) {
      console.log('🛑 endCurrentRound called but no active round');
      return;
    }

    console.log(`🏁 Ending round: Pad ${activeRound.padId + 1} - ${activeRound.color}`);
    
    // CRITICAL: Clear timeout FIRST to prevent race conditions
    clearCurrentTimeout();
    
    // Mark round as inactive BEFORE turning off LED
    currentRoundRef.current = { ...activeRound, isActive: false };
    setCurrentRound(prev => prev ? { ...prev, isActive: false } : null);
    
    // Turn off the current pad
    await sendLed(activeRound.padId, 'off');
    
    // Clear round state AFTER LED is off
    currentRoundRef.current = null;
    setCurrentRound(null);

    // Minimal delay between rounds - reduced from 100ms to 20ms for speed testing
    await new Promise(resolve => setTimeout(resolve, 20)); // 20ms delay
    
    // Final validation before starting next round
    if (gameLoopRef.current) {
      console.log('⏭️ Starting next round after delay');
      await startNextRound(); // Make this await to ensure sequential execution
    } else {
      console.log('🛑 Game stopped, not starting next round');
    }
  }, [sendLed, clearCurrentTimeout]);

  const startNextRound = useCallback(async () => {
    console.log(`🎮 startNextRound called - gameLoopRef: ${gameLoopRef.current}`);
    if (!gameLoopRef.current) {
      console.log('🛑 Game loop stopped, aborting startNextRound');
      return;
    }

    // CRITICAL: Check if there's already an active round to prevent overlaps
    if (currentRoundRef.current && currentRoundRef.current.isActive) {
      console.log('⚠️ Round already active, aborting startNextRound to prevent overlap');
      return;
    }

    const nextRound = generateNextRound();
    console.log(`🎲 Generated next round: Pad ${nextRound.padId + 1} - ${nextRound.color}`);
    
    // CRITICAL: Clear any existing timeout before setting new round
    clearCurrentTimeout();
    
    // Set both ref (immediate) and state (for UI)
    currentRoundRef.current = nextRound;
    setCurrentRound(nextRound);
    
    // Track round start time for reaction time calculation
    roundStartTimeRef.current = Date.now();
    
    // Turn on the pad with the appropriate color immediately
    console.log(`💡 Sending ${nextRound.color} LED to pad ${nextRound.padId + 1}`);
    console.log(`⏱️ ${nextRound.color} light will display for ${nextRound.color === 'red' ? config.redDisplayDuration : config.enableGreenTimeout ? Math.min(config.greenTimeout, config.roundTimeLimit) : config.roundTimeLimit}ms`);
    await sendLed(nextRound.padId, nextRound.color);

    // CRITICAL: Validate round is still active after LED command (prevent race conditions)
    if (!gameLoopRef.current || currentRoundRef.current?.timestamp !== nextRound.timestamp) {
      console.log('⚠️ Game state changed during LED command, aborting timeout setup');
      return;
    }

    // Set round timeout based on color
    if (nextRound.color === 'red') {
      // Red light: auto turn off after duration
      const redTimeout = config.redDisplayDuration;
      console.log(`🔴 Setting RED timeout for ${redTimeout}ms (${redTimeout/1000}s)`);
      timeoutRef.current = setTimeout(async () => {
        // Validate this timeout is for the current round
        if (gameLoopRef.current && currentRoundRef.current?.timestamp === nextRound.timestamp) {
          console.log('🔴 Red timeout triggered - correct behavior (HIT)');
          updateStats(true, 'red', 0); // Not pressing red = correct behavior = HIT
          await endCurrentRound();
        } else {
          console.log('🔴 Red timeout triggered but round changed - ignoring');
        }
      }, redTimeout);
    } else if (nextRound.color === 'green') {
      // Green light: timeout based on settings
      if (config.enableGreenTimeout) {
        const timeout = Math.min(config.greenTimeout, config.roundTimeLimit);
        
        console.log(`🟢 Setting GREEN timeout for ${timeout}ms (${timeout/1000}s)`);
        timeoutRef.current = setTimeout(async () => {
          // Validate this timeout is for the current round
          if (gameLoopRef.current && currentRoundRef.current?.timestamp === nextRound.timestamp) {
            console.log('🟢 Green timeout triggered - failed to respond (MISS)');
            updateStats(false, 'green', 0); // Failed to press green = incorrect behavior = MISS
            await endCurrentRound();
          } else {
            console.log('🟢 Green timeout triggered but round changed - ignoring');
          }
        }, timeout);
      } else {
        console.log('🟢 Green timeout is DISABLED - green will stay on until pressed');
        // When timeout is disabled, green stays on indefinitely (no timeout)
        // The round will only end when the user presses the pad
      }
    }
    
    console.log(`✅ Round setup complete - LED sent, timeout set for round ${nextRound.timestamp}`);
  }, [generateNextRound, sendLed, endCurrentRound, config, updateStats, clearCurrentTimeout]);

  const startGame = useCallback(() => {
    // Prevent multiple starts
    if (gameLoopRef.current || gameState === 'running') {
      console.log('⚠️ Game already running, ignoring start request');
      return;
    }
    
    console.log('🚀 Starting Forbidden Color game...');
    gameLoopRef.current = true;
    console.log(`🔧 Set gameLoopRef to: ${gameLoopRef.current}`);
    
    const sessionStartTime = Date.now();
    setGameState('running');
    setStats({
      ...INITIAL_STATS,
      sessionStartTime,
      remainingTime: config.sessionTimeLimit,
    });
    setTimeLeft(config.sessionTimeLimit);
    
    // Start session timer if time limit is set
    if (config.sessionTimeLimit > 0) {
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const remaining = Math.max(0, config.sessionTimeLimit - elapsed);
        
        setTimeLeft(remaining);
        setStats(prev => ({ ...prev, remainingTime: remaining }));
        
        if (remaining <= 0) {
          console.log('⏰ Session time limit reached!');
          stopGame();
          return;
        }
        
        sessionTimerRef.current = setTimeout(updateTimer, 1000);
      };
      
      sessionTimerRef.current = setTimeout(updateTimer, 1000);
    }
    
    // Start first round with minimal delay - reduced from 1000ms to 100ms for speed testing
    setTimeout(() => {
      if (gameLoopRef.current) {
        console.log('🎬 Starting first round...');
        startNextRound();
      } else {
        console.log('⚠️ Game stopped before first round could start');
      }
    }, 100);
  }, [config.sessionTimeLimit, startNextRound]);

  const stopGame = useCallback(async () => {
    // Prevent multiple stops
    if (!gameLoopRef.current && gameState === 'idle') {
      console.log('⚠️ Game already stopped, ignoring stop request');
      return;
    }
    
    console.log('Stopping Forbidden Color game...');
    
    // Immediately stop game loop to prevent any race conditions
    gameLoopRef.current = false;
    setGameState('idle');
    clearCurrentTimeout();
    
    // Clear session timer
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    
    // Clear any active rounds
    currentRoundRef.current = null;
    setCurrentRound(null);
    
    // Turn off only connected pads
    const connectedPads = availablePadIds && availablePadIds.length > 0 
      ? availablePadIds 
      : Array.from({ length: config.totalPads }, (_, i) => i);
      
    for (const padId of connectedPads) {
      await sendLed(padId, 'off');
    }
    
    console.log('Game stopped and cleaned up');
  }, [clearCurrentTimeout, sendLed, config.totalPads, availablePadIds]);

  const handlePadPress = useCallback(async (padId: number) => {
    // Use ref for immediate access, not state which might be stale
    const activeRound = currentRoundRef.current;
    
    if (gameState !== 'running' || !activeRound || !activeRound.isActive) {
      console.log(`Pad press ignored - gameState: ${gameState}, activeRound: ${activeRound ? 'exists but inactive' : 'null'}`);
      return;
    }

    // Check if the round is too fresh (prevent immediate triggers)
    const roundAge = Date.now() - activeRound.timestamp;
    if (roundAge < 50) { // Reduced from 200ms to 50ms for speed testing
      console.log(`⏱️ Round too fresh (${roundAge}ms old), ignoring button press`);
      return;
    }

    if (padId !== activeRound.padId) {
      console.log(`Wrong pad pressed - expected pad ${activeRound.padId + 1}, got pad ${padId + 1}`);
      return;
    }

    console.log(`🎯 Valid pad press detected: Pad ${padId + 1}, Actual Color: ${activeRound.color}`);
    
    // CRITICAL: Mark round as inactive immediately to prevent multiple processing
    currentRoundRef.current = { ...activeRound, isActive: false };
    
    // Calculate reaction time
    const reactionTime = roundStartTimeRef.current > 0 ? Date.now() - roundStartTimeRef.current : 0;
    console.log(`⚡ Reaction time: ${reactionTime}ms`);

    if (activeRound.color === 'red') {
      // Pressed forbidden red pad - miss!
      console.log('🔴 Red pad pressed - MISS!');
      updateStats(false, 'red', reactionTime);
      await endCurrentRound();
    } else if (activeRound.color === 'green') {
      // Pressed correct green pad - hit!
      console.log('🟢 Green pad pressed - HIT!');
      updateStats(true, 'green', reactionTime);
      await endCurrentRound();
    }
  }, [gameState, updateStats, endCurrentRound]);

  const updateConfig = useCallback((newConfig: Partial<ForbiddenColorGameConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const resetStats = useCallback(() => {
    setStats(INITIAL_STATS);
  }, []);

  return {
    gameState,
    currentRound,
    stats,
    config,
    startGame,
    stopGame,
    handlePadPress,
    updateConfig,
    resetStats,
    timeLeft,
  };
};