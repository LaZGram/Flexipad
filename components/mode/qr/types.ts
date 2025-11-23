// QR Configuration JSON Structure and Types

export interface QRConfigurationData {
  version: string; // Schema version for future compatibility
  type: "hit_mode_config";
  metadata: {
    name?: string; // Optional configuration name
    description?: string; // Optional description
    created_at: string; // ISO timestamp
    created_by?: string; // Optional creator info
  };
  configuration: {
    lightOut: {
      mode: "Hit" | "Timeout" | "Hit or Timeout";
      hitCount?: number; // Required for Hit and Hit or Timeout
      timeout?: number; // Required for Timeout and Hit or Timeout (in seconds)
    };
    lightDelay: {
      mode: "None" | "Fixed" | "Random";
      delayTime?: number; // Required for Fixed mode (in seconds)
      randomRange?: {
        min: number;
        max: number;
      }; // Required for Random mode
    };
    duration: {
      mode: "Hit" | "Timeout" | "Hit or Timeout";
      hitCount?: number; // Required for Hit and Hit or Timeout
      timeoutDuration?: {
        minutes: number;
        seconds: number;
      }; // Required for Timeout and Hit or Timeout
    };
  };
}

// Example QR Configuration Objects
export const EXAMPLE_QR_CONFIGS: QRConfigurationData[] = [
  {
    version: "1.0.0",
    type: "hit_mode_config",
    metadata: {
      name: "Quick Reaction Training",
      description: "Fast-paced reaction training with 5 hits",
      created_at: new Date().toISOString(),
      created_by: "Training Coach"
    },
    configuration: {
      lightOut: {
        mode: "Hit",
        hitCount: 5
      },
      lightDelay: {
        mode: "Fixed",
        delayTime: 0.5
      },
      duration: {
        mode: "Hit",
        hitCount: 10
      }
    }
  },
  {
    version: "1.0.0",
    type: "hit_mode_config",
    metadata: {
      name: "Endurance Training",
      description: "2-minute timeout-based training session",
      created_at: new Date().toISOString()
    },
    configuration: {
      lightOut: {
        mode: "Timeout",
        timeout: 3
      },
      lightDelay: {
        mode: "Random",
        randomRange: {
          min: 0.3,
          max: 2.0
        }
      },
      duration: {
        mode: "Timeout",
        timeoutDuration: {
          minutes: 2,
          seconds: 0
        }
      }
    }
  },
  {
    version: "1.0.0",
    type: "hit_mode_config",
    metadata: {
      name: "Mixed Training",
      description: "Combined hit and timeout training",
      created_at: new Date().toISOString()
    },
    configuration: {
      lightOut: {
        mode: "Hit or Timeout",
        hitCount: 3,
        timeout: 2
      },
      lightDelay: {
        mode: "Fixed",
        delayTime: 1.0
      },
      duration: {
        mode: "Hit or Timeout",
        hitCount: 15,
        timeoutDuration: {
          minutes: 3,
          seconds: 30
        }
      }
    }
  }
];

// Validation Rules
export const VALIDATION_RULES = {
  version: {
    required: true,
    supportedVersions: ["1.0.0"]
  },
  type: {
    required: true,
    allowedTypes: ["hit_mode_config"]
  },
  lightOut: {
    mode: {
      required: true,
      allowedValues: ["Hit", "Timeout", "Hit or Timeout"]
    },
    hitCount: {
      requiredFor: ["Hit", "Hit or Timeout"],
      min: 1,
      max: 100
    },
    timeout: {
      requiredFor: ["Timeout", "Hit or Timeout"],
      min: 1,
      max: 10
    }
  },
  lightDelay: {
    mode: {
      required: true,
      allowedValues: ["None", "Fixed", "Random"]
    },
    delayTime: {
      requiredFor: ["Fixed"],
      min: 0.1,
      max: 5.0
    },
    randomRange: {
      requiredFor: ["Random"],
      minRange: 0.1,
      maxRange: 5.0
    }
  },
  duration: {
    mode: {
      required: true,
      allowedValues: ["Hit", "Timeout", "Hit or Timeout"]
    },
    hitCount: {
      requiredFor: ["Hit", "Hit or Timeout"],
      min: 1,
      max: 1000
    },
    timeoutDuration: {
      requiredFor: ["Timeout", "Hit or Timeout"],
      maxMinutes: 60,
      maxSeconds: 59
    }
  }
};