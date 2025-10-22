# VibeBox - Backend

Next.js backend for VibeBox platform.

## Features

- API Routes for platform integration
- Admin dashboard for subscription management
- Integration with happy-server

## Getting Started

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Project Structure

```
server/
├── app/
│   ├── api/          # API Routes
│   ├── admin/        # Admin dashboard pages
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── lib/              # Utility functions
├── components/       # React components
└── package.json
```

## API Routes

- `/api/health` - Health check
- `/api/auth/*` - Authentication endpoints
- `/api/vibe/*` - VibeBox server management

## Environment Variables

Create a `.env.local` file:

```env
# Happy Server
HAPPY_SERVER_URL=https://api.cluster-fluster.com

# Database
DATABASE_URL=postgresql://...

# API Keys
API_SECRET_KEY=...
```
