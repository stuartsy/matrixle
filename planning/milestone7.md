# Milestone 7: Production Polish

## Objective
Transform the functional game into a production-ready application with optimized performance, error boundaries, accessibility compliance, and seamless Vercel deployment.

## Success Criteria
- [ ] Application loads in under 3 seconds on 3G networks
- [ ] Zero accessibility violations (WCAG 2.1 AA compliance)
- [ ] Comprehensive error handling with user-friendly messages
- [ ] Responsive design works flawlessly on all target devices
- [ ] Bundle size under 100KB gzipped
- [ ] PWA features for offline play
- [ ] Production deployment succeeds on Vercel
- [ ] Performance score of 90+ on Lighthouse

## Technical Implementation

### 1. Performance Optimization

#### Bundle Analysis and Code Splitting (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true
  },
  
  // Enable static export for Vercel deployment
  output: 'export',
  trailingSlash: true,
  
  // Optimize images
  images: {
    unoptimized: true // No images in MVP
  },

  // Bundle analyzer (dev only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
      return config
    }
  }),

  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

module.exports = nextConfig
```

#### Component Optimization (`src/components/OptimizedGameBoard.tsx`)
```typescript
import { memo, useMemo, lazy, Suspense } from 'react'
import GuessRow from './GuessRow'
import DigitTracker from './DigitTracker'
import { useGameState } from '@/hooks/useGameState'

// Lazy load heavy components
const GameComplete = lazy(() => import('./GameComplete'))
const ShareModal = lazy(() => import('./ShareModal'))

// Loading fallback component
function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-gray-600 text-sm">{message}</div>
      </div>
    </div>
  )
}

// Memoized row component to prevent unnecessary re-renders
const MemoizedGuessRow = memo(GuessRow)

