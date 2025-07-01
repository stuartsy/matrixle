# Matrixle Design Document

## Executive Summary

Matrixle is a daily puzzle game that applies the Wordle formula to matrix multiplication. Players guess a complete 2×2 matrix multiplied by a 2×1 vector to produce a 2×1 result, using color-coded feedback to deduce the unique daily solution.

**Core Gameplay:** Complete blank canvas → 6 guesses → Mathematical validation → Social sharing

---

## Product Requirements

### MVP Scope
- **Single Game Mode:** 2×2 matrix × 2×1 vector = 2×1 result
- **Daily Puzzle:** One puzzle per day, same for all players
- **6 Attempts:** Standard Wordle attempt limit
- **Mathematical Validation:** All guesses must be arithmetically correct
- **Social Sharing:** Copy/paste results as colored emoji grid
- **Responsive Web App:** Mobile-first design

### Game Template
```
[_ _] × [_] = [_]
[_ _]   [_]   [_]
```

All 6 positions use single digits (1-9). No zeros, no multi-digit numbers in MVP.

---

## Technical Requirements

### Core Validation Logic
Every guess must satisfy the matrix multiplication equations:
```
Given input: [a b] × [e] = [g]
             [c d]   [f]   [h]

Validation: (a×e + b×f) === g AND (c×e + d×f) === h
```

**Critical:** Reject invalid guesses with clear error messaging before providing feedback.

### Feedback System
- **🟩 Green:** Correct digit in correct position
- **🟨 Yellow:** Correct digit in wrong position  
- **⬜ Gray:** Digit not in solution
- **Bottom tracker:** Show all digits 1-9 with their current status

### Data Structure
```javascript
const gameState = {
  targetMatrix: [[2,1], [1,3]],  // Daily solution
  targetVector: [3, 2],
  targetResult: [7, 9],
  guesses: [],                   // Array of 6 guess objects
  currentGuess: 0,               // 0-5
  gameStatus: 'playing',         // 'playing' | 'won' | 'lost'
  digitTracker: {}               // Track color status of digits 1-9
}

const guessObject = {
  matrix: [[a,b], [c,d]],
  vector: [e, f],
  result: [g, h],
  feedback: ['green'|'yellow'|'gray', ...] // 6 positions
}
```

---

## User Interface Specifications

### Game Board Layout
```
┌─────────────────────┐
│     MATRIXLE        │
├─────────────────────┤
│  [_ _] × [_] = [_]  │
│  [_ _]   [_]   [_]  │
│                     │
│ ┌───┬───┬───┬───┐   │ <- Guess 1
│ │ 1 │ 2 │ 3 │ 4 │   │
│ └───┴───┴───┴───┘   │
│                     │
│ ┌───┬───┬───┬───┐   │ <- Guess 2
│ │   │   │   │   │   │
│ └───┴───┴───┴───┘   │
│                     │
│     ... (4 more)    │
├─────────────────────┤
│ 1 2 3 4 5 6 7 8 9   │ <- Digit tracker
└─────────────────────┘
```

### Input Method
- **6 sequential input boxes** per guess row
- **Tab/Enter navigation** between boxes
- **Numeric input only** (1-9, reject other characters)
- **Auto-advance** to next box after valid digit entry
- **Submit button** validates math and provides feedback

### Visual States
- **Empty state:** Light gray boxes with placeholder styling
- **Current guess:** Highlighted border on active row
- **Submitted guess:** Color-coded feedback (green/yellow/gray)
- **Digit tracker:** Show each digit 1-9 with cumulative color status

---

## Game Logic Implementation

### Daily Puzzle Generation
```javascript
// Simple approach for MVP - pre-generated puzzle list
const DAILY_PUZZLES = [
  { matrix: [[2,1],[1,3]], vector: [3,2], result: [7,9] },
  { matrix: [[1,2],[3,1]], vector: [2,1], result: [4,7] },
  // ... 365+ puzzles
];

function getTodaysPuzzle() {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return DAILY_PUZZLES[daysSinceEpoch % DAILY_PUZZLES.length];
}
```

### Validation Function
```javascript
function validateGuess(matrix, vector, result) {
  const calculated1 = matrix[0][0] * vector[0] + matrix[0][1] * vector[1];
  const calculated2 = matrix[1][0] * vector[0] + matrix[1][1] * vector[1];
  
  return calculated1 === result[0] && calculated2 === result[1];
}
```

