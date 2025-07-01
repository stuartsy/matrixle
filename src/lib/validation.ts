import { Matrix2x2, Vector2x1, Result2x1, ValidationResult } from '@/types/game';

/**
 * Validates matrix multiplication: [a b] × [e] = [g]
 *                                  [c d]   [f]   [h]
 * 
 * Formula: g = a*e + b*f, h = c*e + d*f
 */
export function validateMatrixMultiplication(
  matrix: Matrix2x2,
  vector: Vector2x1,
  result: Result2x1
): boolean {
  const calculatedG = matrix.a * vector.e + matrix.b * vector.f;
  const calculatedH = matrix.c * vector.e + matrix.d * vector.f;
  
  return calculatedG === result.g && calculatedH === result.h;
}

/**
 * Validates that input is a single digit 0-9
 */
export function isValidDigit(input: string | number): boolean {
  if (typeof input === 'number') {
    return Number.isInteger(input) && input >= 0 && input <= 9;
  }
  
  // For strings, ensure it's exactly one digit 0-9
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length !== 1) return false;
    const num = parseInt(trimmed, 10);
    return !isNaN(num) && num >= 0 && num <= 9;
  }
  
  return false;
}

/**
 * Validates that all matrix positions contain valid digits
 */
export function validateMatrixInputs(
  matrix: Partial<Matrix2x2>,
  vector: Partial<Vector2x1>,
  result: Partial<Result2x1>
): ValidationResult {
  const errors: string[] = [];
  
  // Check matrix values
  const matrixValues = [matrix.a, matrix.b, matrix.c, matrix.d];
  const matrixLabels = ['a', 'b', 'c', 'd'];
  
  matrixValues.forEach((value, index) => {
    if (value === undefined || value === null) {
      errors.push(`Matrix position ${matrixLabels[index]} is required`);
    } else if (!isValidDigit(value)) {
      errors.push(`Matrix position ${matrixLabels[index]} must be a digit 0-9`);
    }
  });
  
  // Check vector values
  const vectorValues = [vector.e, vector.f];
  const vectorLabels = ['e', 'f'];
  
  vectorValues.forEach((value, index) => {
    if (value === undefined || value === null) {
      errors.push(`Vector position ${vectorLabels[index]} is required`);
    } else if (!isValidDigit(value)) {
      errors.push(`Vector position ${vectorLabels[index]} must be a digit 0-9`);
    }
  });
  
  // Check result values (these are provided by user, not calculated)
  const resultValues = [result.g, result.h];
  const resultLabels = ['g', 'h'];
  
  resultValues.forEach((value, index) => {
    if (value === undefined || value === null) {
      errors.push(`Result position ${resultLabels[index]} is required`);
    } else if (!isValidDigit(value)) {
      errors.push(`Result position ${resultLabels[index]} must be a digit 0-9`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Complete validation: inputs are valid AND math is correct
 */
export function validateCompleteGuess(
  matrix: Partial<Matrix2x2>,
  vector: Partial<Vector2x1>,
  result: Partial<Result2x1>
): ValidationResult {
  const inputValidation = validateMatrixInputs(matrix, vector, result);
  
  if (!inputValidation.isValid) {
    return inputValidation;
  }
  
  // All inputs are valid, now check the math
  const mathIsCorrect = validateMatrixMultiplication(
    matrix as Matrix2x2,
    vector as Vector2x1,
    result as Result2x1
  );
  
  if (!mathIsCorrect) {
    return {
      isValid: false,
      errors: ['The math doesn\'t work out! Try again.']
    };
  }
  
  return { isValid: true };
}