type Grid = number[][];
type Candidates = Map<string, Set<number>>;

// Convert grid to string representation
function gridToString(grid: Grid): string {
  return grid.map(row => row.join('')).join('');
}

// Convert string to grid
function stringToGrid(str: string): Grid {
  const grid: Grid = [];
  for (let i = 0; i < 9; i++) {
    grid[i] = [];
    for (let j = 0; j < 9; j++) {
      const val = str[i * 9 + j];
      grid[i][j] = val === '.' ? 0 : parseInt(val);
    }
  }
  return grid;
}

// Get all peers (cells in same row, column, or box)
function getPeers(cell: string): Set<string> {
  const [row, col] = cell.split('').map(Number);
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  
  const peers = new Set<string>();
  
  // Add row peers
  for (let c = 0; c < 9; c++) {
    if (c !== col) peers.add(`${row}${c}`);
  }
  
  // Add column peers
  for (let r = 0; r < 9; r++) {
    if (r !== row) peers.add(`${r}${col}`);
  }
  
  // Add box peers
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row || c !== col) peers.add(`${r}${c}`);
    }
  }
  
  return peers;
}

// Initialize candidates for all cells
function initializeCandidates(grid: Grid): Candidates {
  const candidates = new Map<string, Set<number>>();
  
  // First, initialize all cells with all possible values
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cell = `${i}${j}`;
      candidates.set(cell, new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    }
  }
  
  // Then, assign known values and propagate constraints
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const value = grid[i][j];
      if (value !== 0) {
        const cell = `${i}${j}`;
        if (!assign(candidates, cell, value)) {
          // If we can't assign a value, the grid is invalid
          return new Map();
        }
      }
    }
  }
  
  return candidates;
}

// Eliminate a value from a cell's candidates and propagate constraints
function eliminate(candidates: Candidates, cell: string, value: number): boolean {
  const cellCandidates = candidates.get(cell);
  if (!cellCandidates) return false;
  
  if (!cellCandidates.has(value)) return true;
  
  cellCandidates.delete(value);
  
  // (1) If a cell has no candidates, we've failed
  if (cellCandidates.size === 0) return false;
  
  // (2) If a cell has only one candidate left, eliminate it from peers
  if (cellCandidates.size === 1) {
    const [remainingValue] = cellCandidates;
    for (const peer of getPeers(cell)) {
      if (!eliminate(candidates, peer, remainingValue)) return false;
    }
  }
  
  // (3) If a unit has only one possible place for a value, put it there
  const [row, col] = cell.split('').map(Number);
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  
  // Check row
  let possiblePlaces = 0;
  let lastPossibleCol = -1;
  for (let c = 0; c < 9; c++) {
    const peerCandidates = candidates.get(`${row}${c}`);
    if (peerCandidates?.has(value)) {
      possiblePlaces++;
      lastPossibleCol = c;
    }
  }
  if (possiblePlaces === 0) return false;
  if (possiblePlaces === 1) {
    if (!assign(candidates, `${row}${lastPossibleCol}`, value)) return false;
  }
  
  // Check column
  possiblePlaces = 0;
  let lastPossibleRow = -1;
  for (let r = 0; r < 9; r++) {
    const peerCandidates = candidates.get(`${r}${col}`);
    if (peerCandidates?.has(value)) {
      possiblePlaces++;
      lastPossibleRow = r;
    }
  }
  if (possiblePlaces === 0) return false;
  if (possiblePlaces === 1) {
    if (!assign(candidates, `${lastPossibleRow}${col}`, value)) return false;
  }
  
  // Check box
  possiblePlaces = 0;
  let lastPossibleCell = '';
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const peerCandidates = candidates.get(`${r}${c}`);
      if (peerCandidates?.has(value)) {
        possiblePlaces++;
        lastPossibleCell = `${r}${c}`;
      }
    }
  }
  if (possiblePlaces === 0) return false;
  if (possiblePlaces === 1) {
    if (!assign(candidates, lastPossibleCell, value)) return false;
  }
  
  return true;
}

