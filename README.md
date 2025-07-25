# IntelliAgents

A full-stack TypeScript application for managing rooms, questions, and audio recordings with AI integration. The project consists of a React frontend and a Fastify backend, using PostgreSQL for data storage and Google's Generative AI for processing.

## Features

- Room management system
- Question handling and storage
- Audio recording capabilities
- AI-powered processing using Google's Generative AI
- Real-time updates using React Query
- Modern UI with Shadcn components

## Tech Stack

### Backend
- Node.js with TypeScript
- Fastify web framework
- PostgreSQL with pgvector support for vector operations
- Drizzle ORM for database operations
- Google Generative AI integration
- Zod for validation
- Docker for database containerization

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Shadcn/UI components
- React Query for data fetching
- React Router for navigation
- React Hook Form for form handling
- Web Speech API integration

## Prerequisites

- Node.js (Latest LTS version)
- Docker and Docker Compose
- PostgreSQL (or use provided Docker setup)
- Google Cloud API key for Generative AI

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd intelliAgents
```

2. Set up the backend:
```bash
cd server
cp .env.example .env    # Configure your environment variables
npm install
```

3. Set up the database:
```bash
docker-compose up -d    # Starts PostgreSQL container with vector support
                       # Automatically runs initial setup script
npm run db:generate    # Generate database artifacts
npm run db:migrate     # Run database migrations
npm run db:seed       # (Optional) Seed initial data
```

The database setup uses pgvector/pgvector:pg17 image, which provides vector operation support for AI-related features.

4. Set up the frontend:
```bash
cd ../web
npm install
```

## Development

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
cd web
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3333

## Project Structure

```
intelliAgents/
├── server/                 # Backend application
│   ├── src/
│   │   ├── db/            # Database configuration and migrations
│   │   ├── http/          # HTTP routes and handlers
│   │   ├── services/      # Business logic and services
│   │   └── server.ts      # Main server entry point
│   └── docker/            # Docker configuration
├── web/                   # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── http/         # API integration
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components
│   └── public/           # Static assets
```

## Environment Variables

### Backend (.env)
```
PORT=3333                  # Server port
DATABASE_URL=              # PostgreSQL connection string
```

## Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm run db:generate` - Generate database artifacts
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

ISC