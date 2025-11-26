# @workspace/auth

Password-less, database-less authentication package for the Azure Billing application.

## Features

- Password-less authentication via magic link email
- No database required - stateless JWT tokens
- Email-based allowlist authentication
- Secure session management with HTTP-only cookies

## Usage

### Environment Variables

Required environment variables:

- `JWT_SECRET` - Secret key for JWT signing (must be at least 32 characters)
- `ALLOWED_EMAIL_ADDRESSES` - Comma-separated list of allowed email addresses
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (e.g., "587" for TLS, "465" for SSL)
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password
- `SMTP_FROM` - Email address to send from
- `BASE_URL` (optional) - Base URL for magic links (defaults to `http://localhost:3000`)

### API

#### JWT Utilities

```typescript
import { createMagicLinkToken, verifyMagicLinkToken, createSessionToken, verifySessionToken } from "@workspace/auth/jwt";

// Create a 5-minute magic link token
const magicLinkToken = createMagicLinkToken("user@example.com");

// Verify magic link token
const payload = verifyMagicLinkToken(token); // Returns payload or null

// Create a 1-day session token
const sessionToken = createSessionToken("user@example.com");

// Verify session token
const session = verifySessionToken(token); // Returns payload or null
```

#### Email

```typescript
import { sendMagicLinkEmail } from "@workspace/auth/email";

// Send magic link email
await sendMagicLinkEmail("user@example.com");
```

#### Environment

```typescript
import { isEmailAllowed, getAuthEnv } from "@workspace/auth/env";

// Check if email is allowed
const allowed = isEmailAllowed("user@example.com");

// Get validated environment variables
const env = getAuthEnv();
```

#### Cookies

```typescript
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@workspace/auth/cookies";

// Cookie name constant
const cookieName = SESSION_COOKIE_NAME; // "auth_session"

// Get cookie options
const options = getSessionCookieOptions();
```

## Flow

1. User enters email address
2. System checks if email is in `ALLOWED_EMAIL_ADDRESSES`
3. If allowed, creates 5-minute JWT magic link token
4. Sends email with magic link via SMTP
5. User clicks link, which verifies the token
6. System creates 1-day session JWT and sets HTTP-only cookie
7. User is redirected to `/invoice`

## Security

- Magic link tokens expire in 5 minutes
- Session tokens expire in 1 day
- HTTP-only cookies prevent XSS attacks
- Secure cookies in production
- Email allowlist prevents unauthorized access
- JWT secret must be at least 32 characters

