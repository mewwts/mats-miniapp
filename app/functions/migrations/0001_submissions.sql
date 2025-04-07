-- Create the submissions table
CREATE TABLE IF NOT EXISTS submissions (
  puzzle_date TEXT NOT NULL,
  ethereum_address TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (puzzle_date, ethereum_address),
  FOREIGN KEY (puzzle_date) 
    REFERENCES sudoku_puzzles(date)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_submissions_address ON submissions(ethereum_address);
CREATE INDEX IF NOT EXISTS idx_submissions_puzzle ON submissions(puzzle_date); 