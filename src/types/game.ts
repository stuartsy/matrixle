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

export type FeedbackColor = 'correct' | 'wrong-position' | 'not-in-puzzle'

export interface Guess {
  matrix: Matrix2x2
  vector: Vector2x1
  result: Result2x1
  feedback: FeedbackColor[]
  timestamp: Date
}

export interface Puzzle {
  matrix: Matrix2x2
  vector: Vector2x1
  result: Result2x1
  id: string
  date: string
}