# Flagship

A production-grade Feature Flag and Experimentation Platform.

## Overview

Flagship is an internal-style feature flag platform (similar to LaunchDarkly or Meta's experimentation infrastructure) that supports:

- Feature flags with percentage rollouts
- Deterministic user assignment
- A/B experimentation with variants (Phase 2)
- Event tracking and analytics (Phase 3)
- Admin UI for configuration (Phase 2)

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

| Layer | Technology |
|-------|------------|
| Backend | Node.js + TypeScript + Express |
| Database | PostgreSQL 15 |
| Frontend | React + TypeScript (Phase 2) |
| Infrastructure | AWS (ECS/Lambda) + Terraform (Phase 4) |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd flagship

# 2. Start the database
docker-compose up -d

# 3. Install dependencies
cd backend
npm install

# 4. Set up environment
cp .env.example .env

# 5. Start the development server
npm run dev

# 6. Verify the server is running
curl http://localhost:3000/health
```

## API Reference

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

### Feature Flags

#### Create a Flag

```bash
POST /api/v1/flags
Content-Type: application/json

{
  "key": "checkout_redesign",
  "description": "New checkout flow with improved UX",
  "enabled": true,
  "rolloutPercentage": 50,
  "environment": "staging"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "key": "checkout_redesign",
    "description": "New checkout flow with improved UX",
    "enabled": true,
    "rolloutPercentage": 50,
    "environment": "staging",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### List All Flags

```bash
GET /api/v1/flags
GET /api/v1/flags?environment=prod
```

#### Get Flag by ID

```bash
GET /api/v1/flags/:id
```

#### Update a Flag

```bash
PUT /api/v1/flags/:id
Content-Type: application/json

{
  "enabled": true,
  "rolloutPercentage": 75
}
```

#### Delete a Flag

```bash
DELETE /api/v1/flags/:id
```

#### Toggle a Flag

```bash
POST /api/v1/flags/:id/toggle
```

---

### Flag Evaluation (Hot Path)

#### Evaluate Single Flag

```bash
GET /api/v1/evaluate?flagKey=checkout_redesign&userId=user_123&environment=staging
```

Response:
```json
{
  "flagKey": "checkout_redesign",
  "enabled": true,
  "variant": null,
  "reason": "FLAG_ENABLED_IN_ROLLOUT",
  "evaluatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Evaluation Reasons:**
| Reason | Description |
|--------|-------------|
| `FLAG_ENABLED_FULL_ROLLOUT` | Flag enabled, 100% rollout |
| `FLAG_ENABLED_IN_ROLLOUT` | Flag enabled, user is in rollout percentage |
| `FLAG_ENABLED_NOT_IN_ROLLOUT` | Flag enabled, user is outside rollout |
| `FLAG_DISABLED` | Flag exists but is disabled |
| `FLAG_NOT_FOUND` | Flag doesn't exist (fail-safe: disabled) |
| `ERROR` | Evaluation error (fail-safe: disabled) |

#### Batch Evaluation

```bash
POST /api/v1/evaluate/batch
Content-Type: application/json

{
  "flagKeys": ["checkout_redesign", "dark_mode", "new_pricing"],
  "userId": "user_123",
  "environment": "staging"
}
```

#### Evaluate All Flags

```bash
GET /api/v1/evaluate/all?userId=user_123&environment=staging
```

---

## Deterministic Assignment

### How It Works

Flagship uses deterministic hashing to ensure consistent user experiences:

```
bucket = SHA256(userId + ":" + flagKey) % 100

if bucket < rolloutPercentage:
    user sees feature
else:
    user sees control
```

### Key Properties

1. **Deterministic**: The same user always gets the same result for a given flag
2. **Uniform**: Users are evenly distributed across buckets (verified by tests)
3. **Independent**: Changing one flag doesn't affect assignment to other flags
4. **Monotonic**: If a user is in 30% rollout, they're also in 50% and 70%

### Example

```
User: "user_123"
Flag: "checkout_redesign"
Rollout: 50%

SHA256("user_123:checkout_redesign") → bucket 42
42 < 50 → User sees the new checkout ✓
```

### Why SHA-256?

- Cryptographic hash ensures uniform distribution
- No patterns or clustering in bucket assignment
- Industry standard, well-tested algorithm

---

## Failure Modes & Tradeoffs

### Fail-Safe Behavior

Flagship is designed to fail safely:

| Scenario | Behavior |
|----------|----------|
| Flag not found | Returns `enabled: false` |
| Database error | Returns `enabled: false` |
| Invalid input | Returns validation error |
| Service crash | Clients should cache last known state |

### Design Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| **Postgres over Redis** | Simpler ops, but slightly higher latency. Redis caching planned for Phase 4. |
| **Per-request DB lookup** | Always fresh data, but adds ~5-10ms latency. Acceptable for <200ms target. |
| **No client-side SDK** | Simpler architecture, but requires network call per evaluation. Batch endpoint mitigates this. |
| **Percentage-based rollout** | Simple and predictable, but no user targeting. Targeting planned for future. |

### Consistency Model

- **Flags**: Strongly consistent (read-after-write)
- **Evaluations**: Deterministic based on current flag state
- **Rollout changes**: Take effect immediately (no propagation delay)

---

## Project Structure

```
flagship/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment configuration
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── db/               # Database setup & migrations
│   │   ├── middleware/       # Express middleware
│   │   ├── models/           # TypeScript types & DTOs
│   │   ├── repositories/     # Data access layer
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utilities (hashing, logging)
│   │   └── __tests__/        # Unit tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React admin UI (Phase 2)
├── infra/
│   └── terraform/            # Infrastructure as code (Phase 4)
├── scripts/
│   └── traffic-generator/    # Synthetic load testing (Phase 4)
├── docker-compose.yml
└── README.md
```

---

## Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run typecheck

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | flagship | Database name |
| `DB_USER` | flagship | Database user |
| `DB_PASSWORD` | flagship_dev | Database password |
| `LOG_LEVEL` | info | Logging level |

---

