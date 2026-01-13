# 🚩 flagship
hey there. this is flagship. it’s a production-grade feature flag and experimentation platform, but without the corporate headache. think launchdarkly or meta's internal tools, but you actually own it.

* feature flags with percentage rollouts

* deterministic user assignment 

* a/b experimentation with variants 

* event tracking and analytics

* fancy admin ui 

🏗️ architecture

it's pretty straightforward. we take a request, do some quick math, and tell your app what to do.

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

🛠️ tech stack

| layer | technology |
|-------|------------|
| backend | Node.js + TypeScript + Express |
| database | PostgreSQL 15 |
| frontend | React + TypeScript (Phase 2) |
| infrastructure | AWS (ECS/Lambda) + Terraform (Phase 4) |

🚀 getting started
**prerequisites**
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

📡 api reference

### health check

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

### why SHA-256?

- cryptographic hash ensures uniform distribution
- no patterns or clustering in bucket assignment
- industry standard, well-tested algorithm

---

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

