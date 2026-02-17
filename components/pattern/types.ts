// Individual level pattern configuration
export interface LevelPattern {
  level: number;
  pattern: number[]; // Array of pad indices (0-based)
  description?: string;
}

export interface PatternModeConfig {
  mode: "pattern";
  padIncrementPerLevel: number;
  mistakeBehavior: "restart" | "continue";
  // Optional: Level-based patterns (if provided, overrides automatic generation)
  levelPatterns?: LevelPattern[];
  patternSettings: {
    initialSequenceLength: number;
    maxSequenceLength: number;
    stepTimingMs: number;
    showPatternDurationMs: number;
    inputTimeoutMs: number;
  };
  gameSettings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    repeatCount: number;
  };
  metadata: {
    version: string;
    createdDate: string;
    description?: string;
    author?: string;
  };
}

export interface PatternModeState {
  padIncrementPerLevel: number;
  mistakeBehavior: "restart" | "continue";
  initialSequenceLength: number;
  maxSequenceLength: number;
  maxLevel: number; // Maximum level to reach before game ends
  stepTimingMs: number;
  showPatternDurationMs: number;
  inputTimeoutMs: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  repeatCount: number;
  // Optional: Pre-defined patterns for each level
  levelPatterns?: LevelPattern[];
}