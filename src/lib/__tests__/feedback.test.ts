import { generateFeedback, calculateDigitStats, isWinningGuess } from '../feedback'
import type { Guess, Puzzle } from '@/types/game'

describe('Feedback System', () => {
  const targetPuzzle: Puzzle = {
    id: 'test',
    date: '2024-01-01',
    matrix: { a: 2, b: 1, c: 1, d: 3 },
    vector: { e: 3, f: 2 },
    result: { g: 8, h: 9 }
  }

  describe('generateFeedback', () => {
    test('generates correct feedback for exact match', () => {
      const guess: Guess = {
        matrix: { a: 2, b: 1, c: 1, d: 3 },
        vector: { e: 3, f: 2 },
        result: { g: 8, h: 9 },
        feedback: [],
        timestamp: new Date()
      }

      const feedback = generateFeedback(guess, targetPuzzle)
      expect(feedback).toEqual([
        'correct', 'correct', 'correct', 'correct', 'correct', 'correct', 'correct', 'correct'
      ])
      expect(feedback).toHaveLength(8) // Now returns 8 positions
    })

    test('generates correct feedback for all wrong positions', () => {
      const guess: Guess = {
        matrix: { a: 1, b: 2, c: 3, d: 1 }, // All digits exist but in wrong positions
        vector: { e: 2, f: 3 },
        result: { g: 9, h: 8 }, // g,h swapped from correct positions
        feedback: [],
        timestamp: new Date()
      }

      const feedback = generateFeedback(guess, targetPuzzle)
      expect(feedback).toEqual([
        'wrong-position', // a=1 exists in target
        'wrong-position', // b=2 exists in target
        'wrong-position', // c=3 exists in target
        'wrong-position', // d=1 exists in target
        'wrong-position', // e=2 exists in target
        'wrong-position', // f=3 exists in target
        'wrong-position', // g=9 exists in target but wrong position
        'wrong-position'  // h=8 exists in target but wrong position
      ])
      expect(feedback).toHaveLength(8)
    })

    test('generates correct feedback for non-existing digits', () => {
      const guess: Guess = {
        matrix: { a: 4, b: 5, c: 6, d: 7 },
        vector: { e: 4, f: 5 },
        result: { g: 6, h: 7 }, // All different digits not in target
        feedback: [],
        timestamp: new Date()
      }

      const feedback = generateFeedback(guess, targetPuzzle)
      expect(feedback).toEqual([
        'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 
        'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle',
        'not-in-puzzle', 'not-in-puzzle'
      ])
      expect(feedback).toHaveLength(8)
    })

    test('handles mixed feedback correctly', () => {
      const guess: Guess = {
        matrix: { a: 2, b: 4, c: 5, d: 1 }, // a correct, b/c not in puzzle, d wrong position
        vector: { e: 6, f: 2 }, // e not in puzzle, f correct
        result: { g: 8, h: 4 }, // g correct, h not in puzzle (4 was used earlier)
        feedback: [],
        timestamp: new Date()
      }

      const feedback = generateFeedback(guess, targetPuzzle)
      expect(feedback).toEqual([
        'correct',        // a=2 correct position
        'not-in-puzzle',  // b=4 not in puzzle
        'not-in-puzzle',  // c=5 not in puzzle
        'wrong-position', // d=1 exists but wrong position
        'not-in-puzzle',  // e=6 not in puzzle
        'correct',        // f=2 correct position
        'correct',        // g=8 correct position
        'not-in-puzzle'   // h=4 not in puzzle (4 already used in position b)
      ])
      expect(feedback).toHaveLength(8)
    })

    test('handles duplicate digits correctly (Wordle-style)', () => {
      const specialPuzzle: Puzzle = {
        id: 'test-duplicate',
        date: '2024-01-01',
        matrix: { a: 1, b: 1, c: 2, d: 3 }, // Two 1s in target
        vector: { e: 4, f: 5 },
        result: { g: 9, h: 2 } // 2 appears twice in target (position c and h)
      }

      const guess: Guess = {
        matrix: { a: 1, b: 2, c: 1, d: 1 }, // Three 1s in guess
        vector: { e: 4, f: 5 },
        result: { g: 9, h: 2 },
        feedback: [],
        timestamp: new Date()
      }

      const feedback = generateFeedback(guess, specialPuzzle)
      expect(feedback).toEqual([
        'correct',        // a=1 correct position
        'wrong-position', // b=2 exists but wrong position (appears in c and h)
        'wrong-position', // c=1 exists but wrong position (second 1, target has 1 at position b)
        'not-in-puzzle',  // d=1 not in puzzle (third 1, only 2 exist in target)
        'correct',        // e=4 correct position
        'correct',        // f=5 correct position
        'correct',        // g=9 correct position
        'correct'         // h=2 correct position
      ])
      expect(feedback).toHaveLength(8)
    })

    test('provides feedback for result positions (g,h)', () => {
      const guess: Guess = {
        matrix: { a: 2, b: 1, c: 1, d: 3 }, // All matrix positions correct
        vector: { e: 3, f: 2 }, // All vector positions correct
        result: { g: 9, h: 8 }, // Results swapped (should be 8, 9)
        feedback: [],
        timestamp: new Date()
      }

      const feedback = generateFeedback(guess, targetPuzzle)
      expect(feedback).toEqual([
        'correct', 'correct', 'correct', 'correct', 'correct', 'correct', // a,b,c,d,e,f all correct
        'wrong-position', // g=9 exists in target but wrong position (should be in h)
        'wrong-position'  // h=8 exists in target but wrong position (should be in g)
      ])
      expect(feedback).toHaveLength(8)
    })
  })

  describe('calculateDigitStats', () => {
    test('calculates placed/confirmed stats from multiple guesses', () => {
      const guess1: Guess = {
        matrix: { a: 1, b: 4, c: 7, d: 5 },
        vector: { e: 6, f: 4 },
        result: { g: 1, h: 7 },
        feedback: ['not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle'],
        timestamp: new Date()
      }

      const guess2: Guess = {
        matrix: { a: 2, b: 1, c: 3, d: 8 },
        vector: { e: 3, f: 2 },
        result: { g: 8, h: 9 },
        feedback: ['correct', 'wrong-position', 'wrong-position', 'not-in-puzzle', 'correct', 'correct', 'correct', 'correct'],
        timestamp: new Date()
      }

      const stats = calculateDigitStats([guess1, guess2])

      // digit 1: yellow in guess2 (b), seen gray in guess1 → exact, confirmed=1, placed=0
      expect(stats['1'].confirmed).toBe(1)
      expect(stats['1'].placed).toBe(0)
      expect(stats['1'].exact).toBe(true)
      // digit 2: green at positions a and f in guess2 → placed=2, confirmed=2
      expect(stats['2'].placed).toBe(2)
      expect(stats['2'].confirmed).toBe(2)
      // digit 4: gray in guess1 → eliminated
      expect(stats['4'].confirmed).toBe(0)
      expect(stats['4'].exact).toBe(true)
      // digit 8: green in guess2 (d) → placed=1
      expect(stats['8'].placed).toBe(1)
      expect(stats['8'].confirmed).toBe(1)
    })

    test('accumulates confirmed across guesses and caps with gray', () => {
      const guess1: Guess = {
        matrix: { a: 2, b: 2, c: 1, d: 1 },
        vector: { e: 1, f: 1 },
        result: { g: 1, h: 1 },
        feedback: ['wrong-position', 'wrong-position', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle'],
        timestamp: new Date()
      }

      // Put 3 twos in: 1 green, 1 yellow, 1 gray → exact count = 2
      const guess2: Guess = {
        matrix: { a: 2, b: 2, c: 2, d: 1 },
        vector: { e: 1, f: 1 },
        result: { g: 1, h: 1 },
        feedback: ['correct', 'wrong-position', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle', 'not-in-puzzle'],
        timestamp: new Date()
      }

      const stats = calculateDigitStats([guess1, guess2])

      expect(stats['2'].placed).toBe(1)
      expect(stats['2'].confirmed).toBe(2)
      expect(stats['2'].exact).toBe(true)
    })
  })

  describe('isWinningGuess', () => {
    test('returns true for exact match', () => {
      const winningGuess: Guess = {
        matrix: { a: 2, b: 1, c: 1, d: 3 },
        vector: { e: 3, f: 2 },
        result: { g: 8, h: 9 },
        feedback: [],
        timestamp: new Date()
      }

      expect(isWinningGuess(winningGuess, targetPuzzle)).toBe(true)
    })

    test('returns false for non-match', () => {
      const nonWinningGuess: Guess = {
        matrix: { a: 1, b: 2, c: 3, d: 4 },
        vector: { e: 5, f: 6 },
        result: { g: 8, h: 9 },
        feedback: [],
        timestamp: new Date()
      }

      expect(isWinningGuess(nonWinningGuess, targetPuzzle)).toBe(false)
    })

    test('returns false when only some positions match', () => {
      const partialGuess: Guess = {
        matrix: { a: 2, b: 1, c: 1, d: 4 }, // d is wrong
        vector: { e: 3, f: 2 },
        result: { g: 8, h: 9 },
        feedback: [],
        timestamp: new Date()
      }

      expect(isWinningGuess(partialGuess, targetPuzzle)).toBe(false)
    })
  })
})