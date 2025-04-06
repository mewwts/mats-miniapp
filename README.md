# Sudoku Generator API

A Cloudflare Worker that generates Sudoku puzzles using Peter Norvig's algorithm.

## Features

- Generates valid Sudoku puzzles with unique solutions
- Supports three difficulty levels (1: Easy, 2: Medium, 3: Hard)
- Uses constraint propagation for efficient solving
- Daily generation of puzzles via a cron job
- Puzzles are stored in Cloudflare D1 database

## API Endpoints

### Get a Sudoku puzzle

```
GET /api/sudoku?date=2024-04-06&difficulty=1
```

Parameters:
- `date` (optional): The date for which to get the puzzle (format: YYYY-MM-DD). Defaults to today.
- `difficulty` (optional): The difficulty level (1-3). Defaults to 1 (Easy).

Response:
```json
{
  "date": "2024-04-06",
  "difficulty": 1,
  "puzzle": [[0, 5, 0, 1, 6, 0, 0, 0, 0], ...],
  "solution": [[8, 5, 4, 1, 6, 2, 3, 9, 7], ...]
}
```

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd app
   pnpm install
   ```
3. Run the development server:
   ```
   pnpm worker:dev
   ```

### Testing

Run the tests:
```
pnpm test
```

## Deployment

### Manual Deployment

To deploy manually:

```
cd app
pnpm worker:deploy
```

### Automatic Deployment

The project is set up to automatically deploy to Cloudflare Workers when you push to the main branch.

#### Setting up GitHub Actions

1. Create a Cloudflare API token:
   - Go to the Cloudflare dashboard
   - Navigate to "My Profile" > "API Tokens"
   - Click "Create Token"
   - Select "Edit Cloudflare Workers" template
   - Give it a name and create the token

2. Add the token to your GitHub repository:
   - Go to your GitHub repository
   - Navigate to "Settings" > "Secrets and variables" > "Actions"
   - Click "New repository secret"
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Your Cloudflare API token
   - Click "Add secret"

Now, every time you push to the main branch, GitHub Actions will:
1. Run the tests
2. Deploy the Worker to Cloudflare if tests pass

## License

MIT
