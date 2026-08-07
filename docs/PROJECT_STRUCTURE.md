# InsightOS Project Structure

---

| Field | Value |
|--------|-------|
| Product | InsightOS |
| Document | Project Structure |
| Version | 1.0 |
| Status | Draft |
| Author | Kanwal |
| Last Updated | 06 August 2026 |

---

# Table of Contents

1. Overview
2. Repository Structure
3. Frontend Structure
4. Backend Structure
5. AI Services Structure
6. Database Structure
7. Infrastructure
8. Documentation
9. Testing
10. Development Rules

---

# 1. Overview

InsightOS follows a modular monorepo architecture.

Each major component of the system has its own directory while remaining part of a single repository.

This structure improves scalability, maintainability, collaboration, and deployment.

---

# 2. Repository Structure

```text
InsightOS/

├── frontend/
├── backend/
├── ai-services/
├── database/
├── docs/
├── docker/
├── infrastructure/
├── scripts/
├── tests/
├── .github/
├── .gitignore
├── docker-compose.yml
├── README.md
├── LICENSE
└── requirements.txt
```

---

# 3. Frontend Structure

```text
frontend/

├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── services/
├── store/
├── styles/
├── public/
├── types/
├── utils/
└── package.json
```

Responsibilities

- Authentication UI
- Dashboard
- Dataset Upload
- AI Chat
- Reports
- Presentations
- Settings
- Billing

---

# 4. Backend Structure

```text
backend/

├── app/

│   ├── api/

│   ├── core/

│   ├── models/

│   ├── schemas/

│   ├── services/

│   ├── repositories/

│   ├── middleware/

│   ├── security/

│   ├── database/

│   ├── workers/

│   ├── utils/

│   └── main.py

├── migrations/

├── requirements.txt

└── tests/
```

Responsibilities

- Business Logic
- Authentication
- APIs
- Database
- Background Jobs
- AI Integration

---

# 5. AI Services Structure

```text
ai-services/

├── coordinator/

├── chief-analyst/

├── data-engineer/

├── cleaning-agent/

├── profiling-agent/

├── sql-agent/

├── statistics-agent/

├── machine-learning/

├── deep-learning/

├── business-analyst/

├── visualization-agent/

├── report-writer/

├── presenter/

├── decision-advisor/

├── shared/

└── models/
```

Responsibilities

- AI Agent Collaboration
- Prompt Templates
- Business Reasoning
- Machine Learning
- Report Generation
- AI Presentation

---

# 6. Database Structure

```text
database/

├── migrations/

├── seeds/

├── schema/

├── backups/

└── scripts/
```

Responsibilities

- Database Schema
- Migrations
- Seed Data
- Backups

---

# 7. Infrastructure

```text
infrastructure/

├── nginx/

├── monitoring/

├── logging/

├── deployment/

└── security/
```

Responsibilities

- Deployment
- Monitoring
- Logging
- Production Configuration

---

# 8. Documentation

```text
docs/

├── PRODUCT_VISION.md

├── PRD.md

├── SYSTEM_BLUEPRINT.md

├── SYSTEM_ARCHITECTURE.md

├── DATABASE_DESIGN.md

├── TECH_STACK.md

├── PROJECT_STRUCTURE.md

└── requirements/
```

---

# 9. Testing

```text
tests/

├── frontend/

├── backend/

├── integration/

├── ai/

└── performance/
```

Testing includes

- Unit Tests
- Integration Tests
- API Tests
- Performance Tests
- AI Evaluation Tests

---

# 10. Development Rules

The following rules shall be followed during development.

- Every feature must belong to an existing module.
- Every API must be documented.
- Every database change must use migrations.
- Every AI agent shall have a single responsibility.
- Every major feature shall include tests.
- Code shall follow consistent formatting and naming conventions.
- Documentation shall be updated whenever architecture changes.
- Security shall be considered during every development phase.

---

# Document Status

This document defines the official repository structure for InsightOS.

As the platform grows, new folders and modules may be added while maintaining the same modular architecture.