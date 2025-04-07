/// <reference types="@cloudflare/workers-types" />
import { generateSudoku } from './sudoku';

interface Env {
  DB: D1Database;
}

interface PuzzleRow {
  puzzle: string;
}

interface SolutionRow {
  solution: string;
}

interface ValidateRequest {
  solution: string;
}

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

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
function handleOptions(request: Request) {
  if (request.headers.get('Origin') !== null) {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return new Response(null, {
    headers: {
      Allow: 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}

// Example API endpoint
async function handleRequest(request: Request, env: Env) {
  const url = new URL(request.url);
  const today = new Date().toISOString().split('T')[0];
  
  // Add CORS headers to all responses
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  // Route handling
  switch (url.pathname) {
    case '/api/sudoku':
      const difficulty = parseInt(url.searchParams.get('difficulty') || '1');
      
      var puzzle = await env.DB.prepare(
        'SELECT puzzle FROM sudoku_puzzles WHERE date = ?'
      ).bind(today).first<PuzzleRow>();

      if (puzzle) {
        return new Response(JSON.stringify({
          puzzle: JSON.parse(puzzle.puzzle)
        }), { headers });
      }
      
      return new Response(
        JSON.stringify({ error: 'Puzzle not found for this date' }),
        { status: 404, headers }
      );

    case '/api/sudoku/validate':
      const { solution } = await request.json() as ValidateRequest;
      console.log("solution", solution);
      var res = await env.DB.prepare(
        'SELECT solution FROM sudoku_puzzles WHERE date = ?'
      ).bind(today).first<SolutionRow>();
      console.log(res);

      if (!res) {
        return new Response(JSON.stringify({
          error: 'Puzzle not found for this date'
        }), { status: 404, headers });
      }

      const actualSolution = JSON.parse(res.solution);

      console.log("submit", JSON.stringify(solution));
      console.log("actual", JSON.stringify(actualSolution));

      // Check if the solution matches the stored solution
      const isCorrect = JSON.stringify(solution) === JSON.stringify(actualSolution);
      
      if (!isCorrect) {
        return new Response(JSON.stringify({ 
          error: 'Invalid solution',
          message: 'The solution does not match the correct answer'
        }), { status: 400, headers });
      }

      // Validate Sudoku rules
      const isValid = isValidSudoku(actualSolution);
      if (!isValid) {
        return new Response(JSON.stringify({ 
          error: 'Invalid solution',
          message: 'The solution violates Sudoku rules'
        }), { status: 400, headers });
      }

      return new Response(JSON.stringify({ message: 'Valid solution' }), { status: 200, headers });

    case '/api/sudoku/generate':
      try {
        await insertPuzzle(env);
        return new Response(JSON.stringify({ message: 'Puzzle generated and inserted' }), { headers });
      } catch (error) {
        console.error('Error generating puzzle:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate puzzle',
            details: error instanceof Error ? error.message : 'Unknown error'
          }),
          { status: 500, headers }
        );
      }
    
    default:
      return new Response(
        JSON.stringify({ error: 'Not Found' }),
        { status: 404, headers }
      );
  }
}

// Cron trigger to generate daily puzzles
async function insertPuzzle(env: Env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const HARD_DIFFICULTY = 3;
    const { puzzle: hardPuzzle, solution: hardSolution } = generateSudoku(HARD_DIFFICULTY);
    
    if (!hardPuzzle || !hardSolution) {
      throw new Error('Failed to generate valid Sudoku puzzle');
    }

    const result = await env.DB.prepare(`
      INSERT INTO sudoku_puzzles (date, puzzle, solution, difficulty)
      VALUES (?, ?, ?, ?)
      ON CONFLICT DO UPDATE SET
        puzzle = excluded.puzzle,
        solution = excluded.solution
    `).bind(
      today,
      JSON.stringify(hardPuzzle),
      JSON.stringify(hardSolution),
      HARD_DIFFICULTY
    ).run();

    if (!result.success) {
      throw new Error('Failed to insert puzzle into database');
    }

    return result;
  } catch (error) {
    console.error('Error in insertPuzzle:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    try {
      return await handleRequest(request, env);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },

  // Cron trigger runs daily at midnight UTC
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await insertPuzzle(env);
  }
}; 