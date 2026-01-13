# Flagship

A production-grade Feature Flag and Experimentation Platform.

## Overview

Flagship is an internal-style feature flag platform (similar to LaunchDarkly or Meta's experimentation infrastructure) that supports:

- Feature flags with percentage rollouts
- Deterministic user assignment
- A/B experimentation with variants
- Event tracking and analytics
- Admin UI for configuration

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Applications                        │
│                    (Web / Mobile / Backend)                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Flag Evaluation API                          │
│                  GET /evaluate?flagKey=&userId=                 │
│                      (Hot Path - <200ms)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Core Service                              │
│                   (Node.js + TypeScript)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                         │
│               (Docker locally, RDS in production)               │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- PostgreSQL

**Frontend:**
- React + TypeScript
- Tailwind CSS

**Infrastructure:**
- AWS (ECS/Lambda)
- Terraform
- GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd flagship
```

2. Start the database:
```bash
docker-compose up -d
```

3. Install dependencies:
```bash
cd backend
npm install
```

4. Set up environment:
```bash
cp .env.example .env
```

5. Start the development server:
```bash
npm run dev
```

6. Verify the server is running:
```bash
curl http://localhost:3000/health
```

## Project Structure

```
flagship/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── db/            # Database setup
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # TypeScript types
│   │   ├── repositories/  # Data access layer
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   └── package.json
├── frontend/              # React admin UI
├── infra/
│   └── terraform/         # Infrastructure as code
├── scripts/
│   └── traffic-generator/ # Synthetic load testing
├── docker-compose.yml
└── README.md
```

## Development Status

- [x] Project scaffolding
- [x] Database schema
- [ ] FeatureFlag CRUD API
- [ ] Flag evaluation endpoint
- [ ] Admin UI
- [ ] Experiments & Variants
- [ ] Event tracking
- [ ] AWS deployment

## License

ISC
