# Milestone 2: Static Game Layout

## Objective
Create a responsive, accessible game board that visually represents the matrix multiplication structure and renders correctly across all devices.

## Success Criteria
- [ ] Game board displays 6 guess rows in proper matrix format
- [ ] Layout is responsive and mobile-friendly (320px to 1920px)
- [ ] Input cells are properly sized and accessible
- [ ] Visual hierarchy matches Wordle-style games
- [ ] Game renders without errors on mobile and desktop
- [ ] All interactive elements are keyboard accessible

## Technical Implementation

### 1. Next.js App Structure (`src/app/layout.tsx`)
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Matrixle - Daily Matrix Multiplication Puzzle',
  description: 'A daily puzzle game combining Wordle with matrix multiplication',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}
```

### 2. Main Game Page (`src/app/page.tsx`)
```typescript
import GameBoard from '@/components/GameBoard'
import Header from '@/components/Header'

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-lg">
      <Header />
      <GameBoard />
    </main>
  )
}
```

### 3. Header Component (`src/components/Header.tsx`)
```typescript
export default function Header() {
  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        MATRIXLE
      </h1>
      <p className="text-gray-600 text-sm">
        Daily matrix multiplication puzzle
      </p>
    </header>
  )
}
```

### 4. Game Board Component (`src/components/GameBoard.tsx`)
```typescript
import GuessRow from './GuessRow'

export default function GameBoard() {
  // Static data for layout purposes
  const guessRows = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    isActive: index === 0, // First row active for demo
    isSubmitted: false,
    values: {
      a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''
    }
  }))

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Game Board */}
      <div className="space-y-2 mb-6">
        {guessRows.map((row) => (
          <GuessRow
            key={row.id}
            rowIndex={row.id}
            isActive={row.isActive}
            isSubmitted={row.isSubmitted}
            values={row.values}
          />
        ))}
      </div>
      
      {/* Template visualization */}
      <div className="text-center text-gray-500 text-sm mt-4">
        <div className="font-mono">
          [a b] × [e] = [g]
        </div>
        <div className="font-mono">
          [c d]   [f]   [h]
        </div>
      </div>
    </div>
  )
}
```

### 5. Guess Row Component (`src/components/GuessRow.tsx`)
```typescript
import InputCell from './InputCell'

interface GuessRowProps {
  rowIndex: number
  isActive: boolean
  isSubmitted: boolean
  values: {
    a: string
    b: string
    c: string
    d: string
    e: string
    f: string
    g: string
    h: string
  }
}

