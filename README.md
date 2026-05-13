# Payment Subscription UI

Frontend application for the Payment Subscription system, built with Next.js (App Router) and TypeScript.

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- Running backend API (default: `http://localhost:5000`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create `.env` in the project root (or copy from `.env.example`) and set:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Notes:
- `NEXT_PUBLIC_API_BASE_URL` is used by centralized config in `app/utils/properties.ts`.
- Keep both keys for compatibility with existing code paths.

## Run the Application

Start development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run start`: Run production server
- `npm run lint`: Run ESLint checks

## Project Structure

```text
app/
	page.tsx              # Registration and order creation flow
	summary/page.tsx      # Payment summary screen
	utils/properties.ts   # Centralized routes, config, messages, helpers
```

## Troubleshooting

- If API requests fail, verify backend is running on the URL defined in `.env`.
- After changing `.env`, restart the Next.js dev server.
- If lint errors appear, run `npm run lint` and fix reported issues.
