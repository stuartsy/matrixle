import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputCell from '../InputCell'

describe('InputCell', () => {
  const mockOnChange = jest.fn()
  const mockOnKeyDown = jest.fn()
  
  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnKeyDown.mockClear()
  })

  test('accepts valid digits 0-9', async () => {
    const user = userEvent.setup()
    
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
      />
    )
    
    const input = screen.getByRole('textbox')
    
    await user.type(input, '5')
    expect(mockOnChange).toHaveBeenCalledWith('5')
    
    // Clear and test 0
    mockOnChange.mockClear()
    await user.clear(input)
    await user.type(input, '0')
    expect(mockOnChange).toHaveBeenCalledWith('0')
  })

  test('rejects invalid inputs', async () => {
    const user = userEvent.setup()
    
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
      />
    )
    
    const input = screen.getByRole('textbox')
    
    // Clear previous calls
    mockOnChange.mockClear()
    
    // Try invalid inputs - these should not call onChange
    await user.type(input, 'a')
    await user.type(input, '!')
    
    expect(mockOnChange).not.toHaveBeenCalledWith('a')
    expect(mockOnChange).not.toHaveBeenCalledWith('!')
  })

  test('handles backspace navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        onKeyDown={mockOnKeyDown}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
      />
    )
    
    const input = screen.getByRole('textbox')
    await user.type(input, '{backspace}')
    
    expect(mockOnKeyDown).toHaveBeenCalled()
  })

  test('displays error state', () => {
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
        isError={true}
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
  })

  test('displays correct feedback colors', () => {
    const { rerender } = render(
      <InputCell
        value="5"
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
        feedback="correct"
      />
    )
    
    let input = screen.getByRole('textbox')
    expect(input).toHaveClass('bg-green-500')
    
    rerender(
      <InputCell
        value="5"
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
        feedback="wrong-position"
      />
    )
    
    input = screen.getByRole('textbox')
    expect(input).toHaveClass('bg-yellow-500')
    
    rerender(
      <InputCell
        value="5"
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
        feedback="not-in-puzzle"
      />
    )
    
    input = screen.getByRole('textbox')
    expect(input).toHaveClass('bg-gray-500')
  })

  test('has proper accessibility attributes', () => {
    render(
      <InputCell
        value=""
        onChange={mockOnChange}
        cellId="test-cell"
        position="a"
        size="w-12 h-12"
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Matrix position a')
    expect(input).toHaveAttribute('aria-describedby', 'test-cell-help')
    expect(input).toHaveAttribute('inputMode', 'numeric')
    expect(input).toHaveAttribute('maxLength', '1')
  })
})