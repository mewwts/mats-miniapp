/// <reference types="@cloudflare/workers-types" />
import { generateSudoku } from './sudoku';

interface Env {
  DB: D1Database;
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
  
  // Add CORS headers to all responses
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  // Route handling
  switch (url.pathname) {
    case '/api/sudoku':
      const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
      const difficulty = parseInt(url.searchParams.get('difficulty') || '1');
      
      const puzzle = await env.DB.prepare(
        'SELECT * FROM sudoku_puzzles WHERE date = ?'
      ).bind(date).first();
      
      if (puzzle) {
        return new Response(JSON.stringify(puzzle), { headers });
      }
      
      return new Response(
        JSON.stringify({ error: 'Puzzle not found for this date' }),
        { status: 404, headers }
      );
    
    default:
      return new Response(
        JSON.stringify({ error: 'Not Found' }),
        { status: 404, headers }
      );
  }
}

// Cron trigger to generate daily puzzles
async function handleCron(env: Env) {
  const today = new Date().toISOString().split('T')[0];
  
  // Generate puzzles for different difficulties
  const HARD_DIFFICULTY = 3;
  const { puzzle: hardPuzzle, solution: hardSolution } = generateSudoku(HARD_DIFFICULTY);
  
    await env.DB.prepare(`
      INSERT INTO sudoku_puzzles (date, puzzle, solution, difficulty)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date, difficulty) DO UPDATE SET
        puzzle = excluded.puzzle,
        solution = excluded.solution
    `).bind(
      today,
      JSON.stringify(hardPuzzle),
      JSON.stringify(hardSolution),
      HARD_DIFFICULTY
    ).run();
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
    await handleCron(env);
  }
}; 