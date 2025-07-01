# Milestone 1: Core Validation Engine

## Objective
Build and test the mathematical foundation of Matrixle - a robust matrix multiplication validator that ensures all game logic is mathematically sound.

## Success Criteria
- [ ] Next.js project initialized with TypeScript and testing framework
- [ ] Matrix multiplication validation function works correctly for all valid inputs
- [ ] Input validation prevents invalid digits and incomplete matrices
- [ ] 100% test coverage for validation logic
- [ ] All tests pass with `npm test`
- [ ] Type safety enforced throughout validation functions

## Technical Implementation

### 1. Project Setup
```bash
npx create-next-app@latest matrixle --typescript --tailwind --eslint --app
cd matrixle
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @types/jest jest-environment-jsdom
```

### 2. Core Types (`src/types/game.ts`)
```typescript
export interface Matrix2x2 {
  a: number; // top-left
  b: number; // top-right  
  c: number; // bottom-left
  d: number; // bottom-right
}

export interface Vector2x1 {
  e: number; // top element
  f: number; // bottom element
}

export interface Result2x1 {
  g: number; // top result
  h: number; // bottom result
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}
```

### 3. Validation Logic (`src/lib/validation.ts`)
```typescript
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
 * Validates that input is a single digit 1-9
 */
export function isValidDigit(input: string | number): boolean {
  const num = typeof input === 'string' ? parseInt(input) : input;
  return Number.isInteger(num) && num >= 1 && num <= 9;
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
      errors.push(`Matrix position ${matrixLabels[index]} must be a digit 1-9`);
    }
  });
  
  // Check vector values
  const vectorValues = [vector.e, vector.f];
  const vectorLabels = ['e', 'f'];
  
  vectorValues.forEach((value, index) => {
    if (value === undefined || value === null) {
      errors.push(`Vector position ${vectorLabels[index]} is required`);
    } else if (!isValidDigit(value)) {
      errors.push(`Vector position ${vectorLabels[index]} must be a digit 1-9`);
    }
  });
  
  // Check result values (these are provided by user, not calculated)
  const resultValues = [result.g, result.h];
  const resultLabels = ['g', 'h'];
  
  resultValues.forEach((value, index) => {
    if (value === undefined || value === null) {
      errors.push(`Result position ${resultLabels[index]} is required`);
    } else if (!isValidDigit(value)) {
      errors.push(`Result position ${resultLabels[index]} must be a digit 1-9`);
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
```

### 4. Test Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 5. Jest Setup (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'
```

### 6. Comprehensive Tests (`src/lib/__tests__/validation.test.ts`)
```typescript
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
  });
  
  describe('isValidDigit', () => {
    test('accepts digits 1-9', () => {
      for (let i = 1; i <= 9; i++) {
        expect(isValidDigit(i)).toBe(true);
        expect(isValidDigit(i.toString())).toBe(true);
      }
    });
    
    test('rejects 0 and numbers > 9', () => {
      expect(isValidDigit(0)).toBe(false);
      expect(isValidDigit(10)).toBe(false);
      expect(isValidDigit('0')).toBe(false);
      expect(isValidDigit('10')).toBe(false);
    });
    
    test('rejects non-numeric input', () => {
      expect(isValidDigit('a')).toBe(false);
      expect(isValidDigit('')).toBe(false);
      expect(isValidDigit('1a')).toBe(false);
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
    
    test('fails with invalid digits', () => {
      const matrix = { a: 0, b: 2, c: 3, d: 10 }; // 0 and 10 invalid
      const vector = { e: 5, f: 6 };
      const result = { g: 7, h: 8 };
      
      const validation = validateMatrixInputs(matrix, vector, result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Matrix position a must be a digit 1-9');
      expect(validation.errors).toContain('Matrix position d must be a digit 1-9');
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
    
    test('fails with invalid inputs', () => {
      const matrix = { a: 0, b: 1, c: 1, d: 3 }; // 0 is invalid
      const vector = { e: 3, f: 2 };
      const result = { g: 8, h: 9 };
      
      const validation = validateCompleteGuess(matrix, vector, result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Matrix position a must be a digit 1-9');
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
```

### 7. Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Testing Strategy

### Unit Tests Must Cover:
1. **Happy Path**: Valid matrix multiplications with various digit combinations
2. **Edge Cases**: Maximum values (9×9), minimum values (1×1), boundary conditions  
3. **Error Cases**: Invalid digits (0, 10+, letters), missing values, incorrect math
4. **Type Safety**: Ensure TypeScript catches type mismatches at compile time

### Test Data Examples:
```typescript
// Easy case
{ matrix: {a:1,b:1,c:1,d:1}, vector: {e:2,f:3}, result: {g:5,h:5} }

// Medium case  
{ matrix: {a:2,b:3,c:1,d:4}, vector: {e:2,f:1}, result: {g:7,h:6} }

// Hard case (larger results)
{ matrix: {a:8,b:9,c:7,d:6}, vector: {e:9,f:8}, result: {g:144,h:111} }
```

## Definition of Done

### Functional Requirements:
- [ ] All validation functions return correct boolean/ValidationResult values
- [ ] Error messages are clear and helpful
- [ ] Type system prevents invalid inputs at compile time
- [ ] Performance is acceptable (< 1ms per validation)

### Quality Requirements:
- [ ] 100% test coverage for validation logic
- [ ] All tests pass consistently
- [ ] No TypeScript compilation errors
- [ ] Code follows established patterns and is well-documented

### Delivery Requirements:
- [ ] Code is committed to repository
- [ ] Tests can be run with `npm test`
- [ ] Documentation is complete and accurate
- [ ] Ready for integration with UI components in Milestone 2

## Next Steps
Once this milestone is complete, the validation engine will be ready to integrate with React components in Milestone 2, where we'll build the visual game board that uses these validation functions.