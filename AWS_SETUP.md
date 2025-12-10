# KAVOStack Backlog - AWS Infrastructure Setup

**Cost-Effective AWS Setup Guide**
**Estimated Monthly Cost: $0-15 (Free Tier) / ~$20 after**

---

## Prerequisites

- AWS CLI installed and configured
- AWS Account with appropriate permissions
- Node.js 18+ installed locally

---

## 1. Create RDS PostgreSQL Instance (Free Tier)

### Option A: AWS Console (Recommended for first time)

1. Go to **AWS Console > RDS > Create Database**
2. Select **Standard Create**
3. Engine: **PostgreSQL** (latest version)
4. Templates: **Free tier**
5. Settings:
   - DB instance identifier: `kavostack-backlog`
   - Master username: `kavostack`
   - Master password: (generate and save securely)
6. Instance configuration:
   - DB instance class: `db.t3.micro` (Free tier eligible)
7. Storage:
   - Type: `gp2`
   - Allocated: `20 GB`
   - Disable auto-scaling for cost control
8. Connectivity:
   - VPC: Default
   - Public access: **Yes** (for Amplify access)
   - Security group: Create new
9. Database authentication: **Password authentication**
10. Additional configuration:
    - Initial database name: `kavostack_backlog`
    - Backup retention: 7 days (free)
    - Disable Performance Insights (costs money)
    - Disable Enhanced Monitoring (costs money)

### Option B: AWS CLI

```bash
# Create security group for RDS
aws ec2 create-security-group \
  --group-name kavostack-backlog-rds \
  --description "Security group for KAVOStack Backlog RDS" \
  --region eu-west-2

# Get the security group ID from output, then allow PostgreSQL access
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXXXXXX \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region eu-west-2

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier kavostack-backlog \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username kavostack \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-name kavostack_backlog \
  --vpc-security-group-ids sg-XXXXXXXXX \
  --publicly-accessible \
  --backup-retention-period 7 \
  --no-enable-performance-insights \
  --region eu-west-2
```

### After Creation

Wait 5-10 minutes for the instance to be available, then get the endpoint:

```bash
aws rds describe-db-instances \
  --db-instance-identifier kavostack-backlog \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region eu-west-2
```

Your `DATABASE_URL` will be:
```
postgresql://kavostack:YOUR_PASSWORD@YOUR_ENDPOINT:5432/kavostack_backlog
```

---

## 2. Create S3 Bucket for Attachments

```bash
# Create bucket
aws s3 mb s3://kavostack-backlog-attachments --region eu-west-2

# Enable CORS for browser uploads
aws s3api put-bucket-cors \
  --bucket kavostack-backlog-attachments \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://*.amplifyapp.com", "https://backlog.kavostack.com"],
        "ExposeHeaders": ["ETag"]
      }
    ]
  }'

# Block public access (files accessed via presigned URLs only)
aws s3api put-public-access-block \
  --bucket kavostack-backlog-attachments \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

---

## 3. Create IAM User for Application

```bash
# Create IAM user
aws iam create-user --user-name kavostack-backlog-app

# Create policy for S3 access
aws iam put-user-policy \
  --user-name kavostack-backlog-app \
  --policy-name S3AttachmentsAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::kavostack-backlog-attachments/*"
      }
    ]
  }'

# Create access keys
aws iam create-access-key --user-name kavostack-backlog-app
```

Save the `AccessKeyId` and `SecretAccessKey` from the output.

---

## 4. Run Database Migrations

From your local machine with DATABASE_URL set:

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://kavostack:PASSWORD@endpoint.eu-west-2.rds.amazonaws.com:5432/kavostack_backlog"

# Run migrations
cd C:\VSProjects\_Websites\KAVOStack-Backlog
npx prisma migrate deploy

# Seed admin user
export ADMIN_EMAIL="your-email@kavostack.com"
export ADMIN_PASSWORD="YourSecurePassword123!"
export ADMIN_NAME="Your Name"
npm run db:seed
```

---

## 5. Configure Amplify Environment Variables

In **AWS Amplify Console > Your App > Environment variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://kavostack:PASSWORD@endpoint:5432/kavostack_backlog` |
| `AUTH_SECRET` | (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://main.d3frec5o8zo3dw.amplifyapp.com` |
| `GOOGLE_CLIENT_ID` | (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | (from Google Cloud Console) |
| `AWS_ACCESS_KEY_ID` | (from step 3) |
| `AWS_SECRET_ACCESS_KEY` | (from step 3) |
| `AWS_REGION` | `eu-west-2` |
| `AWS_S3_BUCKET` | `kavostack-backlog-attachments` |

After adding, trigger a rebuild in Amplify.

---

## 6. Google OAuth Setup (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Configure OAuth consent screen:
   - User Type: External
   - App name: KAVOStack Backlog
   - Support email: your email
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://main.d3frec5o8zo3dw.amplifyapp.com/api/auth/callback/google`
     - `https://backlog.kavostack.com/api/auth/callback/google` (for custom domain)
5. Copy Client ID and Client Secret to Amplify env vars

---

## Cost Breakdown

### Free Tier (First 12 months)

| Service | Free Tier Allowance | Our Usage |
|---------|---------------------|-----------|
| RDS db.t3.micro | 750 hours/month | ~720 hours |
| RDS Storage | 20 GB | 20 GB |
| S3 Storage | 5 GB | <1 GB |
| S3 Requests | 20,000 GET, 2,000 PUT | Minimal |
| Amplify Build | 1000 min/month | ~50 min |
| Amplify Hosting | 15 GB/month | <1 GB |

**Total during free tier: $0/month**

### After Free Tier

| Service | Monthly Cost |
|---------|--------------|
| RDS db.t3.micro | ~$15 |
| RDS Storage (20GB) | ~$2.30 |
| S3 | <$1 |
| Amplify | <$1 |

**Total after free tier: ~$20/month**

---

## Troubleshooting

### RDS Connection Failed

1. Check security group allows inbound on port 5432
2. Verify "Publicly accessible" is enabled
3. Test connection locally: `psql postgresql://user:pass@endpoint:5432/db`

### Auth.js 500 Error

1. Verify `AUTH_SECRET` is set (generate fresh if needed)
2. Check `NEXTAUTH_URL` matches your deployed URL exactly
3. Ensure `DATABASE_URL` is correct

### Google OAuth Not Working

1. Verify redirect URIs match exactly (including https://)
2. Check Client ID and Secret are correct
3. Ensure OAuth consent screen is configured

---

## Quick Start Commands Summary

```bash
# 1. Create RDS (via console - easier)
# 2. Create S3 bucket
aws s3 mb s3://kavostack-backlog-attachments --region eu-west-2

# 3. Run migrations locally
export DATABASE_URL="postgresql://kavostack:PASS@endpoint:5432/kavostack_backlog"
npx prisma migrate deploy

# 4. Seed admin user
export ADMIN_EMAIL="admin@kavostack.com"
export ADMIN_PASSWORD="SecurePass123!"
npm run db:seed

# 5. Generate AUTH_SECRET
openssl rand -base64 32

# 6. Add all env vars to Amplify Console
# 7. Trigger rebuild
```

---

*Last updated: December 10, 2025*
