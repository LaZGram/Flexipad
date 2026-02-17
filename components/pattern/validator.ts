import { PatternModeConfig, LevelPattern } from './types';

export const validatePatternModeConfig = (data: any): { isValid: boolean; config?: PatternModeConfig; error?: string } => {
  try {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid JSON: Expected an object' };
    }

    // Check mode
    if (data.mode !== 'pattern') {
      return { isValid: false, error: 'Invalid mode: Expected "pattern"' };
    }

    // Validate padIncrementPerLevel
    if (!Number.isInteger(data.padIncrementPerLevel) || data.padIncrementPerLevel < 1 || data.padIncrementPerLevel > 5) {
      return { isValid: false, error: 'padIncrementPerLevel must be an integer between 1 and 5' };
    }

    // Validate mistakeBehavior
    if (!['restart', 'continue'].includes(data.mistakeBehavior)) {
      return { isValid: false, error: 'mistakeBehavior must be either "restart" or "continue"' };
    }

    // Validate levelPatterns if provided (optional field)
    if (data.levelPatterns !== undefined) {
      if (!Array.isArray(data.levelPatterns)) {
        return { isValid: false, error: 'levelPatterns must be an array' };
      }

      for (let i = 0; i < data.levelPatterns.length; i++) {
        const levelPattern = data.levelPatterns[i];
        
        if (!levelPattern || typeof levelPattern !== 'object') {
          return { isValid: false, error: `levelPatterns[${i}] must be an object` };
        }

        if (!Number.isInteger(levelPattern.level) || levelPattern.level < 1) {
          return { isValid: false, error: `levelPatterns[${i}].level must be a positive integer` };
        }

        if (!Array.isArray(levelPattern.pattern)) {
          return { isValid: false, error: `levelPatterns[${i}].pattern must be an array` };
        }

        if (levelPattern.pattern.length === 0) {
          return { isValid: false, error: `levelPatterns[${i}].pattern cannot be empty` };
        }

        // Validate each pad index in the pattern
        for (let j = 0; j < levelPattern.pattern.length; j++) {
          const padIndex = levelPattern.pattern[j];
          if (!Number.isInteger(padIndex) || padIndex < 0 || padIndex > 8) {
            return { isValid: false, error: `levelPatterns[${i}].pattern[${j}] must be an integer between 0 and 8 (pad index)` };
          }
        }
      }

      // Validate level numbers are sequential and start from 1
      const levels = data.levelPatterns.map((lp: any) => lp.level).sort((a: number, b: number) => a - b);
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] !== i + 1) {
          return { isValid: false, error: 'levelPatterns must have sequential level numbers starting from 1' };
        }
      }
    }

    // Validate patternSettings
    const patternSettings = data.patternSettings;
    if (!patternSettings || typeof patternSettings !== 'object') {
      return { isValid: false, error: 'patternSettings is required and must be an object' };
    }

    const requiredPatternFields = [
      'initialSequenceLength',
      'maxSequenceLength', 
      'stepTimingMs',
      'showPatternDurationMs',
      'inputTimeoutMs'
    ];

    for (const field of requiredPatternFields) {
      if (!Number.isInteger(patternSettings[field]) || patternSettings[field] < 0) {
        return { isValid: false, error: `patternSettings.${field} must be a positive integer` };
      }
    }

    // Validate sequence length logic
    if (patternSettings.initialSequenceLength > patternSettings.maxSequenceLength) {
      return { isValid: false, error: 'initialSequenceLength cannot be greater than maxSequenceLength' };
    }

    // Validate gameSettings
    const gameSettings = data.gameSettings;
    if (!gameSettings || typeof gameSettings !== 'object') {
      return { isValid: false, error: 'gameSettings is required and must be an object' };
    }

    if (typeof gameSettings.soundEnabled !== 'boolean') {
      return { isValid: false, error: 'gameSettings.soundEnabled must be a boolean' };
    }

    if (typeof gameSettings.vibrationEnabled !== 'boolean') {
      return { isValid: false, error: 'gameSettings.vibrationEnabled must be a boolean' };
    }

    if (!Number.isInteger(gameSettings.repeatCount) || gameSettings.repeatCount < 1) {
      return { isValid: false, error: 'gameSettings.repeatCount must be a positive integer' };
    }

    // Validate metadata
    const metadata = data.metadata;
    if (!metadata || typeof metadata !== 'object') {
      return { isValid: false, error: 'metadata is required and must be an object' };
    }

    if (typeof metadata.version !== 'string' || !metadata.version.trim()) {
      return { isValid: false, error: 'metadata.version is required and must be a non-empty string' };
    }

    if (typeof metadata.createdDate !== 'string' || !metadata.createdDate.trim()) {
      return { isValid: false, error: 'metadata.createdDate is required and must be a non-empty string' };
    }

    // All validation passed
    return {
      isValid: true,
      config: data as PatternModeConfig
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};