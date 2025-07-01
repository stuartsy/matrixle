'use client'

import { useState, useCallback, useMemo, KeyboardEvent } from 'react'
import InputCell from './InputCell'
import { validateCompleteGuess } from '@/lib/validation'
import type { Matrix2x2, Vector2x1, Result2x1, FeedbackColor } from '@/types/game'

interface GuessRowProps {
  rowIndex: number
  isActive: boolean
  isSubmitted: boolean
  feedback?: FeedbackColor[]
  onSubmit?: (guess: {
    matrix: Matrix2x2
    vector: Vector2x1
    result: Result2x1
  }) => void
}

type CellPosition = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'

export default function GuessRow({ 
  rowIndex, 
  isActive, 
  isSubmitted, 
  feedback,
  onSubmit 
}: GuessRowProps) {
  const [values, setValues] = useState<Record<CellPosition, string>>({
    a: '', b: '', c: '', d: '', e: '', f: '', g: '', h: ''
  })
  
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentFocus, setCurrentFocus] = useState<CellPosition>('a')

  // Navigation order for all 8 positions - user inputs everything
  const navigationOrder = useMemo<CellPosition[]>(() => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], [])
  
  const handleCellChange = useCallback((position: CellPosition, value: string) => {
    setValues(prev => ({ ...prev, [position]: value }))
    setErrorMessage('')
    
    // Auto-advance to next cell if value is entered
    if (value && isActive) {
      const currentIndex = navigationOrder.indexOf(position)
      if (currentIndex < navigationOrder.length - 1) {
        const nextPosition = navigationOrder[currentIndex + 1]
        setCurrentFocus(nextPosition)
      }
    }
  }, [isActive, navigationOrder])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, position: CellPosition) => {
    const currentIndex = navigationOrder.indexOf(position)
    
    if (e.key === 'Backspace' && values[position] === '') {
      if (currentIndex > 0) {
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
    } else if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      if (currentIndex < navigationOrder.length - 1) {
        e.preventDefault()
        const nextPosition = navigationOrder[currentIndex + 1]
        setCurrentFocus(nextPosition)
      }
    } else if (e.key === 'ArrowLeft') {
      if (currentIndex > 0) {
        e.preventDefault()
        const prevPosition = navigationOrder[currentIndex - 1]
        setCurrentFocus(prevPosition)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, navigationOrder])

  const handleSubmit = useCallback(() => {
    // Check if all cells are filled
    const isComplete = Object.values(values).every(val => val !== '')
    
    if (!isComplete) {
      setErrorMessage('Please fill in all boxes')
      return
    }
    
    // Convert to numbers
    const a = parseInt(values.a)
    const b = parseInt(values.b)
    const c = parseInt(values.c)
    const d = parseInt(values.d)
    const e = parseInt(values.e)
    const f = parseInt(values.f)
    const g = parseInt(values.g)
    const h = parseInt(values.h)
    
    const matrix: Matrix2x2 = { a, b, c, d }
    const vector: Vector2x1 = { e, f }
    const result: Result2x1 = { g, h }
    
    // Validate the complete guess (includes mathematical validation)
    const validation = validateCompleteGuess(matrix, vector, result)
    
    if (!validation.isValid) {
      setErrorMessage(validation.errors?.[0] || 'Invalid guess')
      return
    }
    
    // Submit the valid guess
    onSubmit?.({ matrix, vector, result })
  }, [values, onSubmit])

  // Check if all positions are complete
  const isComplete = Object.values(values).every(val => val !== '')
  const cellSize = 'w-12 h-12'
  
  // Map feedback to cell positions (feedback now applies to all 8 positions)
  const getCellFeedback = (position: CellPosition): FeedbackColor | undefined => {
    if (!feedback || !isSubmitted) return undefined
    
    // All 8 positions get feedback now
    const allPositions: CellPosition[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const feedbackIndex = allPositions.indexOf(position)
    return feedbackIndex >= 0 ? feedback[feedbackIndex] : undefined
  }
  
  return (
    <div className={`
      flex flex-col items-center gap-2 p-4 rounded-lg
      ${isActive ? 'bg-blue-50 border border-blue-200' : ''}
      ${isSubmitted ? 'opacity-100' : ''}
    `}>
      {/* Main guess row */}
      <div className="flex items-center justify-center gap-2">
        {/* Matrix [a b] */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <InputCell
              value={values.a}
              onChange={(val) => handleCellChange('a', val)}
              onKeyDown={(e) => handleKeyDown(e, 'a')}
              cellId={`${rowIndex}-a`}
              position="a"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('a')}
              autoFocus={isActive && currentFocus === 'a'}
              isError={!!errorMessage}
            />
            <InputCell
              value={values.b}
              onChange={(val) => handleCellChange('b', val)}
              onKeyDown={(e) => handleKeyDown(e, 'b')}
              cellId={`${rowIndex}-b`}
              position="b"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('b')}
              autoFocus={isActive && currentFocus === 'b'}
              isError={!!errorMessage}
            />
          </div>
          <div className="flex gap-1">
            <InputCell
              value={values.c}
              onChange={(val) => handleCellChange('c', val)}
              onKeyDown={(e) => handleKeyDown(e, 'c')}
              cellId={`${rowIndex}-c`}
              position="c"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('c')}
              autoFocus={isActive && currentFocus === 'c'}
              isError={!!errorMessage}
            />
            <InputCell
              value={values.d}
              onChange={(val) => handleCellChange('d', val)}
              onKeyDown={(e) => handleKeyDown(e, 'd')}
              cellId={`${rowIndex}-d`}
              position="d"
              size={cellSize}
              isReadOnly={isSubmitted}
              feedback={getCellFeedback('d')}
              autoFocus={isActive && currentFocus === 'd'}
              isError={!!errorMessage}
            />
          </div>
        </div>
        
        {/* Multiplication symbol */}
        <div className="text-2xl font-bold text-gray-600 px-2">×</div>
        
        {/* Vector [e f] */}
        <div className="flex flex-col gap-1">
          <InputCell
            value={values.e}
            onChange={(val) => handleCellChange('e', val)}
            onKeyDown={(e) => handleKeyDown(e, 'e')}
            cellId={`${rowIndex}-e`}
            position="e"
            size={cellSize}
            isReadOnly={isSubmitted}
            feedback={getCellFeedback('e')}
            autoFocus={isActive && currentFocus === 'e'}
            isError={!!errorMessage}
          />
          <InputCell
            value={values.f}
            onChange={(val) => handleCellChange('f', val)}
            onKeyDown={(e) => handleKeyDown(e, 'f')}
            cellId={`${rowIndex}-f`}
            position="f"
            size={cellSize}
            isReadOnly={isSubmitted}
            feedback={getCellFeedback('f')}
            autoFocus={isActive && currentFocus === 'f'}
            isError={!!errorMessage}
          />
        </div>
        
        {/* Equals symbol */}
        <div className="text-2xl font-bold text-gray-600 px-2">=</div>
        
        {/* Result [g h] - user inputs these */}
        <div className="flex flex-col gap-1">
          <InputCell
            value={values.g}
            onChange={(val) => handleCellChange('g', val)}
            onKeyDown={(e) => handleKeyDown(e, 'g')}
            cellId={`${rowIndex}-g`}
            position="g"
            size={cellSize}
            isReadOnly={isSubmitted}
            feedback={getCellFeedback('g')}
            autoFocus={isActive && currentFocus === 'g'}
            isError={!!errorMessage}
          />
          <InputCell
            value={values.h}
            onChange={(val) => handleCellChange('h', val)}
            onKeyDown={(e) => handleKeyDown(e, 'h')}
            cellId={`${rowIndex}-h`}
            position="h"
            size={cellSize}
            isReadOnly={isSubmitted}
            feedback={getCellFeedback('h')}
            autoFocus={isActive && currentFocus === 'h'}
            isError={!!errorMessage}
          />
        </div>
      </div>
      
      {/* Submit button and error message */}
      {isActive && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`
              px-6 py-2 rounded-md font-semibold transition-colors
              ${isComplete 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Submit
          </button>
          
          {errorMessage && (
            <div className="text-red-600 text-sm font-medium" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}