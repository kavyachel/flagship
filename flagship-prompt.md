You are helping me build a production-grade Feature Flag and Experimentation Platform called “Flagship”.
This is a serious engineering project intended to demonstrate systems design, backend correctness, infra maturity,
and frontend integration at a big-tech level.

IMPORTANT WORKFLOW CONSTRAINT:
- Work incrementally.
- Pause at natural milestones and explicitly tell me to commit to GitHub.
- Commits should be small, realistic, and frequent (e.g. “Add flag evaluation logic”, “Introduce FeatureFlag schema”).
- Do NOT build everything in one step.
- After each milestone, stop and wait for confirmation before proceeding.

==================================================
PROJECT OVERVIEW
==================================================

Flagship is an internal-style platform (like LaunchDarkly / Meta experimentation infra) that supports:
- Feature flags with percentage rollouts
- Deterministic user assignment
- A/B experimentation with variants
- Event tracking and basic analytics
- Admin UI for configuration
- Cloud deployment with Terraform on AWS

This is NOT a startup and does NOT require real users.
Usage will be validated via demo apps and synthetic traffic.

==================================================
ARCHITECTURE
==================================================

Client Apps (Web / Backend)
        |
        v
Flag Evaluation API  ---> (Optional Redis Cache)
        |
        v
Core Service  ---> Postgres (RDS)
        |
        v
Event Ingestion & Analytics

Key principles:
- Flag evaluation is the hot path and must be fast (<200ms target).
- Assignment must be deterministic and consistent.
- System must fail safely (sensible defaults if unavailable).
- Writes are rare, reads are frequent.

==================================================
TECH STACK
==================================================

Backend:
- Java + Spring Boot OR Node.js + TypeScript (pick one and stick with it)
- REST APIs
- Postgres (Docker locally, RDS in prod)

Frontend:
- React + TypeScript
- Simple admin UI (Tailwind OK)

Infra:
- AWS (ECS or Lambda)
- Terraform
- GitHub Actions for CI/CD

==================================================
DATA MODEL
==================================================

FeatureFlag
- id (UUID)
- key (string, unique)            // e.g. "checkout_redesign"
- description (string)
- enabled (boolean)
- rollout_percentage (int, 0–100)
- environment (enum: prod, staging)
- created_at
- updated_at

Experiment
- id (UUID)
- flag_id (FK)
- name
- status (enum: draft, running, stopped)
- created_at

Variant
- id (UUID)
- experiment_id (FK)
- name (control, treatment)
- weight (int, must sum to 100)

Event
- id (UUID)
- user_id (string)
- experiment_id (UUID)
- variant_id (UUID)
- event_type (string)     // "purchase", "click"
- created_at

Design note:
- Store raw events first.
- Aggregation happens asynchronously / later.
- This enables discussion of eventual consistency.

==================================================
CORE API ENDPOINTS (MVP)
==================================================

Feature Flags
POST   /flags
GET    /flags
PUT    /flags/{id}

Flag Evaluation (HOT PATH)
GET /evaluate?flagKey=&userId=&environment=

Response:
{
  "flagKey": "checkout_redesign",
  "enabled": true,
  "variant": "treatment"
}

Experiments
POST /experiments
POST /experiments/{id}/start
POST /experiments/{id}/stop

Events
POST /events

==================================================
DETERMINISTIC ASSIGNMENT LOGIC
==================================================

Feature rollout:
hash(userId + flagKey) % 100 < rollout_percentage

Experiment variant:
hash(userId + experimentId) % 100
→ map to variant by cumulative weight

This logic MUST be:
- Deterministic
- Consistent across calls
- Easy to explain in interviews

==================================================
PHASED BUILD PLAN (WITH COMMITS)
==================================================

PHASE 1 — Backend MVP (STOP AFTER THIS)
- Project scaffolding
- Database schema
- FeatureFlag CRUD
- /evaluate endpoint
- Deterministic rollout logic
- Local Postgres via Docker

PAUSE AND PROMPT ME TO COMMIT AFTER:
- Initial project setup
- FeatureFlag model/schema
- Flag evaluation logic
- API wiring

Acceptance criteria:
- Same user always gets same result
- Rollout percentages work
- App runs locally
- README updated with basic usage

PHASE 2 — Admin UI
- React app scaffold
- Flag list view
- Toggle enable/disable
- Adjust rollout percentage

Pause and prompt for commits after each UI milestone.

PHASE 3 — Experiments + Events
- Experiment + Variant models
- Deterministic variant assignment
- Event ingestion endpoint
- Basic aggregation (conversion rate)

PHASE 4 — Infra & Polish
- Terraform for AWS resources
- Deploy backend
- Optional Redis caching
- Synthetic traffic generator (10k–50k users)
- Metrics (p95 latency)

==================================================
REPO STRUCTURE
==================================================

flagship/
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   └── models/
├── frontend/
├── infra/
│   └── terraform/
├── scripts/
│   └── traffic-generator/
└── README.md

==================================================
README REQUIREMENTS
==================================================

README must include:
1. What the system does
2. Architecture diagram (ASCII or image)
3. Deterministic assignment explanation
4. API examples
5. Failure modes and tradeoffs
6. Future improvements

==================================================
IMPORTANT BEHAVIOR RULES
==================================================

- Do NOT rush.
- Do NOT skip commits.
- Treat this like internal infrastructure.
- Stop frequently and ask me to commit.
- Build this as if it will be reviewed by a senior engineer.

Start with:
- Backend setup
- Schema definitions
- Hashing utility
- /evaluate endpoint

Stop after Phase 1 and wait for confirmation before proceeding.