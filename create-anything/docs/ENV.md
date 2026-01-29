# Environment Variables Guide

This document explains all environment variables required to run the Reunify application.

## Quick Start

1. Copy the example files:
   ```bash
   # Web app
   cp apps/web/.env.example apps/web/.env.local

   # Mobile app
   cp apps/mobile/.env.example apps/mobile/.env
   ```

2. Fill in the required values (see sections below)

3. Start the development server

---

## Web App (`apps/web/.env.local`)

### Required Variables

#### `DATABASE_URL`
**Required** | **Secret**

Neon PostgreSQL connection string for the database.

**Format:**
```
postgresql://username:password@host.neon.tech/database?sslmode=require
```

**How to obtain:**
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Go to Dashboard → Connection Details
4. Copy the connection string (select "Pooled connection" for serverless)

**Example:**
```
DATABASE_URL=postgresql://reunify_user:abc123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/reunify?sslmode=require
```

---

#### `AUTH_SECRET`
**Required** | **Secret**

Secret key used by Auth.js to encrypt session tokens and cookies.

**How to generate:**
```bash
openssl rand -base64 32
```

**Requirements:**
- Must be at least 32 characters
- Should be randomly generated
- Never commit to version control
- Use different values for development and production

**Example:**
```
AUTH_SECRET=Kj8mN2pL9qR4sT7vW0xY3zA6bC8dE1fG2hI5jK7lM9nO0pQ=
```

---

#### `AUTH_URL`
**Required**

The base URL of your application. Used to determine cookie security settings.

**Development:**
```
AUTH_URL=http://localhost:5173
```

**Production:**
```
AUTH_URL=https://your-domain.com
```

**Note:** When `AUTH_URL` starts with `https://`, secure cookies are enabled.

---

### Optional Variables

#### `CORS_ORIGINS`

Comma-separated list of allowed origins for Cross-Origin Resource Sharing.

**When to use:**
- When your frontend and backend are on different domains
- When you need to allow specific external domains to access your API

**Example:**
```
CORS_ORIGINS=https://app.reunify.com,https://admin.reunify.com
```

---

#### `NEXT_PUBLIC_PROJECT_GROUP_ID`

Project group identifier from Create.xyz platform.

**How to obtain:**
1. Log in to your Create.xyz dashboard
2. Go to Project Settings
3. Copy the Project Group ID (UUID format)

**Example:**
```
NEXT_PUBLIC_PROJECT_GROUP_ID=278820dd-1c3d-42e4-b1ca-8543b4926183
```

---

#### `NEXT_PUBLIC_CREATE_HOST`

Host header value for Create.xyz API requests.

**Format:** Domain without protocol (e.g., `your-project.created.app`)

**Example:**
```
NEXT_PUBLIC_CREATE_HOST=278820dd-1c3d-42e4-b1ca-8543b4926183.created.app
```

---

#### `NEXT_PUBLIC_CREATE_BASE_URL`

Base URL for Create.xyz platform integration.

**Default:** `https://www.create.xyz`

---

#### `NEXT_PUBLIC_CREATE_ENV`

Environment mode indicator.

**Values:**
- `DEVELOPMENT` - Development mode with additional logging
- `PRODUCTION` - Production mode with optimizations

---

### File Storage (S3-Compatible)

These variables enable secure document uploads using S3-compatible storage (AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, etc.). If not configured, the app falls back to Create.xyz platform uploads.

#### `S3_ENDPOINT`
**Optional** | **Secret**

The S3-compatible endpoint URL.

**AWS S3:**
```
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
```

**Cloudflare R2:**
```
S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
```

---

#### `S3_ACCESS_KEY_ID`
**Optional** | **Secret**

Access key ID for S3 authentication.

---

#### `S3_SECRET_ACCESS_KEY`
**Optional** | **Secret**

Secret access key for S3 authentication.

---

#### `S3_BUCKET`
**Optional**

Name of the S3 bucket for storing uploads.

**Example:**
```
S3_BUCKET=reunify-documents
```

---

#### `S3_REGION`
**Optional**

AWS region or "auto" for R2.

**Default:** `auto`

