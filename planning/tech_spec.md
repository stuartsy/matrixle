# Matrixle Technical Specification

## Overview
A Next.js/React application implementing a daily matrix multiplication puzzle game, deployable on Vercel with client-side state management and no backend requirements.

## Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **UI**: React 18+ with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks (useState, useReducer, useContext)
- **Storage**: localStorage for game persistence
- **Deployment**: Vercel (zero-config deployment)
- **Testing**: Jest + React Testing Library

### Project Structure
```
matrixle/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── favicon.ico
│   ├── components/
│   │   ├── GameBoard.tsx
│   │   ├── GuessRow.tsx
│   │   ├── InputCell.tsx
│   │   ├── DigitTracker.tsx
│   │   ├── ShareModal.tsx
│   │   └── Header.tsx
│   ├── hooks/
│   │   ├── useGameState.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDailyPuzzle.ts
│   ├── lib/
│   │   ├── game-logic.ts
│   │   ├── validation.ts
│   │   ├── feedback.ts
│   │   ├── puzzles.ts
│   │   └── utils.ts
│   └── types/
│       └── game.ts
├── public/
├── tailwind.config.js
├── next.config.js
├── package.json
└── tsconfig.json
```

## Data Models

### Core Types
```typescript
// types/game.ts
export interface Matrix2x2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface Vector2x1 {
  e: number;
  f: number;
}

export interface Result2x1 {
  g: number;
  h: number;
}

export interface Puzzle {
  matrix: Matrix2x2;
  vector: Vector2x1;
  result: Result2x1;
  id: string;
  date: string;
}

export interface Guess {
  matrix: Matrix2x2;
  vector: Vector2x1;
  result: Result2x1;
  feedback: FeedbackColor[];
  isValid: boolean;
}

export type FeedbackColor = 'correct' | 'wrong-position' | 'not-in-puzzle';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  puzzle: Puzzle;
  guesses: Guess[];
  currentGuess: number;
  status: GameStatus;
  digitTracker: Record<string, FeedbackColor>;
}
```

### Local Storage Schema
```typescript
interface StoredGameState {
  date: string;
  gameState: GameState;
  completedAt?: string;
  shareData?: string;
}
```

## Core Components

### 1. Game Board (`components/GameBoard.tsx`)
- Main game container
- Renders 6 guess rows
- Manages current guess state
- Handles game completion

### 2. Guess Row (`components/GuessRow.tsx`)
- 6 input cells arranged as: [a b] × [e] = [g]
                              [c d]   [f]   [h]
- Submit button with validation
- Color-coded feedback display
- Auto-focus management

### 3. Input Cell (`components/InputCell.tsx`)
- Single digit input (1-9 only)
- Auto-advance on valid input
- Backspace handling
- Accessibility support

### 4. Digit Tracker (`components/DigitTracker.tsx`)
- Display digits 1-9 with color status
- Updates based on all previous guesses
- Visual feedback for eliminated/confirmed digits

### 5. Share Modal (`components/ShareModal.tsx`)
- Emoji grid generation
- Copy to clipboard functionality
- Social media sharing text

## Game Logic

### Puzzle Generation (`lib/puzzles.ts`)
```typescript
// Static puzzle array for MVP
const DAILY_PUZZLES: Puzzle[] = [
  {
    id: '2024-01-01',
    date: '2024-01-01',
    matrix: { a: 2, b: 1, c: 1, d: 3 },
    vector: { e: 3, f: 2 },
    result: { g: 8, h: 9 }
  },
  // ... 365+ puzzles
];

export function getTodaysPuzzle(): Puzzle {
  const today = new Date().toISOString().split('T')[0];
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const puzzleIndex = daysSinceEpoch % DAILY_PUZZLES.length;
  
  return {
    ...DAILY_PUZZLES[puzzleIndex],
    date: today
  };
}
```

### Validation (`lib/validation.ts`)
```typescript
export function validateMatrixMultiplication(
  matrix: Matrix2x2,
  vector: Vector2x1,
  result: Result2x1
): boolean {
  const calculated_g = matrix.a * vector.e + matrix.b * vector.f;
  const calculated_h = matrix.c * vector.e + matrix.d * vector.f;
  
  return calculated_g === result.g && calculated_h === result.h;
}

export function isValidDigit(input: string): boolean {
  return /^[1-9]$/.test(input);
}

export function isCompleteGuess(guess: Partial<Guess>): boolean {
  const { matrix, vector, result } = guess;
  return !!(
    matrix?.a && matrix?.b && matrix?.c && matrix?.d &&
    vector?.e && vector?.f &&
    result?.g && result?.h
  );
}
```

