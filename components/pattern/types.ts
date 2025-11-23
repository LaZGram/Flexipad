export interface PatternModeConfig {
  mode: "pattern";
  padIncrementPerLevel: number;
  mistakeBehavior: "restart" | "continue";
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
    difficulty: "easy" | "medium" | "hard";
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
  difficulty: "easy" | "medium" | "hard";
  repeatCount: number;
}