**Examples:**
- AWS: `us-east-1`, `eu-west-1`
- R2: `auto`

---

#### `S3_PUBLIC_BASE_URL`
**Optional**

Public base URL where files are accessible. Use this for CDN or custom domain setups.

**Examples:**
```
# Cloudflare R2 with public bucket
S3_PUBLIC_BASE_URL=https://pub-xxx.r2.dev

# AWS S3 direct
S3_PUBLIC_BASE_URL=https://my-bucket.s3.us-east-1.amazonaws.com

# Custom CDN domain
S3_PUBLIC_BASE_URL=https://cdn.yourdomain.com
```

---

## Mobile App (`apps/mobile/.env`)

### Required Variables

#### `EXPO_PUBLIC_APP_URL`
**Required**

Your deployed app's URL.

**Example:**
```
EXPO_PUBLIC_APP_URL=https://your-project.created.app
```

---

#### `EXPO_PUBLIC_BASE_URL`
**Required**

Base URL for API requests. Usually the same as `EXPO_PUBLIC_APP_URL`.

**Example:**
```
EXPO_PUBLIC_BASE_URL=https://your-project.created.app
```

---

#### `EXPO_PUBLIC_HOST`
**Required**

Domain name without protocol, used in request headers.

**Example:**
```
EXPO_PUBLIC_HOST=your-project.created.app
```

---

#### `EXPO_PUBLIC_PROJECT_GROUP_ID`
**Required**

Same project group ID as the web app.

**Example:**
```
EXPO_PUBLIC_PROJECT_GROUP_ID=278820dd-1c3d-42e4-b1ca-8543b4926183
```

---

#### `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY`
**Required for file uploads**

Uploadcare public API key for file uploads.

**How to obtain:**
1. Create an account at [uploadcare.com](https://uploadcare.com)
2. Create a new project
3. Go to Dashboard → API Keys
4. Copy the Public Key

**Example:**
```
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=demopublickey
```

---

### Optional Variables

#### `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

Google Maps API key for location features.

**How to obtain:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Maps SDK for Android/iOS
4. Go to Credentials → Create Credentials → API Key
5. Restrict the key to your app's bundle ID

**Example:**
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB1234567890abcdefghijklmnop
```

---

#### `EXPO_PUBLIC_CREATE_ENV`

Environment mode.

**Values:** `DEVELOPMENT` or `PRODUCTION`

---

#### `EXPO_PUBLIC_PROXY_BASE_URL`

Proxy URL for API requests (if using a proxy server).

---

#### `EXPO_PUBLIC_LOGS_ENDPOINT`

Remote logging endpoint for error tracking.

---

#### `EXPO_PUBLIC_CREATE_TEMP_API_KEY`

API key for remote logging service.

---

## Security Best Practices

### Never Commit Secrets

Add these patterns to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### Use Different Values Per Environment

- Development, staging, and production should use different secrets
- Rotate secrets periodically
- Use a secrets manager in production (e.g., AWS Secrets Manager, Vercel Environment Variables)

### Secret Variables

These variables contain sensitive data and must never be logged or exposed:
- `DATABASE_URL`
- `AUTH_SECRET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY` (contains account identifier)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_CREATE_TEMP_API_KEY`

### Validation

The application validates required environment variables at startup. If a required variable is missing, the app will fail fast with a clear error message indicating which variable is missing.

---

## Troubleshooting

### "DATABASE_URL has not been set"

1. Ensure you've created `.env.local` (not just `.env.example`)
2. Check the connection string format includes `?sslmode=require`
3. Verify the Neon database is active (not suspended)

### "AUTH_SECRET must be at least 32 characters"

Generate a new secret:
```bash
openssl rand -base64 32
```

### "Invalid AUTH_URL"

Ensure the URL:
- Includes the protocol (`http://` or `https://`)
- Does not have a trailing slash
- Matches your actual deployment URL

### Mobile App Not Connecting

1. Verify `EXPO_PUBLIC_BASE_URL` matches your web app URL
2. Check that CORS is configured correctly on the web app
3. Ensure the mobile app is using the correct environment file
