import { vi } from "vitest";

// Mock Next.js modules
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

// Set up environment variables for auth
process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-characters-long";
process.env.ALLOWED_EMAIL_ADDRESSES = "allowed@example.com,admin@example.com";
process.env.SMTP_HOST = "smtp.test.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_USERNAME = "test-user";
process.env.SMTP_PASSWORD = "test-password";
process.env.SMTP_FROM = "noreply@test.com";
process.env.BASE_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_NO_EMAIL_SEND = "true";
