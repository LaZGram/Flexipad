# Level-Based Pattern Mode - Configuration Guide

## Overview

The Pattern Mode now supports **custom level-based patterns** where you can define specific pad sequences for each level. This allows you to create structured training programs with precise control over difficulty progression.

## Features

- ✅ **Pre-defined Patterns**: Assign specific pad sequences to each level
- ✅ **Flexible Configuration**: Mix pre-defined and auto-generated levels
- ✅ **QR Code Import**: Easy configuration via QR code scanning
- ✅ **Progressive Training**: Design custom training programs with controlled difficulty
- ✅ **Level Descriptions**: Document the purpose of each level

## JSON Configuration Structure

### Basic Structure

```json
{
  "mode": "pattern",
  "padIncrementPerLevel": 1,
  "mistakeBehavior": "restart",
  "levelPatterns": [
    {
      "level": 1,
      "pattern": [0],
      "description": "Level 1: Just pad 1"
    },
    {
      "level": 2,
      "pattern": [1, 0],
      "description": "Level 2: Pad 2, then pad 1"
    }
  ],
  "patternSettings": { ... },
  "gameSettings": { ... },
  "metadata": { ... }
}
```

### Level Patterns Array

Each level pattern has:
- **`level`** (required): Integer, must be sequential starting from 1
- **`pattern`** (required): Array of pad indices (0-8, representing pads 1-9)
- **`description`** (optional): Text description of the pattern

### Pad Index Reference

| Pad Number | Array Index |
|------------|-------------|
| Pad 1      | 0           |
| Pad 2      | 1           |
| Pad 3      | 2           |
| Pad 4      | 3           |
| Pad 5      | 4           |
| Pad 6      | 5           |
| Pad 7      | 6           |
| Pad 8      | 7           |
| Pad 9      | 8           |

## Example Configurations

### Example 1: Simple Progressive Pattern

**File**: `pattern-level-based-example.json`

- Level 1: Pad 1 only
- Level 2: Pad 2 → Pad 1
- Level 3: Pad 3 → Pad 2 → Pad 1
- Level 4: Pad 1 → Pad 2 → Pad 3 → Pad 1
- Level 5: Complex 5-step pattern

**Difficulty**: Medium  
**Mistake Behavior**: Restart from Level 1

### Example 2: Advanced Training

**File**: `pattern-level-based-advanced.json`

- 8 levels with increasing complexity
- Includes diamond patterns, zigzag movements, double taps
- Faster timing (500ms display, 250ms step)

**Difficulty**: Hard  
**Mistake Behavior**: Continue (restart current level only)

### Example 3: Beginner Friendly

**File**: `pattern-level-based-beginner.json`

- 10 levels with gentle progression
- Starts with single pad, gradually adds complexity
- Slower timing (700ms display, 400ms step)
- More forgiving timeout (4 seconds)

**Difficulty**: Easy  
**Mistake Behavior**: Continue

## Configuration Fields

### Mode Settings

```json
{
  "padIncrementPerLevel": 1,        // Ignored when levelPatterns is provided
  "mistakeBehavior": "restart"      // "restart" or "continue"
}
```

- **`padIncrementPerLevel`**: How many pads to add per level (used only for auto-generated patterns)
- **`mistakeBehavior`**:
  - `"restart"`: Restart from Level 1 on mistake
  - `"continue"`: Restart current level on mistake

### Pattern Settings

```json
{
  "patternSettings": {
    "initialSequenceLength": 1,      // Starting pattern length
    "maxSequenceLength": 10,         // Maximum pattern length
    "stepTimingMs": 300,             // Gap between pattern steps (ms)
    "showPatternDurationMs": 600,    // How long each pad lights up (ms)
    "inputTimeoutMs": 3000           // Player input timeout (ms)
  }
}
```

### Game Settings

```json
{
  "gameSettings": {
    "soundEnabled": true,            // Enable sound feedback
    "vibrationEnabled": true,        // Enable vibration feedback
    "difficulty": "medium",          // "easy", "medium", or "hard"
    "repeatCount": 1                 // Number of repetitions per level
  }
}
```

### Metadata

```json
{
  "metadata": {
    "version": "1.0.0",              // Configuration version
    "createdDate": "2025-12-18",     // Creation date
    "description": "Training program description",
    "author": "Your name"            // Optional author name
  }
}
```