// Assign a value to a cell and propagate constraints
function assign(candidates: Candidates, cell: string, value: number): boolean {
  // Remove all other values from the cell's candidates
  const otherValues = Array.from(candidates.get(cell) || []).filter(v => v !== value);
  for (const otherValue of otherValues) {
    if (!eliminate(candidates, cell, otherValue)) return false;
  }
  return true;
}

// Generate a random Sudoku puzzle
export function generateSudoku(difficulty: number = 1): { puzzle: Grid; solution: Grid } {
  // Start with an empty grid
  const grid: Grid = Array(9).fill(0).map(() => Array(9).fill(0));
  
  // Fill diagonal boxes first (they are independent)
  for (let box = 0; box < 9; box += 3) {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * values.length);
        grid[box + i][box + j] = values[randomIndex];
        values.splice(randomIndex, 1);
      }
    }
  }
  
  // Initialize candidates and solve the rest of the grid
  const candidates = initializeCandidates(grid);
  if (candidates.size === 0 || !solveSudoku(candidates)) {
    // If solving fails, try again
    return generateSudoku(difficulty);
  }
  
  // Convert candidates back to grid
  const solution = gridFromCandidates(candidates);
  
  // Create puzzle by removing numbers
  const puzzle = createPuzzle(solution, difficulty);
  
  // Verify that the puzzle is valid and has a unique solution
  const puzzleCandidates = initializeCandidates(puzzle);
  if (puzzleCandidates.size === 0) {
    // If the puzzle is invalid, try again
    return generateSudoku(difficulty);
  }
  
  return { puzzle, solution };
}

// Solve Sudoku using constraint propagation and search
function solveSudoku(candidates: Candidates): boolean {
  // If we've eliminated all possibilities, we've failed
  if (candidates.size === 0) return false;
  
  // If every cell has only one candidate, we're done
  if (Array.from(candidates.values()).every(values => values.size === 1)) {
    return true;
  }
  
  // Find the cell with the fewest candidates
  let minCell = '';
  let minSize = 10;
  
  for (const [cell, values] of candidates.entries()) {
    if (values.size > 1 && values.size < minSize) {
      minCell = cell;
      minSize = values.size;
    }
  }
  
  // Try each candidate for the cell with fewest options
  const values = Array.from(candidates.get(minCell)!);
  for (const value of values) {
    const candidatesCopy = new Map(
      Array.from(candidates.entries()).map(([cell, values]) => 
        [cell, new Set(values)]
      )
    );
    if (assign(candidatesCopy, minCell, value) && solveSudoku(candidatesCopy)) {
      // Copy back the solution
      for (const [cell, values] of candidatesCopy.entries()) {
        candidates.set(cell, values);
      }
      return true;
    }
  }
  
  return false;
}

// Convert candidates back to grid
function gridFromCandidates(candidates: Candidates): Grid {
  const grid: Grid = Array(9).fill(0).map(() => Array(9).fill(0));
  for (const [cell, values] of candidates.entries()) {
    if (values.size !== 1) continue;
    const [row, col] = cell.split('').map(Number);
    grid[row][col] = Array.from(values)[0];
  }
  return grid;
}

// Create puzzle by removing numbers while maintaining uniqueness
function createPuzzle(solution: Grid, difficulty: number): Grid {
  const puzzle = solution.map(row => [...row]);
  const cells = Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]);
  
  // Shuffle cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  
  // Remove numbers based on difficulty while maintaining uniqueness
  const targetEmpty = Math.floor(81 * (0.3 + difficulty * 0.1));
  let emptyCells = 0;
  
  for (const [row, col] of cells) {
    if (emptyCells >= targetEmpty) break;
    
    const temp = puzzle[row][col];
    puzzle[row][col] = 0;
    
    // Check if the puzzle still has a unique solution
    const candidates = initializeCandidates(puzzle);
    if (candidates.size === 0) {
      // Removing this number makes the puzzle invalid
      puzzle[row][col] = temp;
      continue;
    }
    
    emptyCells++;
  }
  
  return puzzle;
} 