### Feedback Generation
```javascript
function generateFeedback(guess, target) {
  const feedback = [];
  const targetFlat = [...target.matrix.flat(), ...target.vector, ...target.result];
  const guessFlat = [...guess.matrix.flat(), ...guess.vector, ...guess.result];
  
  // First pass: mark exact matches
  const used = new Array(6).fill(false);
  for (let i = 0; i < 6; i++) {
    if (guessFlat[i] === targetFlat[i]) {
      feedback[i] = 'green';
      used[i] = true;
    }
  }
  
  // Second pass: mark wrong position matches
  for (let i = 0; i < 6; i++) {
    if (feedback[i] !== 'green') {
      const foundIndex = targetFlat.findIndex((val, idx) => 
        val === guessFlat[i] && !used[idx]
      );
      if (foundIndex !== -1) {
        feedback[i] = 'yellow';
        used[foundIndex] = true;
      } else {
        feedback[i] = 'gray';
      }
    }
  }
  
  return feedback;
}
```

---

## Implementation Guidelines

### What NOT to Build (Scope Creep Prevention)
- ❌ Multiple difficulty levels
- ❌ Custom puzzle creation
- ❌ Hints or help system
- ❌ Animations or complex transitions
- ❌ User accounts or statistics tracking
- ❌ Sound effects
- ❌ Multi-language support
- ❌ Accessibility features beyond basic semantic HTML

### MVP Development Order
1. **Core validation logic** - Build and test matrix math validation
2. **Static UI** - Create game board layout without interactivity  
3. **Input handling** - Wire up digit entry and guess submission
4. **Feedback system** - Implement color coding and digit tracker
5. **Game state management** - Win/lose conditions and attempt tracking
6. **Daily puzzle system** - Implement date-based puzzle selection
7. **Share functionality** - Generate shareable emoji grid
8. **Polish and responsive design** - Mobile optimization and visual refinement

### Error Handling
- **Invalid math:** "The math doesn't work out! Try again."
- **Invalid input:** Silently reject non-numeric input
- **Incomplete guess:** Disable submit until all 6 positions filled
- **Game over:** Show solution and share button

### Performance Considerations
- **Static puzzle data** - No API calls required
- **Local storage** - Save game state to prevent refresh loss
- **Minimal bundle size** - Pure JavaScript, no heavy frameworks

---

## Success Metrics

### MVP Launch Criteria
- ✅ 100% mathematical accuracy in validation
- ✅ Consistent daily puzzle for all users
- ✅ Shareable results match actual gameplay
- ✅ Mobile-responsive design
- ✅ Game state persists through browser refresh

### Post-Launch Measurements
- **Daily active users** - Track return engagement
- **Completion rate** - Percentage who finish daily puzzle
- **Average attempts** - Difficulty calibration metric
- **Share rate** - Social media traction indicator

---

## Technical Architecture

### File Structure
```
src/
├── index.html
├── styles.css
├── game.js           // Core game logic
├── ui.js            // DOM manipulation
├── validation.js    // Matrix math validation
├── puzzles.js       // Daily puzzle data
└── share.js         // Social sharing functionality
```

### Key Functions to Implement
```javascript
// game.js
initializeGame()
submitGuess(matrix, vector, result)
checkWinCondition()
generateShareText()

// validation.js  
validateMatrixMultiplication(matrix, vector, result)
generateFeedback(guess, target)

// ui.js
renderGameBoard()
updateDigitTracker()
showFeedback(feedback)
displayEndGame(won, solution)
```

### Browser Support
- **Target:** Chrome 90+, Safari 14+, Firefox 88+
- **Fallbacks:** Graceful degradation for older browsers
- **Testing:** Manual testing on iOS Safari and Android Chrome

---

## Launch Strategy

### Soft Launch
- Deploy to staging environment
- Internal team testing for 1 week
- Fix critical bugs and UX issues

### Public Launch
- Deploy to production
- Social media announcement
- Monitor for mathematical accuracy issues
- Collect user feedback for future iterations

This design document provides clear constraints while leaving implementation details flexible. Focus on the mathematical accuracy and core gameplay loop - everything else is secondary.