## How to Use

### 1. Create Your Configuration

1. Copy one of the example JSON files
2. Modify the `levelPatterns` array to define your custom sequences
3. Adjust timing and behavior settings as needed
4. Update metadata with description and date

### 2. Generate QR Code

Use a QR code generator to create a QR code from your JSON:
- Online: Use websites like qr-code-generator.com
- Command line: Use `qrencode` or similar tools
- Make sure to generate a QR code that contains the entire JSON text

### 3. Import in App

1. Open the Pattern Mode in the app
2. Go to the **"Scan QR"** tab
3. Tap **"Scan QR Code"**
4. Scan your generated QR code
5. The configuration will be imported and validated
6. Start playing with your custom level patterns!

## Pattern Design Tips

### Progressive Difficulty

- Start with single pad (e.g., `[0]`)
- Add one pad at a time
- Introduce repetition (e.g., `[0, 0]`)
- Mix different pads (e.g., `[0, 1]`)
- Create patterns (e.g., `[0, 1, 2]`)

### Pattern Types

**Linear**: `[0, 1, 2]` - Sequential movement  
**Reverse**: `[2, 1, 0]` - Backward movement  
**Return**: `[0, 1, 0]` - Back to start  
**Zigzag**: `[0, 2, 1, 2, 0]` - Alternating movement  
**Double**: `[0, 0, 1, 1]` - Repeated pads  
**Cycle**: `[0, 1, 2, 0, 1, 2]` - Repeating sequence

### Timing Guidelines

| Difficulty | Display Time | Step Gap | Input Timeout |
|------------|--------------|----------|---------------|
| Easy       | 700ms        | 400ms    | 4000ms        |
| Medium     | 600ms        | 300ms    | 3000ms        |
| Hard       | 500ms        | 250ms    | 3000ms        |
| Expert     | 400ms        | 200ms    | 2500ms        |

## Validation Rules

The system validates your configuration:

✅ **Mode**: Must be `"pattern"`  
✅ **Level Numbers**: Must be sequential starting from 1  
✅ **Pattern Arrays**: Cannot be empty  
✅ **Pad Indices**: Must be 0-8 (representing pads 1-9)  
✅ **Mistake Behavior**: Must be `"restart"` or `"continue"`  
✅ **All Required Fields**: Must be present

## Fallback Behavior

- If no `levelPatterns` are provided, the system generates random patterns automatically
- If a level is not found in `levelPatterns`, it generates a random pattern for that level
- Game ends when reaching the last defined level (if using `levelPatterns`)

## Example: Creating a Custom Training Program

```json
{
  "mode": "pattern",
  "padIncrementPerLevel": 1,
  "mistakeBehavior": "continue",
  "levelPatterns": [
    {
      "level": 1,
      "pattern": [0],
      "description": "Warmup: Single tap on Pad 1"
    },
    {
      "level": 2,
      "pattern": [0, 1],
      "description": "Two-pad sequence"
    },
    {
      "level": 3,
      "pattern": [1, 0, 1],
      "description": "Return pattern"
    },
    {
      "level": 4,
      "pattern": [0, 1, 2, 1],
      "description": "Triangle pattern"
    },
    {
      "level": 5,
      "pattern": [2, 0, 1, 2, 0],
      "description": "Advanced diagonal pattern"
    }
  ],
  "patternSettings": {
    "initialSequenceLength": 1,
    "maxSequenceLength": 10,
    "stepTimingMs": 300,
    "showPatternDurationMs": 600,
    "inputTimeoutMs": 3000
  },
  "gameSettings": {
    "soundEnabled": true,
    "vibrationEnabled": true,
    "difficulty": "medium",
    "repeatCount": 1
  },
  "metadata": {
    "version": "1.0.0",
    "createdDate": "2025-12-18",
    "description": "Custom Training Program - Progressive Pattern Mastery",
    "author": "Coach Name"
  }
}
```

## Support

For issues or questions:
1. Verify your JSON is valid (use jsonlint.com)
2. Check that all pad indices are 0-8
3. Ensure level numbers are sequential
4. Confirm all required fields are present

---

**Version**: 1.0.0  
**Last Updated**: December 18, 2025
