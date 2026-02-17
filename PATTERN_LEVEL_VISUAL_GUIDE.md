# Level-Based Pattern Example: Visual Guide

## Example Training Program

This shows how a 5-level training program works step-by-step.

```json
{
  "levelPatterns": [
    {"level": 1, "pattern": [0]},
    {"level": 2, "pattern": [1, 0]},
    {"level": 3, "pattern": [2, 1, 0]},
    {"level": 4, "pattern": [0, 1, 2, 0]},
    {"level": 5, "pattern": [2, 0, 1, 2, 0]}
  ]
}
```

---

## Level 1: Single Pad Warmup

**Pattern**: `[0]` → **Pad 1**

```
Display Phase (RED light):
┌─────┐
│ [1] │  ← RED light (600ms)
└─────┘

Player Input (BLUE on correct):
┌─────┐
│ [1] │  ← Player presses → BLUE feedback ✅
└─────┘

Result: ✅ CORRECT → Advance to Level 2
```

---

## Level 2: Two-Pad Sequence

**Pattern**: `[1, 0]` → **Pad 2 → Pad 1**

```
Display Phase (RED lights):
Step 1:         Step 2:
┌─────┐        ┌─────┐
│ [2] │  (RED) │ [1] │  (RED)
└─────┘        └─────┘

Player Input:
Step 1:         Step 2:
┌─────┐        ┌─────┐
│ [2] │  ✅     │ [1] │  ✅
└─────┘        └─────┘

Result: ✅ CORRECT → Advance to Level 3
```

---

## Level 3: Three-Pad Sequence

**Pattern**: `[2, 1, 0]` → **Pad 3 → Pad 2 → Pad 1**

```
Display Phase (RED lights):
Step 1:    Step 2:    Step 3:
┌─────┐   ┌─────┐   ┌─────┐
│ [3] │   │ [2] │   │ [1] │
└─────┘   └─────┘   └─────┘
  RED       RED       RED

Player Input:
Step 1:    Step 2:    Step 3:
┌─────┐   ┌─────┐   ┌─────┐
│ [3] │   │ [2] │   │ [1] │
└─────┘   └─────┘   └─────┘
  ✅ BLUE   ✅ BLUE   ✅ BLUE

Result: ✅ CORRECT → Advance to Level 4
```

---

## Level 4: Return Pattern

**Pattern**: `[0, 1, 2, 0]` → **Pad 1 → Pad 2 → Pad 3 → Pad 1**

```
Display Phase (RED lights):
Step 1:    Step 2:    Step 3:    Step 4:
┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
│ [1] │   │ [2] │   │ [3] │   │ [1] │
└─────┘   └─────┘   └─────┘   └─────┘

Player Input:
┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
│ [1] │   │ [2] │   │ [3] │   │ [1] │
└─────┘   └─────┘   └─────┘   └─────┘
  ✅        ✅        ✅        ✅

Result: ✅ CORRECT → Advance to Level 5
```

---

## Level 5: Complex Diagonal Pattern

**Pattern**: `[2, 0, 1, 2, 0]` → **Pad 3 → Pad 1 → Pad 2 → Pad 3 → Pad 1**

```
Display Phase (RED lights):
Step 1     Step 2     Step 3     Step 4     Step 5
┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
│ [3] │   │ [1] │   │ [2] │   │ [3] │   │ [1] │
└─────┘   └─────┘   └─────┘   └─────┘   └─────┘

Player Input:
┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
│ [3] │   │ [1] │   │ [2] │   │ [3] │   │ [1] │
└─────┘   └─────┘   └─────┘   └─────┘   └─────┘
  ✅        ✅        ✅        ✅        ✅

Result: ✅ ALL LEVELS COMPLETE! 🎉
```

---

## Error Handling Examples

### Mistake with "continue" behavior:

```
Level 3, Step 2 - Player presses WRONG pad:

Expected:       Player pressed:
┌─────┐        ┌─────┐
│ [2] │   ←    │ [1] │  ❌ RED BLINKING
└─────┘        └─────┘

Action: Restart Level 3 from beginning
Show pattern again, player tries Level 3 again
```

### Mistake with "restart" behavior:

```
Level 4, Step 3 - Player presses WRONG pad:

Expected:       Player pressed:
┌─────┐        ┌─────┐
│ [3] │   ←    │ [2] │  ❌ RED BLINKING
└─────┘        └─────┘

Action: Restart from Level 1
Player starts over from the beginning
```

---

## Timeline Example (Medium Difficulty)

### Level 2: Pad 2 → Pad 1

```
Time:   0ms     600ms   900ms   1500ms  1800ms  2400ms  ...
        │       │       │       │       │       │       │
Event:  [2 RED] [OFF]   [1 RED] [OFF]   [BEEP]  [WAIT FOR INPUT]
        └───────┘       └───────┘       └───────┘
         600ms           600ms           Ready
         display         display         signal

Player Input Phase (starts after beep):
Time:   2400ms  2700ms  3000ms  ...
        │       │       │       │
Event:  [Press 2] [BLUE] [Press 1] [BLUE] → LEVEL COMPLETE!
         ✅       300ms    ✅       300ms
                 feedback          feedback
```

---

## Pad Layout Reference

### Physical Pad Numbers vs Array Indices

```
Visual Display:              Array Indices:

┌─────┬─────┬─────┐         ┌─────┬─────┬─────┐
│  1  │  2  │  3  │         │  0  │  1  │  2  │
├─────┼─────┼─────┤         ├─────┼─────┼─────┤
│  4  │  5  │  6  │         │  3  │  4  │  5  │
├─────┼─────┼─────┤         ├─────┼─────┼─────┤
│  7  │  8  │  9  │         │  6  │  7  │  8  │
└─────┴─────┴─────┘         └─────┴─────┴─────┘

Player sees: 1-9            JSON uses: 0-8
```

---

## Creating Your Own Patterns

### Pattern Ideas

**Linear Progression**:
- Level 1: `[0]` (1)
- Level 2: `[0, 1]` (1, 2)
- Level 3: `[0, 1, 2]` (1, 2, 3)

**Reverse Sequence**:
- Level 1: `[2]` (3)
- Level 2: `[2, 1]` (3, 2)
- Level 3: `[2, 1, 0]` (3, 2, 1)

**Diagonal Pattern**:
- Level 1: `[0]` (1)
- Level 2: `[0, 4]` (1, 5)
- Level 3: `[0, 4, 8]` (1, 5, 9)

**Corners Pattern**:
- Level 1: `[0, 2]` (1, 3)
- Level 2: `[0, 2, 6, 8]` (1, 3, 7, 9)

**Cross Pattern**:
- Level 1: `[4]` (5)
- Level 2: `[1, 4, 7]` (2, 5, 8)
- Level 3: `[3, 4, 5]` (4, 5, 6)

---

## Quick Start Example

Copy this into `my-training.json`:

```json
{
  "mode": "pattern",
  "padIncrementPerLevel": 1,
  "mistakeBehavior": "continue",
  "levelPatterns": [
    {"level": 1, "pattern": [0], "description": "Single pad"},
    {"level": 2, "pattern": [0, 1], "description": "Two pads"},
    {"level": 3, "pattern": [1, 0, 1], "description": "Return pattern"}
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
    "description": "My First Pattern Training"
  }
}
```

Generate QR → Scan in app → Start playing!

---

**Remember**: 
- Pad numbers (1-9) in the app
- Array indices (0-8) in JSON
- RED = Pattern display
- BLUE = Correct input
- RED BLINKING = Wrong input
