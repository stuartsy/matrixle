import {
  validateMatrixMultiplication,
  isValidDigit,
  validateMatrixInputs,
  validateCompleteGuess
} from '../validation';

describe('Matrix Multiplication Validation', () => {
  describe('validateMatrixMultiplication', () => {
    test('validates correct matrix multiplication', () => {
      const matrix = { a: 2, b: 1, c: 1, d: 3 };
      const vector = { e: 3, f: 2 };
      const result = { g: 8, h: 9 }; // 2*3 + 1*2 = 8, 1*3 + 3*2 = 9
      
      expect(validateMatrixMultiplication(matrix, vector, result)).toBe(true);
    });
    
    test('rejects incorrect matrix multiplication', () => {
      const matrix = { a: 2, b: 1, c: 1, d: 3 };
      const vector = { e: 3, f: 2 };
      const result = { g: 7, h: 9 }; // Wrong result for g
      
      expect(validateMatrixMultiplication(matrix, vector, result)).toBe(false);
    });
    
    test('handles edge cases with 1s and 9s', () => {
      const matrix = { a: 1, b: 9, c: 9, d: 1 };
      const vector = { e: 1, f: 1 };
      const result = { g: 10, h: 10 }; // But wait - results > 9!
      
      // This should be mathematically valid even if results exceed single digits
      expect(validateMatrixMultiplication(matrix, vector, result)).toBe(true);
    });
    
    test('handles zero multiplication correctly', () => {
      const matrix = { a: 1, b: 0, c: 0, d: 1 };
      const vector = { e: 5, f: 3 };
      const result = { g: 5, h: 3 }; // 1*5 + 0*3 = 5, 0*5 + 1*3 = 3
      
      expect(validateMatrixMultiplication(matrix, vector, result)).toBe(true);
    });
    
    test('handles all zeros', () => {
      const matrix = { a: 0, b: 0, c: 0, d: 0 };
      const vector = { e: 0, f: 0 };
      const result = { g: 0, h: 0 };
      
      expect(validateMatrixMultiplication(matrix, vector, result)).toBe(true);
    });
  });
  
  describe('isValidDigit', () => {
    test('accepts digits 0-9', () => {
      for (let i = 0; i <= 9; i++) {
        expect(isValidDigit(i)).toBe(true);
        expect(isValidDigit(i.toString())).toBe(true);
      }
    });
    
    test('rejects numbers > 9', () => {
      expect(isValidDigit(10)).toBe(false);
      expect(isValidDigit('10')).toBe(false);
    });
    
    test('rejects non-numeric input', () => {
      expect(isValidDigit('a')).toBe(false);
      expect(isValidDigit('')).toBe(false);
      expect(isValidDigit('1a')).toBe(false);
      expect(isValidDigit('  ')).toBe(false);
      expect(isValidDigit(null as any)).toBe(false);
      expect(isValidDigit(undefined as any)).toBe(false);
    });
  });
  
  describe('validateMatrixInputs', () => {
    test('passes with all valid inputs', () => {
      const matrix = { a: 1, b: 2, c: 3, d: 4 };
      const vector = { e: 5, f: 6 };
      const result = { g: 7, h: 8 };
      
      const validation = validateMatrixInputs(matrix, vector, result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toBeUndefined();
    });
    
    test('fails with missing inputs', () => {
      const matrix = { a: 1, b: 2, c: 3 }; // missing d
      const vector = { e: 5, f: 6 };
      const result = { g: 7, h: 8 };
      
      const validation = validateMatrixInputs(matrix, vector, result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Matrix position d is required');
    });
    
    test('fails with missing vector and result inputs', () => {
      const matrix = { a: 1, b: 2, c: 3, d: 4 };
      const vector = { e: 5 }; // missing f
      const result = { g: 7 }; // missing h
      
      const validation = validateMatrixInputs(matrix, vector, result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Vector position f is required');
      expect(validation.errors).toContain('Result position h is required');
    });
    
    test('fails with invalid digits', () => {
      const matrix = { a: 10, b: 2, c: 3, d: -1 }; // 10 and -1 invalid
      const vector = { e: 5, f: 6 };
      const result = { g: 7, h: 8 };
      
      const validation = validateMatrixInputs(matrix, vector, result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Matrix position a must be a digit 0-9');
      expect(validation.errors).toContain('Matrix position d must be a digit 0-9');
    });
  });
  
  describe('validateCompleteGuess', () => {
    test('passes with valid inputs and correct math', () => {
      const matrix = { a: 2, b: 1, c: 1, d: 3 };
      const vector = { e: 3, f: 2 };
      const result = { g: 8, h: 9 };
      
      const validation = validateCompleteGuess(matrix, vector, result);
      expect(validation.isValid).toBe(true);
    });
    
    test('passes with zeros in input', () => {
      const matrix = { a: 1, b: 0, c: 0, d: 1 };
      const vector = { e: 5, f: 3 };
      const result = { g: 5, h: 3 }; // 1*5 + 0*3 = 5, 0*5 + 1*3 = 3
      
      const validation = validateCompleteGuess(matrix, vector, result);
      expect(validation.isValid).toBe(true);
    });
    
    test('fails with invalid inputs', () => {
      const matrix = { a: 10, b: 1, c: 1, d: 3 }; // 10 is invalid
      const vector = { e: 3, f: 2 };
      const result = { g: 8, h: 9 };
      
      const validation = validateCompleteGuess(matrix, vector, result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Matrix position a must be a digit 0-9');
    });
    
    test('fails with valid inputs but incorrect math', () => {
      const matrix = { a: 2, b: 1, c: 1, d: 3 };
      const vector = { e: 3, f: 2 };
      const result = { g: 7, h: 9 }; // Wrong math
      
      const validation = validateCompleteGuess(matrix, vector, result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('The math doesn\'t work out! Try again.');
    });
  });
});