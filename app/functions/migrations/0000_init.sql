-- Create the sudoku_puzzles table
CREATE TABLE IF NOT EXISTS sudoku_puzzles (
  date TEXT NOT NULL,
  puzzle TEXT NOT NULL,  -- JSON string of the puzzle grid
  solution TEXT NOT NULL,  -- JSON string of the solution
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (date)
);

-- Create an index on the date field for faster lookups
CREATE INDEX IF NOT EXISTS idx_sudoku_puzzles_date ON sudoku_puzzles(date); 