# Pattern Level-Based System - Quick Reference

## System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CREATE CONFIGURATION                      │
├─────────────────────────────────────────────────────────────┤
│  1. Create JSON file with levelPatterns array               │
│  2. Define pattern sequence for each level                  │
│  3. Set timing and behavior parameters                      │
│  4. Add metadata (description, version, etc.)               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    GENERATE QR CODE                          │
├─────────────────────────────────────────────────────────────┤
│  Use any QR code generator to create QR from JSON text      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SCAN QR IN APP                            │
├─────────────────────────────────────────────────────────────┤
│  Pattern Mode → Scan QR tab → Scan QR Code button          │
│  System validates configuration automatically                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    START GAME                                │
├─────────────────────────────────────────────────────────────┤
│  Game uses pre-defined patterns from levelPatterns array    │
│  Progresses through levels 1 → 2 → 3 → ... → N             │
│  Each level has its unique pattern                          │
└─────────────────────────────────────────────────────────────┘
```

## Level Pattern Definition

### JSON Structure

```json
"levelPatterns": [
  {
    "level": 1,           // Level number (must be sequential)
    "pattern": [0],       // Array of pad indices (0-8)
    "description": "..."  // Optional description
  }
]
```

### Pad Index Mapping

```
Pad Display Number:  1    2    3    4    5    6    7    8    9
Array Index:         0    1    2    3    4    5    6    7    8
```

### Example Patterns

| Pattern Type | JSON Array | Visual Sequence |
|--------------|-----------|-----------------|
| Single pad | `[0]` | Pad 1 |
| Two pads | `[0, 1]` | Pad 1 → Pad 2 |
| Return | `[0, 1, 0]` | Pad 1 → Pad 2 → Pad 1 |
| Reverse | `[2, 1, 0]` | Pad 3 → Pad 2 → Pad 1 |
| Repeat | `[0, 0, 1]` | Pad 1 → Pad 1 → Pad 2 |
| Complex | `[0, 2, 1, 2, 0]` | Pad 1 → Pad 3 → Pad 2 → Pad 3 → Pad 1 |

## Game Behavior

### Pattern Display Phase
1. **RED lights** show the pattern sequence
2. Each pad lights for `showPatternDurationMs` (default: 600ms)
3. Gap of `stepTimingMs` between steps (default: 300ms)
4. All lights turn off
5. Ready beep plays

### Input Phase
1. Player must repeat the pattern
2. **BLUE light** on correct pad press
3. **RED blinking** on wrong pad
4. Timeout of `inputTimeoutMs` (default: 3000ms)

### Level Progression
- ✅ Complete pattern correctly → Next level
- ❌ Make mistake with `restart` → Back to Level 1
- ❌ Make mistake with `continue` → Restart current level
- 🎉 Complete all levels → Game finished

## Example: Simple 3-Level Training

```json
{
  "mode": "pattern",
  "padIncrementPerLevel": 1,
  "mistakeBehavior": "continue",
  "levelPatterns": [
    {
      "level": 1,
      "pattern": [0],
      "description": "Single pad warmup"
    },
    {
      "level": 2,
      "pattern": [0, 1],
      "description": "Two-pad sequence"
    },
    {
      "level": 3,
      "pattern": [1, 0, 1],
      "description": "Three-pad challenge"
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
    "description": "Quick 3-Level Training"
  }
}
```

## Files Created

1. **`pattern-level-based-example.json`** - 5 levels, medium difficulty
2. **`pattern-level-based-advanced.json`** - 8 levels, hard difficulty  
3. **`pattern-level-based-beginner.json`** - 10 levels, easy difficulty
4. **`PATTERN_LEVEL_BASED_GUIDE.md`** - Complete documentation

## Quick Tips

✅ **DO**:
- Start with simple patterns (1-2 pads)
- Increase complexity gradually
- Test your JSON for validity
- Use descriptive names in metadata

❌ **DON'T**:
- Skip level numbers (must be 1, 2, 3...)
- Use pad indices > 8
- Leave pattern arrays empty
- Forget required fields

## Testing Your Configuration

1. Validate JSON syntax at jsonlint.com
2. Check all level numbers are sequential
3. Verify all pad indices are 0-8
4. Ensure all required fields present
5. Generate QR and test scan in app

---

**Ready to start?** Choose an example file, modify it, generate QR, and scan!
