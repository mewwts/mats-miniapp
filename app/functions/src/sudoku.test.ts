import { describe, it, expect } from 'vitest';
import { generateSudoku } from './sudoku';

// Helper function to check if a grid is valid
function isValidSudoku(grid: number[][]): boolean {
  // Check rows
  for (let i = 0; i < 9; i++) {
    const row = new Set<number>();
    for (let j = 0; j < 9; j++) {
      const value = grid[i][j];
      if (value === 0) continue; // Skip empty cells
      if (value < 1 || value > 9) return false; // Invalid value
      if (row.has(value)) return false;
      row.add(value);
    }
  }
  
  // Check columns
  for (let j = 0; j < 9; j++) {
    const col = new Set<number>();
    for (let i = 0; i < 9; i++) {
      const value = grid[i][j];
      if (value === 0) continue; // Skip empty cells
      if (col.has(value)) return false;
      col.add(value);
    }
  }
  
  // Check boxes
  for (let box = 0; box < 9; box++) {
    const boxSet = new Set<number>();
    const boxRow = Math.floor(box / 3) * 3;
    const boxCol = (box % 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const value = grid[boxRow + i][boxCol + j];
        if (value === 0) continue; // Skip empty cells
        if (boxSet.has(value)) return false;
        boxSet.add(value);
      }
    }
  }
  
  return true;
}

// Helper function to check if a grid is complete (no empty cells)
function isComplete(grid: number[][]): boolean {
  return grid.every(row => row.every(cell => cell !== 0));
}

// Helper function to count empty cells in a grid
function countEmptyCells(grid: number[][]): number {
  return grid.reduce((count, row) => 
    count + row.reduce((rowCount, cell) => 
      rowCount + (cell === 0 ? 1 : 0), 0), 0);
}

// Helper function to check if puzzle is a subset of solution
function isPuzzleSubsetOfSolution(puzzle: number[][], solution: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (puzzle[i][j] !== 0 && puzzle[i][j] !== solution[i][j]) {
        return false;
      }
    }
  }
  return true;
}

describe('Sudoku Generator', () => {
  it('should generate 100 valid Sudoku puzzles', () => {
    const iterations = 100;
    const startTime = performance.now();
    let totalEmptyCells = 0;
    
    for (let i = 0; i < iterations; i++) {
      const { puzzle, solution } = generateSudoku(1);
      
      // Only log the first solution as an example
      if (i === 0) {
        console.log('Example Solution:');
        solution.forEach(row => console.log(row.join(' ')));
        console.log('\nExample Puzzle:');
        puzzle.forEach(row => console.log(row.join(' ')));
      }
      
      // Check that solution is valid and complete
      expect(isValidSudoku(solution)).toBe(true);
      expect(isComplete(solution)).toBe(true);
      
      // Check that puzzle is valid and a subset of solution
      expect(isValidSudoku(puzzle)).toBe(true);
      expect(isPuzzleSubsetOfSolution(puzzle, solution)).toBe(true);
      
      // Track statistics
      totalEmptyCells += countEmptyCells(puzzle);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`\nStatistics for ${iterations} puzzles:`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per puzzle: ${(totalTime / iterations).toFixed(2)}ms`);
    console.log(`Average empty cells per puzzle: ${(totalEmptyCells / iterations).toFixed(1)}`);
  });
  
  it('should generate different puzzles on each call', () => {
    const { puzzle: puzzle1 } = generateSudoku(1);
    const { puzzle: puzzle2 } = generateSudoku(1);
    
    // Convert to strings for comparison
    const puzzle1Str = JSON.stringify(puzzle1);
    const puzzle2Str = JSON.stringify(puzzle2);
    
    // They should be different
    expect(puzzle1Str).not.toBe(puzzle2Str);
  });
  
  it('should generate puzzles with increasing difficulty', () => {
    const { puzzle: easyPuzzle } = generateSudoku(1);
    const { puzzle: mediumPuzzle } = generateSudoku(2);
    const { puzzle: hardPuzzle } = generateSudoku(3);
    
    const easyEmptyCount = countEmptyCells(easyPuzzle);
    const mediumEmptyCount = countEmptyCells(mediumPuzzle);
    const hardEmptyCount = countEmptyCells(hardPuzzle);
    
    // Higher difficulty should have more empty cells
    expect(easyEmptyCount).toBeLessThan(mediumEmptyCount);
    expect(mediumEmptyCount).toBeLessThan(hardEmptyCount);
  });
  
  it('should handle different difficulty levels', () => {
    // Test all difficulty levels
    for (let difficulty = 1; difficulty <= 3; difficulty++) {
      const { puzzle, solution } = generateSudoku(difficulty);
      
      // Check that solution is valid and complete
      expect(isValidSudoku(solution)).toBe(true);
      expect(isComplete(solution)).toBe(true);
      
      // Check that puzzle is valid and a subset of solution
      expect(isValidSudoku(puzzle)).toBe(true);
      expect(isPuzzleSubsetOfSolution(puzzle, solution)).toBe(true);
      
      // Check that puzzle has the expected number of empty cells
      const emptyCount = countEmptyCells(puzzle);
      const expectedMinEmpty = Math.floor(81 * (0.3 + difficulty * 0.1));
      expect(emptyCount).toBeGreaterThanOrEqual(expectedMinEmpty);
    }
  });
  
  it('should generate puzzles with unique solutions', () => {
    const { puzzle, solution } = generateSudoku(1);
    
    // Check that the solution is valid and complete
    expect(isValidSudoku(solution)).toBe(true);
    expect(isComplete(solution)).toBe(true);
    
    // Check that the puzzle has enough clues (at least 17)
    const emptyCount = countEmptyCells(puzzle);
    expect(emptyCount).toBeLessThan(81 - 17);
  });
}); 