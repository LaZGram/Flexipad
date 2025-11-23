import { QRConfigurationData, VALIDATION_RULES } from './types';
import { LightOutData, LightDelayData, DurationData } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class QRConfigValidator {
  
  static validateConfiguration(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Basic structure validation
      if (!data || typeof data !== 'object') {
        errors.push({
          field: 'root',
          message: 'Invalid QR data format - must be a JSON object',
          code: 'INVALID_FORMAT'
        });
        return { isValid: false, errors, warnings };
      }

      // Version validation
      this.validateVersion(data, errors);
      
      // Type validation
      this.validateType(data, errors);
      
      // Configuration validation
      if (data.configuration) {
        this.validateLightOut(data.configuration.lightOut, errors);
        this.validateLightDelay(data.configuration.lightDelay, errors);
        this.validateDuration(data.configuration.duration, errors);
      } else {
        errors.push({
          field: 'configuration',
          message: 'Configuration section is required',
          code: 'MISSING_CONFIGURATION'
        });
      }

      // Metadata warnings (optional but recommended)
      this.validateMetadata(data.metadata, warnings);

    } catch (error) {
      errors.push({
        field: 'root',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateVersion(data: any, errors: ValidationError[]) {
    if (!data.version) {
      errors.push({
        field: 'version',
        message: 'Version is required',
        code: 'MISSING_VERSION'
      });
    } else if (!VALIDATION_RULES.version.supportedVersions.includes(data.version)) {
      errors.push({
        field: 'version',
        message: `Unsupported version: ${data.version}. Supported: ${VALIDATION_RULES.version.supportedVersions.join(', ')}`,
        code: 'UNSUPPORTED_VERSION'
      });
    }
  }

  private static validateType(data: any, errors: ValidationError[]) {
    if (!data.type) {
      errors.push({
        field: 'type',
        message: 'Type is required',
        code: 'MISSING_TYPE'
      });
    } else if (!VALIDATION_RULES.type.allowedTypes.includes(data.type)) {
      errors.push({
        field: 'type',
        message: `Invalid type: ${data.type}. Must be: ${VALIDATION_RULES.type.allowedTypes.join(', ')}`,
        code: 'INVALID_TYPE'
      });
    }
  }

  private static validateLightOut(lightOut: any, errors: ValidationError[]) {
    if (!lightOut) {
      errors.push({
        field: 'lightOut',
        message: 'Light out configuration is required',
        code: 'MISSING_LIGHT_OUT'
      });
      return;
    }

    const { mode } = lightOut;
    const rules = VALIDATION_RULES.lightOut;

    if (!mode || !rules.mode.allowedValues.includes(mode)) {
      errors.push({
        field: 'lightOut.mode',
        message: `Invalid light out mode. Must be: ${rules.mode.allowedValues.join(', ')}`,
        code: 'INVALID_LIGHT_OUT_MODE'
      });
      return;
    }

    // Validate hitCount for modes that require it
    if (rules.hitCount.requiredFor.includes(mode)) {
      if (lightOut.hitCount === undefined || lightOut.hitCount === null) {
        errors.push({
          field: 'lightOut.hitCount',
          message: `Hit count is required for ${mode} mode`,
          code: 'MISSING_HIT_COUNT'
        });
      } else if (lightOut.hitCount < rules.hitCount.min || lightOut.hitCount > rules.hitCount.max) {
        errors.push({
          field: 'lightOut.hitCount',
          message: `Hit count must be between ${rules.hitCount.min} and ${rules.hitCount.max}`,
          code: 'INVALID_HIT_COUNT'
        });
      }
    }

    // Validate timeout for modes that require it
    if (rules.timeout.requiredFor.includes(mode)) {
      if (lightOut.timeout === undefined || lightOut.timeout === null) {
        errors.push({
          field: 'lightOut.timeout',
          message: `Timeout is required for ${mode} mode`,
          code: 'MISSING_TIMEOUT'
        });
      } else if (lightOut.timeout < rules.timeout.min || lightOut.timeout > rules.timeout.max) {
        errors.push({
          field: 'lightOut.timeout',
          message: `Timeout must be between ${rules.timeout.min} and ${rules.timeout.max} seconds`,
          code: 'INVALID_TIMEOUT'
        });
      }
    }
  }

  private static validateLightDelay(lightDelay: any, errors: ValidationError[]) {
    if (!lightDelay) {
      errors.push({
        field: 'lightDelay',
        message: 'Light delay configuration is required',
        code: 'MISSING_LIGHT_DELAY'
      });
      return;
    }

    const { mode } = lightDelay;
    const rules = VALIDATION_RULES.lightDelay;

    if (!mode || !rules.mode.allowedValues.includes(mode)) {
      errors.push({
        field: 'lightDelay.mode',
        message: `Invalid light delay mode. Must be: ${rules.mode.allowedValues.join(', ')}`,
        code: 'INVALID_LIGHT_DELAY_MODE'
      });
      return;
    }

    // Validate delayTime for Fixed mode
    if (mode === "Fixed") {
      if (lightDelay.delayTime === undefined || lightDelay.delayTime === null) {
        errors.push({
          field: 'lightDelay.delayTime',
          message: 'Delay time is required for Fixed mode',
          code: 'MISSING_DELAY_TIME'
        });
      } else if (lightDelay.delayTime < rules.delayTime.min || lightDelay.delayTime > rules.delayTime.max) {
        errors.push({
          field: 'lightDelay.delayTime',
          message: `Delay time must be between ${rules.delayTime.min} and ${rules.delayTime.max} seconds`,
          code: 'INVALID_DELAY_TIME'
        });
      }
    }

    // Validate randomRange for Random mode
    if (mode === "Random") {
      if (!lightDelay.randomRange) {
        errors.push({
          field: 'lightDelay.randomRange',
          message: 'Random range is required for Random mode',
          code: 'MISSING_RANDOM_RANGE'
        });
      } else {
        const { min, max } = lightDelay.randomRange;
        if (min === undefined || max === undefined) {
          errors.push({
            field: 'lightDelay.randomRange',
            message: 'Random range must have min and max values',
            code: 'INCOMPLETE_RANDOM_RANGE'
          });
        } else if (min >= max) {
          errors.push({
            field: 'lightDelay.randomRange',
            message: 'Random range min must be less than max',
            code: 'INVALID_RANDOM_RANGE'
          });
        } else if (min < rules.randomRange.minRange || max > rules.randomRange.maxRange) {
          errors.push({
            field: 'lightDelay.randomRange',
            message: `Random range must be between ${rules.randomRange.minRange} and ${rules.randomRange.maxRange} seconds`,
            code: 'INVALID_RANDOM_RANGE_VALUES'
          });
        }
      }
    }
  }

  private static validateDuration(duration: any, errors: ValidationError[]) {
    if (!duration) {
      errors.push({
        field: 'duration',
        message: 'Duration configuration is required',
        code: 'MISSING_DURATION'
      });
      return;
    }

    const { mode } = duration;
    const rules = VALIDATION_RULES.duration;

    if (!mode || !rules.mode.allowedValues.includes(mode)) {
      errors.push({
        field: 'duration.mode',
        message: `Invalid duration mode. Must be: ${rules.mode.allowedValues.join(', ')}`,
        code: 'INVALID_DURATION_MODE'
      });
      return;
    }

    // Validate hitCount for modes that require it
    if (rules.hitCount.requiredFor.includes(mode)) {
      if (duration.hitCount === undefined || duration.hitCount === null) {
        errors.push({
          field: 'duration.hitCount',
          message: `Hit count is required for ${mode} mode`,
          code: 'MISSING_DURATION_HIT_COUNT'
        });
      } else if (duration.hitCount < rules.hitCount.min || duration.hitCount > rules.hitCount.max) {
        errors.push({
          field: 'duration.hitCount',
          message: `Duration hit count must be between ${rules.hitCount.min} and ${rules.hitCount.max}`,
          code: 'INVALID_DURATION_HIT_COUNT'
        });
      }
    }

    // Validate timeoutDuration for modes that require it
    if (rules.timeoutDuration.requiredFor.includes(mode)) {
      if (!duration.timeoutDuration) {
        errors.push({
          field: 'duration.timeoutDuration',
          message: `Timeout duration is required for ${mode} mode`,
          code: 'MISSING_TIMEOUT_DURATION'
        });
      } else {
        const { minutes, seconds } = duration.timeoutDuration;
        if (minutes === undefined || seconds === undefined) {
          errors.push({
            field: 'duration.timeoutDuration',
            message: 'Timeout duration must have minutes and seconds',
            code: 'INCOMPLETE_TIMEOUT_DURATION'
          });
        } else if (minutes < 0 || minutes > rules.timeoutDuration.maxMinutes) {
          errors.push({
            field: 'duration.timeoutDuration.minutes',
            message: `Minutes must be between 0 and ${rules.timeoutDuration.maxMinutes}`,
            code: 'INVALID_TIMEOUT_MINUTES'
          });
        } else if (seconds < 0 || seconds > rules.timeoutDuration.maxSeconds) {
          errors.push({
            field: 'duration.timeoutDuration.seconds',
            message: `Seconds must be between 0 and ${rules.timeoutDuration.maxSeconds}`,
            code: 'INVALID_TIMEOUT_SECONDS'
          });
        } else if (minutes === 0 && seconds === 0) {
          errors.push({
            field: 'duration.timeoutDuration',
            message: 'Total timeout duration cannot be zero',
            code: 'ZERO_TIMEOUT_DURATION'
          });
        }
      }
    }
  }

  private static validateMetadata(metadata: any, warnings: ValidationError[]) {
    if (!metadata) {
      warnings.push({
        field: 'metadata',
        message: 'Metadata section is recommended for better organization',
        code: 'MISSING_METADATA'
      });
      return;
    }

    if (!metadata.name) {
      warnings.push({
        field: 'metadata.name',
        message: 'Configuration name is recommended',
        code: 'MISSING_NAME'
      });
    }

    if (!metadata.created_at) {
      warnings.push({
        field: 'metadata.created_at',
        message: 'Creation timestamp is recommended',
        code: 'MISSING_TIMESTAMP'
      });
    }
  }
}

// Configuration converter
export class QRConfigConverter {
  
  static convertToAppFormat(qrData: QRConfigurationData): {
    lightOutData: LightOutData;
    lightDelayData: LightDelayData;
    durationData: DurationData;
  } {
    const { configuration } = qrData;
    
    // Convert Light Out configuration
    const lightOutData: LightOutData = {
      lightOut: configuration.lightOut.mode,
      hitCount: configuration.lightOut.hitCount || 0,
      timeout: configuration.lightOut.timeout || 0
    };

    // Convert Light Delay configuration
    const lightDelayData: LightDelayData = {
      lightDelay: configuration.lightDelay.mode,
      delaytime: configuration.lightDelay.delayTime || 0,
      randomDelay: configuration.lightDelay.mode === "Random" ? 
        (configuration.lightDelay.randomRange?.min || 0.3) : null
    };

    // Convert Duration configuration
    const durationData: DurationData = {
      duration: configuration.duration.mode,
      hitduration: configuration.duration.hitCount || 0,
      minDuration: configuration.duration.timeoutDuration?.minutes || 0,
      secDuration: configuration.duration.timeoutDuration?.seconds || 0
    };

    return {
      lightOutData,
      lightDelayData,
      durationData
    };
  }

  static convertFromAppFormat(
    lightOutData: LightOutData,
    lightDelayData: LightDelayData,
    durationData: DurationData,
    metadata?: any
  ): QRConfigurationData {
    return {
      version: "1.0.0",
      type: "hit_mode_config",
      metadata: {
        name: metadata?.name || "Custom Configuration",
        description: metadata?.description || "Generated from app settings",
        created_at: new Date().toISOString(),
        created_by: metadata?.created_by || "User"
      },
      configuration: {
        lightOut: {
          mode: lightOutData.lightOut as any,
          hitCount: lightOutData.hitCount || undefined,
          timeout: lightOutData.timeout || undefined
        },
        lightDelay: {
          mode: lightDelayData.lightDelay as any,
          delayTime: lightDelayData.delaytime || undefined,
          randomRange: lightDelayData.lightDelay === "Random" ? {
            min: 0.3,
            max: 3.0
          } : undefined
        },
        duration: {
          mode: durationData.duration as any,
          hitCount: durationData.hitduration || undefined,
          timeoutDuration: durationData.duration.includes("Timeout") ? {
            minutes: durationData.minDuration,
            seconds: durationData.secDuration
          } : undefined
        }
      }
    };
  }
}