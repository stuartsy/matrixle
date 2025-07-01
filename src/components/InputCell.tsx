'use client'

import { useRef, useEffect, KeyboardEvent, FocusEvent } from 'react'
import type { FeedbackColor } from '@/types/game'

interface InputCellProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  cellId: string
  position: string // 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'
  size: string
  isReadOnly?: boolean
  feedback?: FeedbackColor
  autoFocus?: boolean
  isError?: boolean
}

export default function InputCell({ 
  value, 
  onChange,
  onKeyDown,
  onFocus,
  cellId, 
  position,
  size, 
  isReadOnly = false,
  feedback,
  autoFocus = false,
  isError = false
}: InputCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Only allow single digits 0-9
    if (newValue === '' || /^[0-9]$/.test(newValue)) {
      onChange(newValue)
    }
    // Silently reject invalid input
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys
    if (['Tab', 'Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      return
    }
    
    // Handle backspace/delete
    if (['Backspace', 'Delete'].includes(e.key)) {
      if (value === '') {
        // Move to previous cell if current is empty
        onKeyDown?.(e)
      }
      return
    }
    
    // Forward other key events
    onKeyDown?.(e)
  }

  const getFeedbackColor = () => {
    if (isError) return 'border-red-500 bg-red-50'
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
      ref={inputRef}
      id={cellId}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      readOnly={isReadOnly}
      maxLength={1}
      className={`
        ${size}
        border-2 rounded-md
        text-center font-bold
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors duration-200
        ${getFeedbackColor()}
        ${isReadOnly ? 'cursor-default' : 'cursor-text'}
      `}
      aria-label={`Matrix position ${position}`}
      aria-describedby={`${cellId}-help`}
      inputMode="numeric"
    />
  )
}