export default function GuessRow({ 
  rowIndex, 
  isActive, 
  isSubmitted, 
  values 
}: GuessRowProps) {
  const cellSize = 'w-12 h-12' // 48px x 48px (touch-friendly)
  
  return (
    <div className={`
      flex items-center justify-center gap-2 p-2 rounded-lg
      ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
      ${isSubmitted ? 'opacity-100' : ''}
    `}>
      {/* Matrix [a b] */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <InputCell
            value={values.a}
            cellId={`${rowIndex}-a`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
          <InputCell
            value={values.b}
            cellId={`${rowIndex}-b`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
        </div>
        <div className="flex gap-1">
          <InputCell
            value={values.c}
            cellId={`${rowIndex}-c`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
          <InputCell
            value={values.d}
            cellId={`${rowIndex}-d`}
            size={cellSize}
            isReadOnly={isSubmitted}
          />
        </div>
      </div>
      
      {/* Multiplication symbol */}
      <div className="text-2xl font-bold text-gray-600 px-2">
        ×
      </div>
      
      {/* Vector [e] */}
      <div className="flex flex-col gap-1">
        <InputCell
          value={values.e}
          cellId={`${rowIndex}-e`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
        <InputCell
          value={values.f}
          cellId={`${rowIndex}-f`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
      </div>
      
      {/* Equals symbol */}
      <div className="text-2xl font-bold text-gray-600 px-2">
        =
      </div>
      
      {/* Result [g] */}
      <div className="flex flex-col gap-1">
        <InputCell
          value={values.g}
          cellId={`${rowIndex}-g`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
        <InputCell
          value={values.h}
          cellId={`${rowIndex}-h`}
          size={cellSize}
          isReadOnly={isSubmitted}
        />
      </div>
      
      {/* Submit button for active row */}
      {isActive && (
        <button
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={true} // Disabled for static demo
        >
          Submit
        </button>
      )}
    </div>
  )
}
```

### 6. Input Cell Component (`src/components/InputCell.tsx`)
```typescript
interface InputCellProps {
  value: string
  cellId: string
  size: string
  isReadOnly?: boolean
  feedback?: 'correct' | 'wrong-position' | 'not-in-puzzle'
}

export default function InputCell({ 
  value, 
  cellId, 
  size, 
  isReadOnly = false,
  feedback 
}: InputCellProps) {
  const getFeedbackColor = () => {
    if (!feedback) return 'bg-white border-gray-300'
    
    switch (feedback) {
      case 'correct':
        return 'bg-green-500 text-white border-green-500'
      case 'wrong-position':
        return 'bg-yellow-500 text-white border-yellow-500'
      case 'not-in-puzzle':
        return 'bg-gray-500 text-white border-gray-500'
      default:
        return 'bg-white border-gray-300'
    }
  }

  return (
    <input
      id={cellId}
      type="text"
      value={value}
      readOnly={isReadOnly}
      maxLength={1}
      className={`
        ${size}
        border-2 rounded-md
        text-center text-xl font-bold
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors duration-200
        ${getFeedbackColor()}
        ${isReadOnly ? 'cursor-default' : 'cursor-text'}
      `}
      // Placeholder styling for demo
      placeholder=""
    />
  )
}
```

### 7. Tailwind Configuration (`tailwind.config.ts`)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        correct: '#6aaa64',
        'wrong-position': '#c9b458',
        'not-in-puzzle': '#787c7e',
        'cell-empty': '#d3d6da',
        'cell-filled': '#878a8c'
      },
      screens: {
        'xs': '320px',
      }
    },
  },
  plugins: [],
}
export default config
```

### 8. Global Styles (`src/app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  body {
    @apply text-gray-900 bg-gray-50;
  }
}

@layer components {
  .game-cell {
    @apply w-12 h-12 border-2 rounded-md text-center text-xl font-bold;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
    @apply transition-colors duration-200;
  }
  
  .game-cell-empty {
    @apply bg-white border-gray-300 text-gray-900;
  }
  
  .game-cell-filled {
    @apply bg-gray-100 border-gray-400 text-gray-900;
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .game-cell {
    @apply w-10 h-10 text-lg;
  }
}

@media (max-width: 360px) {
  .game-cell {
    @apply w-8 h-8 text-base;
  }
}
```

## Responsive Design Strategy

### Breakpoints:
- **xs (320px)**: Smallest mobile phones
- **sm (640px)**: Larger mobile phones
- **md (768px)**: Tablets
- **lg (1024px)**: Desktop

### Layout Adaptations:
```typescript
// Cell sizes by breakpoint
const cellSizes = {
  xs: 'w-8 h-8 text-base',   // 32px x 32px
  sm: 'w-10 h-10 text-lg',   // 40px x 40px  
  md: 'w-12 h-12 text-xl',   // 48px x 48px
  lg: 'w-14 h-14 text-2xl'   // 56px x 56px
}

// Responsive container
<div className="container mx-auto px-4 py-8 max-w-lg">
```

### Touch Targets:
- Minimum 44px x 44px for touch accessibility
- Adequate spacing between interactive elements
- Clear visual feedback for touch interactions

## Accessibility Features

### Keyboard Navigation:
- Tab order follows logical sequence (a→b→c→d→e→f→g→h)
- Enter/Space to submit guesses
- Escape to cancel current guess

### Screen Reader Support:
```typescript
<input
  aria-label={`Matrix position ${position}`}
  aria-describedby={`${cellId}-help`}
  role="textbox"
/>

<div id={`${cellId}-help`} className="sr-only">
  Enter a single digit from 1 to 9
</div>
```

### Visual Indicators:
- High contrast colors (WCAG AA compliant)
- Clear focus indicators
- Status messaging for validation errors

## Component Testing

### Visual Regression Tests:
```typescript
// Example test for GameBoard component
import { render, screen } from '@testing-library/react'
import GameBoard from '../GameBoard'

describe('GameBoard', () => {
  test('renders 6 guess rows', () => {
    render(<GameBoard />)
    
    // Should have 6 rows with matrix inputs
    const rows = screen.getAllByRole('group')
    expect(rows).toHaveLength(6)
  })
  
  test('first row is active by default', () => {
    render(<GameBoard />)
    
    const firstRow = screen.getByTestId('guess-row-0')
    expect(firstRow).toHaveClass('bg-blue-50')
  })
  
  test('displays template visualization', () => {
    render(<GameBoard />)
    
    expect(screen.getByText('[a b] × [e] = [g]')).toBeInTheDocument()
    expect(screen.getByText('[c d]   [f]   [h]')).toBeInTheDocument()
  })
})
```

### Responsive Testing:
```typescript
// Test mobile layout
test('renders mobile-friendly layout', () => {
  // Mock mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 320,
  })
  
  render(<GameBoard />)
  
  // Check that cells are appropriately sized
  const cells = screen.getAllByRole('textbox')
  cells.forEach(cell => {
    expect(cell).toHaveClass('w-8', 'h-8')
  })
})
```

## Definition of Done

### Visual Requirements:
- [ ] Game board displays correctly on all target devices
- [ ] Matrix structure is visually clear and intuitive
- [ ] Color scheme matches design specifications
- [ ] Typography is readable and accessible

### Functional Requirements:
- [ ] All input cells render without errors
- [ ] Layout adapts smoothly to different screen sizes
- [ ] Interactive elements are properly sized for touch
- [ ] Component props are properly typed

### Quality Requirements:
- [ ] Components pass all unit tests
- [ ] No accessibility violations detected
- [ ] CSS is optimized and follows utility-first principles
- [ ] Code follows established React patterns

### Browser Support:
- [ ] Chrome 90+ (desktop and mobile)
- [ ] Safari 14+ (desktop and mobile)
- [ ] Firefox 88+
- [ ] Edge 90+

## Testing Checklist

### Manual Testing:
- [ ] Load page on mobile device (320px width)
- [ ] Load page on tablet (768px width)
- [ ] Load page on desktop (1024px+ width)
- [ ] Navigate using only keyboard
- [ ] Test with screen reader
- [ ] Verify color contrast ratios

### Automated Testing:
- [ ] Component renders without errors
- [ ] Proper number of input cells
- [ ] Responsive classes applied correctly
- [ ] Accessibility attributes present

## Next Steps
Once the static layout is complete and tested, Milestone 3 will add input handling and real-time validation, transforming the static display into an interactive game interface.