### Feedback System (`lib/feedback.ts`)
```typescript
export function generateFeedback(
  guess: Guess,
  target: Puzzle
): FeedbackColor[] {
  const guessArray = [
    guess.matrix.a, guess.matrix.b,
    guess.matrix.c, guess.matrix.d,
    guess.vector.e, guess.vector.f
  ];
  
  const targetArray = [
    target.matrix.a, target.matrix.b,
    target.matrix.c, target.matrix.d,
    target.vector.e, target.vector.f
  ];
  
  const feedback: FeedbackColor[] = [];
  const used = new Array(6).fill(false);
  
  // First pass: exact matches
  for (let i = 0; i < 6; i++) {
    if (guessArray[i] === targetArray[i]) {
      feedback[i] = 'correct';
      used[i] = true;
    }
  }
  
  // Second pass: wrong position matches
  for (let i = 0; i < 6; i++) {
    if (feedback[i] !== 'correct') {
      const foundIndex = targetArray.findIndex((val, idx) => 
        val === guessArray[i] && !used[idx]
      );
      
      if (foundIndex !== -1) {
        feedback[i] = 'wrong-position';
        used[foundIndex] = true;
      } else {
        feedback[i] = 'not-in-puzzle';
      }
    }
  }
  
  return feedback;
}
```

## State Management

### Game State Hook (`hooks/useGameState.ts`)
```typescript
export function useGameState() {
  const [gameState, dispatch] = useReducer(gameStateReducer, initialState);
  
  const submitGuess = useCallback((guess: Partial<Guess>) => {
    if (!isCompleteGuess(guess)) return;
    
    const completeGuess = guess as Guess;
    const isValid = validateMatrixMultiplication(
      completeGuess.matrix,
      completeGuess.vector,
      completeGuess.result
    );
    
    if (!isValid) {
      // Show error, don't submit
      return;
    }
    
    const feedback = generateFeedback(completeGuess, gameState.puzzle);
    dispatch({
      type: 'SUBMIT_GUESS',
      payload: { ...completeGuess, feedback, isValid }
    });
  }, [gameState.puzzle]);
  
  return {
    gameState,
    submitGuess,
    resetGame: () => dispatch({ type: 'RESET_GAME' })
  };
}
```

### Local Storage Hook (`hooks/useLocalStorage.ts`)
```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, [key]);
  
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key]);
  
  return [storedValue, setValue] as const;
}
```

## Styling Strategy

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        correct: '#6aaa64',
        'wrong-position': '#c9b458',
        'not-in-puzzle': '#787c7e',
        'cell-empty': '#d3d6da',
        'cell-filled': '#878a8c'
      },
      gridTemplateColumns: {
        'matrix': 'repeat(4, 1fr) auto repeat(1, 1fr) auto repeat(1, 1fr)'
      }
    }
  }
}
```

### Responsive Design
- Mobile-first approach (320px+)
- Tablet optimization (768px+)
- Desktop layout (1024px+)
- Touch-friendly input cells (44px minimum)

## Performance Optimizations

### Code Splitting
```typescript
// Lazy load share modal
const ShareModal = lazy(() => import('./components/ShareModal'));

// Preload critical game logic
const gameLogic = import('./lib/game-logic');
```

### Memoization
```typescript
// Memoize expensive calculations
const feedback = useMemo(() => 
  generateFeedback(currentGuess, puzzle), 
  [currentGuess, puzzle]
);

