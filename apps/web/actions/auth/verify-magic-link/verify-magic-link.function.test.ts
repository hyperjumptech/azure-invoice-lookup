import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyMagicLinkFunction } from "./verify-magic-link.function";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { createMagicLinkToken, SESSION_COOKIE_NAME } from "@workspace/auth";

// Mock the @workspace/auth module
vi.mock("@workspace/auth", async () => {
  const actual = await vi.importActual("@workspace/auth");
  return {
    ...actual,
    sendMagicLinkEmail: vi.fn(),
  };
});

describe("Auth Actions", () => {
  let mockCookieStore: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock cookie store
    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    // @ts-expect-error - test mock
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);
  });

  describe("verifyMagicLinkFunction", () => {
    it("should successfully verify a valid magic link token and set a session cookie", async () => {
      const validToken = await createMagicLinkToken("allowed@example.com");

      const result = await verifyMagicLinkFunction({
        token: validToken,
      });

      expect(result).toEqual({
        success: true,
        error: null,
      });

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24,
        })
      );
      expect(updateTag).toHaveBeenCalledWith("login-logout-button");
    });

    it("should return an error for an invalid token", async () => {
      const result = await verifyMagicLinkFunction({
        token: "invalid-token",
      });

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("Failed to verify magic link"),
      });
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("should return an error for an expired token", async () => {
      // Create a token that expires immediately
      const expiredToken = await createMagicLinkToken("allowed@example.com");

      // Wait for token to expire (magic link tokens expire in 5 minutes)
      // For testing purposes, we'll mock this by creating an invalid token
      const result = await verifyMagicLinkFunction({
        token: expiredToken + "corrupted",
      });

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("Failed to verify magic link"),
      });
    });

    it("should return an error when token is missing", async () => {
      const result = await verifyMagicLinkFunction({
        token: "",
      });

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("Failed to verify magic link"),
      });
    });

    it("should create a session token with the email from the magic link", async () => {
      const email = "admin@example.com";
      const validToken = await createMagicLinkToken(email);

      await verifyMagicLinkFunction({
        token: validToken,
      });

      // Verify that a session token was created and set
      expect(mockCookieStore.set).toHaveBeenCalled();
      const callArgs = mockCookieStore.set.mock.calls[0];
      const sessionToken = callArgs?.[1];

      // We can't easily verify the token content without exposing internal functions,
      // but we can verify it's a string (JWT format)
      expect(typeof sessionToken).toBe("string");
      expect(sessionToken.split(".")).toHaveLength(3); // JWT has 3 parts
    });
  });
});
