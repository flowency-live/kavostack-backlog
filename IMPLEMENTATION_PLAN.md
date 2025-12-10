# KAVOStack-Backlog - Implementation Plan

**Project:** KAVOStack-Backlog (formerly FlowencyBuild-Backlog)
**Version:** 1.0.0 (MVP)
**Created:** December 9, 2025
**Last Updated:** December 10, 2025
**Status:** Phase 6 In Progress - Infrastructure Setup Required

---

## Executive Summary

Internal product backlog collaboration tool for KAVOStack. Enables team and clients to collaboratively manage, prioritise, and refine product backlogs with full transparency.

**Core Value:**
- Clients get visibility and input into product roadmap
- Single source of truth for all client work
- AI-ready: Export to markdown for Claude analysis and feature suggestions

---

## Architecture Overview

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | SSR, API routes, modern React |
| Auth | Auth.js v5 | Google OAuth + email/password |
| Database | PostgreSQL (AWS RDS Free Tier) | Relational, multi-tenant |
| ORM | Prisma v6.19 | Type-safe database access |
| Storage | AWS S3 | Attachments (images, PDFs) |
| Hosting | AWS Amplify | CI/CD from GitHub |
| UI | Tailwind + shadcn/ui | Consistent design system |
| Drag & Drop | @hello-pangea/dnd | Modern, accessible |

### Target Domain

```
backlog.kavostack.com
```

### User Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| `flowency_admin` | All clients | Full access + client management |
| `client_admin` | Own client | Full CRUD + invite team members |
| `client_member` | Own client | Full CRUD on PBIs and comments |

---

## Implementation Phases

### Phase 0: Project Setup [COMPLETE]
- [x] Initialize Next.js 14 project
- [x] Configure TypeScript strict mode
- [x] Set up Tailwind + shadcn/ui
- [x] Configure ESLint
- [x] Create folder structure
- [x] Set up environment variables template
- [x] Initialize git repository

### Phase 1: Database & Auth Foundation [COMPLETE]
- [x] Install and configure Prisma ORM
- [x] Create database schema (all tables)
- [x] Create initial migration
- [x] Install Auth.js v5
- [x] Configure Google OAuth provider
- [x] Configure credentials provider (email/password)
- [x] Create login page UI
- [x] Create invitation acceptance flow
- [x] Implement session middleware
- [x] Create auth utility functions (getCurrentUser, requireAuth)

### Phase 2: Core Data Layer [COMPLETE]
- [x] Create Prisma client singleton
- [x] Create data access functions:
  - [x] clients: create, getBySlug, update, archive, list, stats
  - [x] users: create, getByEmail, update, listByClient
  - [x] pbis: create, getById, update, delete, listByClient, reorder
  - [x] comments: create, update, delete, listByPbi
  - [x] attachments: create, delete, listByPbi
  - [x] invitations: create, verify, listByClient, accept
- [x] Create S3 presigned URL utility
- [x] Write API routes (16 endpoints)

### Phase 3: Admin UI [COMPLETE]
- [x] Create layout component with navigation
- [x] Build dashboard page (/dashboard)
- [x] Build client management (/clients, /clients/new, /clients/[slug])
- [x] Implement client switcher in nav
- [x] Add invite user functionality
- [x] Build user management table

### Phase 4: Backlog UI [COMPLETE]
- [x] Build backlog page layout (/backlog/[slug])
- [x] Create PBI card component
- [x] Implement drag-and-drop with @hello-pangea/dnd
- [x] Build filter controls (status, type)
- [x] Create "New PBI" dialog
- [x] Build PBI detail dialog with tabs
- [x] Implement comments section
- [x] Create attachment backend (UI pending)

### Phase 5: PRD & Export [COMPLETE]
- [x] Build PRD generator logic
- [x] Create PRD view page (/backlog/[slug]/prd)
- [x] Create PRD API endpoint
- [x] Add export functionality (markdown, copy)

### Phase 6: Infrastructure & Deploy [IN PROGRESS]
- [ ] **Create AWS RDS PostgreSQL instance (Free Tier)**
- [ ] Run Prisma migrations on production database
- [ ] Create S3 bucket for attachments
- [ ] Configure environment variables in Amplify
- [ ] Seed first admin user
- [ ] Configure custom domain
- [ ] Security review

### Phase 7: First Client Onboarding [NOT STARTED]
- [ ] Create first client
- [ ] Import existing backlog items
- [ ] Invite client team members
- [ ] Gather feedback

---

## Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Project Setup | Complete | 7/7 |
| Phase 1: Database & Auth | Complete | 10/10 |
| Phase 2: Core Data Layer | Complete | 8/8 |
| Phase 3: Admin UI | Complete | 6/6 |
| Phase 4: Backlog UI | Complete | 8/8 |
| Phase 5: PRD & Export | Complete | 4/4 |
| Phase 6: Infrastructure | In Progress | 0/7 |
| Phase 7: First Client | Not Started | 0/4 |

**Overall: ~85% Complete - Blocked on infrastructure setup**

---

## AWS Infrastructure Required

### 1. RDS PostgreSQL (Free Tier)
- Instance: db.t3.micro (750 hours/month free for 12 months)
- Storage: 20GB gp2 (free tier)
- Region: eu-west-2 (London)
- Estimated cost after free tier: ~$15/month

### 2. S3 Bucket
- Bucket: kavostack-backlog-attachments
- Region: eu-west-2
- Estimated cost: <$1/month for typical usage

### 3. Amplify Hosting
- Already configured
- Cost: Free tier covers typical usage

---

## Environment Variables (Required for Amplify)

```bash
# Database (AWS RDS PostgreSQL)
DATABASE_URL="postgresql://kavostack:PASSWORD@hostname.eu-west-2.rds.amazonaws.com:5432/kavostack_backlog"

# Auth.js (CRITICAL - generate with: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://main.d3frec5o8zo3dw.amplifyapp.com"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# AWS (for S3 attachments)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="eu-west-2"
AWS_S3_BUCKET="kavostack-backlog-attachments"
```

---

## Known Gaps (Non-Blocking)

| Feature | Status | Priority |
|---------|--------|----------|
| Attachment upload UI | Backend only | Low |
| Email notifications | Not implemented | Low (manual invites OK) |
| Password reset | Not implemented | Medium |
| Profile page | Route missing | Low |
| Activity log display | Model exists, no UI | Low |

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-09 | Initial plan created |
| 2025-12-09 | Phase 0 started |
| 2025-12-10 | Phases 1-5 completed (code review confirmed) |
| 2025-12-10 | Plan updated to reflect actual implementation status |
| 2025-12-10 | Phase 6 infrastructure setup in progress |

---

*Document maintained by CTO. Update after each phase completion.*
