# FlowencyBuild-Backlog - Implementation Plan

**Project:** FlowencyBuild-Backlog
**Version:** 1.0.0 (MVP)
**Created:** December 9, 2025
**Status:** Phase 0 In Progress

---

## Executive Summary

Internal product backlog collaboration tool for Flowency Build. Enables Flowency team and clients to collaboratively manage, prioritise, and refine product backlogs with full transparency.

**Core Value:**
- Clients get visibility and input into product roadmap
- Flowency maintains single source of truth for all client work
- AI-ready: Export to markdown for Claude analysis and feature suggestions

---

## Architecture Overview

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | SSR, API routes, modern React |
| Auth | Auth.js v5 | Google OAuth + email/password |
| Database | PostgreSQL (AWS RDS) | Relational, multi-tenant, AWS credits |
| Storage | AWS S3 | Attachments (images, PDFs) |
| Hosting | AWS Amplify | Separate app, same domain family |
| UI | Tailwind + shadcn/ui | Consistent with Flowency projects |
| Drag & Drop | @dnd-kit | Modern, accessible, React-native |
| Rich Text | Markdown textarea with preview | Simple POC approach |

### Domain

```
backlog.flowency.build
```

### User Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| `flowency_admin` | All clients | Full access + client management |
| `client_admin` | Own client | Full CRUD + invite team members |
| `client_member` | Own client | Full CRUD on PBIs and comments |

---

## Database Schema

### Tables

```sql
-- Clients (tenants)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL CHECK (role IN ('flowency_admin', 'client_admin', 'client_member')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  CONSTRAINT valid_client_assignment CHECK (
    (role = 'flowency_admin' AND client_id IS NULL) OR
    (role != 'flowency_admin' AND client_id IS NOT NULL)
  )
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Backlog Items (PBIs)
CREATE TABLE pbis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('feature', 'bug', 'tweak', 'idea')),
  status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  effort VARCHAR(10) CHECK (effort IN ('XS', 'S', 'M', 'L', 'XL')),
  stack_position INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, stack_position)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pbi_id UUID NOT NULL REFERENCES pbis(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pbi_id UUID NOT NULL REFERENCES pbis(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pbis_client_id ON pbis(client_id);
CREATE INDEX idx_pbis_status ON pbis(status);
CREATE INDEX idx_pbis_stack_position ON pbis(client_id, stack_position);
CREATE INDEX idx_comments_pbi_id ON comments(pbi_id);
CREATE INDEX idx_attachments_pbi_id ON attachments(pbi_id);
CREATE INDEX idx_activity_log_client_id ON activity_log(client_id);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_email ON users(email);
```

---

## Route Structure

```
/                                   -> Redirect to /login or /dashboard
/login                              -> Login page (Google / email+password)
/invite/[token]                     -> Accept invitation flow

/dashboard                          -> Flowency admin: clients overview
                                    -> Client user: redirect to their backlog

/clients                            -> Flowency admin: client management
/clients/new                        -> Create new client
/clients/[slug]/settings            -> Client settings (logo, name, team)
/clients/[slug]/team                -> Manage client team members

/backlog/[slug]                     -> Client backlog (main view)
/backlog/[slug]/pbi/[id]            -> PBI detail modal/page
/backlog/[slug]/pbi/new             -> Create new PBI

/backlog/[slug]/prd                 -> Generated PRD view
/backlog/[slug]/prd/export          -> Export PRD as markdown

/api/auth/[...nextauth]             -> Auth.js routes
/api/clients/[slug]/pbis            -> PBI CRUD
/api/clients/[slug]/pbis/reorder    -> Reorder stack positions
/api/clients/[slug]/export/markdown -> Export backlog as markdown
/api/clients/[slug]/export/prd      -> Export generated PRD
/api/pbis/[id]/comments             -> Comments CRUD
/api/pbis/[id]/attachments          -> Attachment upload/delete
/api/upload/presigned               -> S3 presigned URL for uploads
```

---

## Implementation Phases