export default function GameBoard() {
  const { gameState, submitGuess, resetGame, canPlayToday, isLoaded } = useGameState()

  // Memoize expensive calculations
  const guessRows = useMemo(() => {
    if (!gameState) return []
    
    return Array.from({ length: 6 }, (_, index) => ({
      id: index,
      isActive: index === gameState.currentGuess && gameState.status === 'playing',
      isSubmitted: index < gameState.guesses.length,
      feedback: gameState.guesses[index]?.feedback
    }))
  }, [gameState?.currentGuess, gameState?.status, gameState?.guesses])

  const showCompletion = useMemo(() => 
    gameState?.status !== 'playing', 
    [gameState?.status]
  )

  // Loading state
  if (!isLoaded || !gameState) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <LoadingSpinner message="Loading today's puzzle..." />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Game Board */}
      <div className={`space-y-2 mb-6 transition-opacity duration-500 ${showCompletion ? 'opacity-50' : ''}`}>
        {guessRows.map((row) => (
          <MemoizedGuessRow
            key={row.id}
            rowIndex={row.id}
            isActive={row.isActive}
            isSubmitted={row.isSubmitted}
            feedback={row.feedback}
            onSubmit={submitGuess}
          />
        ))}
      </div>
      
      {/* Digit Tracker */}
      <DigitTracker digitStatus={gameState.digitTracker} />
      
      {/* Game Completion - Lazy loaded */}
      {showCompletion && (
        <Suspense fallback={<LoadingSpinner message="Loading results..." />}>
          <GameComplete 
            gameState={gameState}
            onNewGame={resetGame}
          />
        </Suspense>
      )}
      
      {/* Daily puzzle indicator */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Daily puzzle for {new Date(gameState.puzzle.date).toLocaleDateString()}
      </div>
      
      {/* Instructions */}
      {gameState.status === 'playing' && (
        <div className="text-center text-gray-500 text-xs mt-6">
          <div className="mb-2">
            🟩 Correct position • 🟨 Wrong position • ⬜ Not in puzzle
          </div>
          <div className="font-mono text-xs">
            Enter matrix values: [a b] × [e] = calculated result
          </div>
          <div className="font-mono text-xs">
                             [c d]   [f]
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. Error Boundaries and Error Handling

#### Global Error Boundary (`src/components/ErrorBoundary.tsx`)
```typescript
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">😅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Data & Refresh
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### Enhanced App Layout (`src/app/layout.tsx`)
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ErrorBoundary from '@/components/ErrorBoundary'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

export const metadata: Metadata = {
  title: 'Matrixle - Daily Matrix Multiplication Puzzle',
  description: 'A daily puzzle game combining Wordle with matrix multiplication. Test your math skills!',
  keywords: 'puzzle, game, math, matrix, multiplication, daily, wordle',
  authors: [{ name: 'Matrixle Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#2563eb',
  
  // Open Graph / Social Media
  openGraph: {
    title: 'Matrixle - Daily Matrix Puzzle',
    description: 'Daily matrix multiplication puzzle game',
    type: 'website',
    url: 'https://matrixle.com',
    siteName: 'Matrixle',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary',
    title: 'Matrixle - Daily Matrix Puzzle',
    description: 'Daily matrix multiplication puzzle game',
  },

  // PWA Manifest
  manifest: '/manifest.json',

  // Prevent scaling on mobile
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* PWA Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50">
            <main role="main">
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### 3. PWA Configuration

#### Web App Manifest (`public/manifest.json`)
```json
{
  "name": "Matrixle - Daily Matrix Puzzle",
  "short_name": "Matrixle",
  "description": "Daily matrix multiplication puzzle game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "categories": ["games", "education"],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Service Worker (`public/sw.js`)
```javascript
const CACHE_NAME = 'matrixle-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other static assets as needed
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      }
    )
  )
})
```

### 4. Accessibility Enhancements

#### ARIA Labels and Screen Reader Support
```typescript
// Enhanced InputCell with full accessibility
export default function InputCell({ 
  value, 
  onChange,
  position,
  feedback,
  isReadOnly = false,
  ...props 
}: InputCellProps) {
  const getFeedbackAnnouncement = () => {
    switch (feedback) {
      case 'correct':
        return 'Correct position'
      case 'wrong-position':
        return 'Correct digit, wrong position'
      case 'not-in-puzzle':
        return 'Not in puzzle'
      default:
        return ''
    }
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={isReadOnly}
        maxLength={1}
        className={`
          w-12 h-12 border-2 rounded-md text-center text-xl font-bold
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-200
          ${getFeedbackColor()}
        `}
        aria-label={`Matrix position ${position.toUpperCase()}`}
        aria-describedby={`${position}-help ${position}-feedback`}
        aria-invalid={false}
        inputMode="numeric"
        pattern="[1-9]"
        role="textbox"
        {...props}
      />
      
      {/* Screen reader announcements */}
      <div id={`${position}-help`} className="sr-only">
        Enter a single digit from 1 to 9 for matrix position {position.toUpperCase()}
      </div>
      
      {feedback && (
        <div id={`${position}-feedback`} className="sr-only" aria-live="polite">
          {getFeedbackAnnouncement()}
        </div>
      )}
    </div>
  )
}
```

#### Keyboard Navigation Enhancement
```typescript
// Enhanced keyboard navigation
const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, position: CellPosition) => {
  const currentIndex = navigationOrder.indexOf(position)
  
  switch (e.key) {
    case 'Backspace':
      if (values[position] === '' && currentIndex > 0) {
        e.preventDefault()
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
      break
      
    case 'Enter':
    case ' ':
      if (e.key === ' ') e.preventDefault()
      handleSubmit()
      break
      
    case 'Escape':
      e.preventDefault()
      // Clear current row
      setValues(prev => Object.fromEntries(
        Object.keys(prev).map(key => [key, ''])
      ) as Record<CellPosition, string>)
      setCurrentFocus('a')
      break
      
    case 'ArrowRight':
    case 'Tab':
      if (!e.shiftKey && currentIndex < navigationOrder.length - 1) {
        e.preventDefault()
        const nextPosition = navigationOrder[currentIndex + 1]
        setCurrentFocus(nextPosition)
      }
      break
      
    case 'ArrowLeft':
      if (currentIndex > 0) {
        e.preventDefault()
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
      break
      
    case 'ArrowUp':
    case 'ArrowDown':
      e.preventDefault()
      // Allow for future row navigation
      break
  }
}, [values, handleSubmit])
```

### 5. Production Build Configuration

#### Environment Variables (`.env.example`)
```bash
# Production environment
NODE_ENV=production

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Error monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Feature flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "analyze": "ANALYZE=true npm run build",
    "build:production": "npm run type-check && npm run lint && npm run test && npm run build"
  }
}
```

#### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build:production",
  "outputDirectory": "out",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### 6. Quality Assurance

#### Lighthouse CI Configuration (`.lighthouserc.js`)
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run start',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

#### Pre-commit Hooks (`package.json`)
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{css,scss,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

## Testing Strategy

### 1. Performance Testing
```bash
# Bundle analysis
npm run analyze

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Load testing (optional)
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:3000
```

### 2. Accessibility Testing
```typescript
// Automated accessibility testing
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import GameBoard from '../GameBoard'

expect.extend(toHaveNoViolations)

test('GameBoard has no accessibility violations', async () => {
  const { container } = render(<GameBoard />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 3. Cross-browser Testing
- Chrome 90+ (desktop and mobile)
- Safari 14+ (desktop and mobile)
- Firefox 88+
- Edge 90+

## Definition of Done

### Performance Requirements:
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size < 100KB gzipped
- [ ] Lighthouse Performance score ≥ 90

### Accessibility Requirements:
- [ ] Zero WCAG 2.1 AA violations
- [ ] Full keyboard navigation support
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Focus management throughout app

### Production Requirements:
- [ ] Error boundaries catch all errors gracefully
- [ ] PWA features work offline
- [ ] Cross-browser compatibility verified
- [ ] Security headers configured
- [ ] Analytics integration (if enabled)

### Deployment Requirements:
- [ ] Vercel deployment succeeds
- [ ] Custom domain works (if applicable)
- [ ] HTTPS enabled
- [ ] Performance monitoring active
- [ ] Error monitoring configured

## Launch Checklist

### Pre-Launch:
- [ ] Run full test suite
- [ ] Performance audit passes
- [ ] Accessibility audit passes
- [ ] Cross-browser testing complete
- [ ] Security review passed

### Launch:
- [ ] Deploy to production
- [ ] Verify all features work
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Announce on social media

### Post-Launch:
- [ ] Monitor user feedback
- [ ] Track performance metrics
- [ ] Fix any reported issues
- [ ] Plan future enhancements

This completes the technical foundation for a production-ready Matrixle game that can scale to thousands of daily users while maintaining excellent performance and accessibility standards.