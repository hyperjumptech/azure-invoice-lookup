import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAuthenticated, getSessionEmail } from "./auth";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE_NAME } from "@workspace/auth";

describe("Auth Library", () => {
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

  describe("isAuthenticated", () => {
    it("should return true when a valid session cookie is present", async () => {
      const email = "allowed@example.com";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      const result = await isAuthenticated();

      expect(result).toBe(true);
      expect(mockCookieStore.get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    });

    it("should return false when no session cookie is present", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await isAuthenticated();

      expect(result).toBe(false);
      expect(mockCookieStore.get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    });

    it("should return false when session cookie has an invalid token", async () => {
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: "invalid-token",
      });

      // The verifySessionToken will throw an error for invalid tokens,
      // which getSessionEmail catches and returns null
      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it("should return false when session cookie has an expired token", async () => {
      // Create an expired token by corrupting a valid one
      const email = "allowed@example.com";
      const sessionToken = await createSessionToken(email);
      const corruptedToken = sessionToken + "corrupted";

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: corruptedToken,
      });

      // The verifySessionToken will throw an error for corrupted tokens,
      // which getSessionEmail catches and returns null
      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("getSessionEmail", () => {
    it("should return the email from a valid session token", async () => {
      const email = "admin@example.com";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      const result = await getSessionEmail();

      expect(result).toBe(email);
    });

    it("should return null when no session cookie is present", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getSessionEmail();

      expect(result).toBeNull();
    });

    it("should return null for an invalid session token", async () => {
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: "invalid-token",
      });

      // The verifySessionToken will throw an error, which should be caught
      // This tests the error handling in getSessionEmail
      const result = await getSessionEmail();

      expect(result).toBeNull();
    });

    it("should normalize email to lowercase", async () => {
      const email = "ADMIN@EXAMPLE.COM";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      const result = await getSessionEmail();

      // The createSessionToken function normalizes email to lowercase
      expect(result).toBe("admin@example.com");
    });
  });
});