### Phase 0: Project Setup [IN PROGRESS]
- [x] Initialize Next.js 14 project
- [x] Configure TypeScript strict mode
- [x] Set up Tailwind + shadcn/ui
- [ ] Configure ESLint
- [x] Create folder structure
- [x] Set up environment variables template
- [x] Initialize git repository
- [ ] Create AWS RDS PostgreSQL instance
- [ ] Create S3 bucket for attachments
- [ ] Set up AWS Amplify app

### Phase 1: Database & Auth Foundation
- [ ] Install and configure Prisma ORM
- [ ] Create database schema (all tables)
- [ ] Run initial migration
- [ ] Install Auth.js v5
- [ ] Configure Google OAuth provider
- [ ] Configure credentials provider (email/password)
- [ ] Create login page UI
- [ ] Create invitation acceptance flow
- [ ] Implement session middleware
- [ ] Create auth utility functions (getCurrentUser, requireAuth)
- [ ] Test all auth flows manually

### Phase 2: Core Data Layer
- [ ] Create Prisma client singleton
- [ ] Create data access functions:
  - [ ] clients: create, getBySlug, update, archive, list
  - [ ] users: create, getByEmail, update, listByClient
  - [ ] pbis: create, getById, update, delete, listByClient, reorder
  - [ ] comments: create, update, delete, listByPbi
  - [ ] attachments: create, delete, listByPbi
  - [ ] invitations: create, verify, listByClient
- [ ] Create S3 presigned URL utility
- [ ] Create activity logging utility
- [ ] Write API routes

### Phase 3: Flowency Admin UI
- [ ] Create layout component with navigation
- [ ] Build dashboard page (/dashboard)
- [ ] Build client management (/clients)
- [ ] Implement client switcher in nav
- [ ] Add invite user modal

### Phase 4: Backlog UI
- [ ] Build backlog page layout (/backlog/[slug])
- [ ] Create PBI card component
- [ ] Implement drag-and-drop with @dnd-kit
- [ ] Build filter controls (status, type)
- [ ] Create "New PBI" modal/form
- [ ] Build PBI detail view
- [ ] Implement comments section
- [ ] Implement attachments upload

### Phase 5: PRD & Export
- [ ] Build PRD generator logic
- [ ] Create PRD view page
- [ ] Create markdown export endpoint
- [ ] Add "Copy to clipboard" functionality

### Phase 6: Polish & Deploy
- [ ] Responsive design pass
- [ ] Loading states and skeletons
- [ ] Error handling
- [ ] Security review
- [ ] Deploy to AWS Amplify
- [ ] Configure custom domain

### Phase 7: First Client Onboarding
- [ ] Create first client
- [ ] Import existing backlog items
- [ ] Invite client team members
- [ ] Gather feedback

---

## Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Project Setup | In Progress | 7/10 |
| Phase 1: Database & Auth | Not Started | 0/11 |
| Phase 2: Core Data Layer | Not Started | 0/10 |
| Phase 3: Flowency Admin UI | Not Started | 0/5 |
| Phase 4: Backlog UI | Not Started | 0/8 |
| Phase 5: PRD & Export | Not Started | 0/4 |
| Phase 6: Polish & Deploy | Not Started | 0/6 |
| Phase 7: First Client | Not Started | 0/4 |

---

## Environment Variables

```bash
# Database (AWS RDS PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/flowency_backlog"

# Auth.js
NEXTAUTH_URL="https://backlog.flowency.build"
NEXTAUTH_SECRET="generate-random-secret"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AWS
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="eu-west-2"
AWS_S3_BUCKET="flowency-backlog-attachments"

# App Config
APP_URL="https://backlog.flowency.build"
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL on AWS RDS | Relational fits multi-tenant, AWS credits available |
| Auth | Auth.js v5 | Google OAuth + email/password, no magic links for POC |
| Hosting | AWS Amplify | AWS credits, separate from marketing site |
| GitHub Integration | Not in MVP | Database is source of truth |
| Rich Text | Markdown textarea | Simplest POC approach |
| Email Service | Manual invites | Skip automated emails for POC |

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-09 | Initial plan created |
| 2025-12-09 | Phase 0 started - project setup |

---

*Document maintained by CTO. Update after each phase completion.*
