# AWS Amplify Setup Guide

## Prerequisites

- AWS Account with Amplify access
- GitHub repo: `flowency-live/buildlog`

---

## Step 1: Create Amplify App

1. Go to [AWS Amplify Console (eu-west-2)](https://eu-west-2.console.aws.amazon.com/amplify/home?region=eu-west-2)
2. Click **"Create new app"**
3. Select **"GitHub"** as source
4. Click **"Authorize"** and grant access to `flowency-live` organisation
5. Select repository: `flowency-live/buildlog`
6. Select branch: `main`

---

## Step 2: Configure Build Settings

Amplify should auto-detect Next.js. Verify build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

---

## Step 3: Environment Variables

Add these in Amplify Console → App Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://flowency_admin:FlowencyBacklog2025!@flowency-backlog-db.ch2q4a408jrc.eu-west-2.rds.amazonaws.com:5432/flowency_backlog?schema=public` |
| `NEXTAUTH_URL` | `https://backlog.flowency.build` (or your Amplify URL initially) |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console (set up later) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console (set up later) |
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | `eu-west-2` |
| `AWS_S3_BUCKET` | `flowency-backlog-attachments` |
| `APP_URL` | `https://backlog.flowency.build` |

---

## Step 4: Custom Domain (Optional)

1. Go to **App Settings → Domain Management**
2. Click **"Add domain"**
3. Enter: `flowency.build`
4. Add subdomain: `backlog`
5. Configure DNS as instructed (CNAME record)

---

## Step 5: Deploy

1. Click **"Save and deploy"**
2. Wait for build to complete (~3-5 minutes)
3. Access app at Amplify URL or custom domain

---

## Troubleshooting

### Build Fails with Node Version Error
Add to build settings:
```yaml
preBuild:
  commands:
    - nvm use 18
    - npm ci
```

### Database Connection Timeout
- Ensure RDS security group allows inbound from `0.0.0.0/0` on port `5432`
- Or add Amplify's IP ranges to security group

### Environment Variables Not Working
- Ensure variables are set for the correct branch
- Redeploy after adding/changing variables

---

## AWS Resources Reference

| Resource | Identifier |
|----------|------------|
| RDS Instance | `flowency-backlog-db` |
| RDS Endpoint | `flowency-backlog-db.ch2q4a408jrc.eu-west-2.rds.amazonaws.com` |
| S3 Bucket | `flowency-backlog-attachments` |
| Security Group | `sg-0263d01ea0b0bd4f9` |
| Region | `eu-west-2` |

---

## Google OAuth Setup (for later)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://backlog.flowency.build/api/auth/callback/google`
4. Copy Client ID and Secret to Amplify env vars