// Memoize digit tracker updates
const digitTracker = useMemo(() => 
  calculateDigitStatus(allGuesses), 
  [allGuesses]
);
```

## Testing Strategy

### Unit Tests
- `lib/validation.test.ts` - Matrix multiplication validation
- `lib/feedback.test.ts` - Feedback generation logic
- `lib/puzzles.test.ts` - Daily puzzle selection

### Component Tests
- `GameBoard.test.tsx` - Game flow integration
- `GuessRow.test.tsx` - Input handling and validation
- `DigitTracker.test.tsx` - Status tracking accuracy

### E2E Tests (Optional)
- Complete game flow
- Share functionality
- Local storage persistence

## Deployment

### Vercel Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### Environment Setup
- No environment variables required for MVP
- All data is static and client-side
- Zero-config Vercel deployment

### Build Optimizations
- Static generation for all pages
- Automatic code splitting
- Image optimization disabled (no images in MVP)
- Bundle size target: <100KB gzipped

## Error Handling

### User-Facing Errors
- "The math doesn't work out! Try again." - Invalid matrix multiplication
- "Please fill in all boxes" - Incomplete guess
- "Game completed!" - Win/lose state messaging

### Technical Error Handling
- localStorage quota exceeded
- Invalid puzzle data
- Network errors (none expected in MVP)
- Browser compatibility issues

## Analytics & Monitoring

### Client-Side Tracking (Future)
- Game completion rates
- Average attempts per puzzle
- Share button usage
- Daily active users

### Error Monitoring
- Sentry integration for production errors
- Client-side error boundaries
- Performance monitoring

## Security Considerations

### Data Protection
- No user data collection in MVP
- Local storage only contains game state
- No external API calls or data transmission

### Content Security
- No user-generated content
- Static puzzle data only
- XSS prevention through React's built-in escaping

## Future Enhancements (Post-MVP)

### Phase 2 Features
- Multiple difficulty levels (3×3 matrices)
- User statistics and streaks
- Custom puzzle creation
- Social features and leaderboards

### Technical Improvements
- Service Worker for offline play
- Progressive Web App features
- Animation and micro-interactions
- Accessibility enhancements (WCAG 2.1 AA)

## Development Order of Operations

### Milestone 1: Core Validation Engine
**Deliverable**: Working matrix multiplication validator that can be tested in isolation
- Set up Next.js project with TypeScript
- Implement `lib/validation.ts` with matrix multiplication logic
- Create basic types in `types/game.ts`
- Write unit tests for validation functions
- **Test**: `npm test` passes all validation tests

### Milestone 2: Static Game Layout
**Deliverable**: Visual game board that renders correctly on all devices
- Create basic Next.js page structure
- Implement `GameBoard.tsx` with 6 guess rows
- Build `GuessRow.tsx` with 6 input cells in matrix format
- Add Tailwind CSS styling for responsive layout
- **Test**: Game board displays correctly on mobile/desktop, inputs are accessible

### Milestone 3: Input System
**Deliverable**: Functional input handling with real-time validation
- Implement `InputCell.tsx` with digit-only input (1-9)
- Add auto-focus progression between cells
- Wire up guess submission with validation feedback
- Display validation errors for invalid math
- **Test**: Can enter guesses, invalid math is rejected, complete guesses are accepted

### Milestone 4: Feedback System
**Deliverable**: Color-coded feedback matching Wordle rules
- Implement `lib/feedback.ts` for green/yellow/gray logic
- Update `GuessRow.tsx` to display feedback colors
- Create `DigitTracker.tsx` showing digit status (1-9)
- Add game state management with `useGameState` hook
- **Test**: Feedback colors are accurate, digit tracker updates correctly

### Milestone 5: Daily Puzzle System
**Deliverable**: Consistent daily puzzles for all users
- Implement `lib/puzzles.ts` with static puzzle array
- Add date-based puzzle selection logic
- Integrate daily puzzle into game state
- Add localStorage for game persistence
- **Test**: Same puzzle appears for all users on the same day, game state persists on refresh

### Milestone 6: Win/Loss & Sharing
**Deliverable**: Complete game loop with social sharing
- Add win/loss detection and end-game states
- Implement `ShareModal.tsx` with emoji grid generation
- Add copy-to-clipboard functionality
- Handle 6-guess limit and game completion
- **Test**: Games end correctly, share text matches actual gameplay

### Milestone 7: Production Polish
**Deliverable**: Production-ready application
- Responsive design optimization
- Error boundary implementation
- Performance optimization (memoization, code splitting)
- Vercel deployment configuration
- **Test**: App works smoothly on all devices, deploys successfully to Vercel

Each milestone builds incrementally toward a working MVP, with clear testable deliverables that demonstrate progress.