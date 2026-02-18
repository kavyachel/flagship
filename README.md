# 🚩 flagship
hey there. this is flagship. it’s a production-grade feature flag and experimentation platform, but without the corporate headache.

* feature flags with percentage rollouts

* deterministic user assignment 

* a/b experimentation with variants 

* event tracking and analytics

* fancy admin ui

<img width="1469" height="799" alt="Screenshot 2026-01-13 at 9 06 48 PM" src="https://github.com/user-attachments/assets/f44288ed-eab2-4a2b-ac2e-e7026714f82b" />

## 🏗️ architecture

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

## 🛠️ tech stack

| layer | technology |
|-------|------------|
| backend | Node.js + TypeScript + Express |
| database | PostgreSQL 15 |
| frontend | React + TypeScript (Phase 2) |
| infrastructure | AWS (ECS/Lambda) + Terraform (Phase 4) |

## 🚀 getting started
**prerequisites**
- Node.js 18+
- Docker and Docker Compose
- Git

### quick start

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

## 📡 api reference

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

#### create a flag

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

#### list all flags

```bash
GET /api/v1/flags
GET /api/v1/flags?environment=prod
```

#### get flag by id

```bash
GET /api/v1/flags/:id
```

#### update a flag

```bash
PUT /api/v1/flags/:id
Content-Type: application/json

{
  "enabled": true,
  "rolloutPercentage": 75
}
```

#### delete a flag

```bash
DELETE /api/v1/flags/:id
```

#### toggle a flag

```bash
POST /api/v1/flags/:id/toggle
```

---
