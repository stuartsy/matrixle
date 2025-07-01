export function sanitizeInput(input: string): string {
  // Remove all non-digit characters and limit to single digit
  const digits = input.replace(/\D/g, '')
  return digits.slice(0, 1)
}

export function isValidGameInput(input: string): boolean {
  return /^[0-9]$/.test(input)
}

export function formatInputForDisplay(input: string): string {
  // Ensure input is always uppercase and trimmed
  return input.trim().toUpperCase()
}

// Debounce function for input validation
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}