import { describe, it, expect, vi, beforeEach } from "vitest";
import { logoutFunction } from "./logout.function";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { SESSION_COOKIE_NAME } from "@workspace/auth";

describe("Logout", () => {
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

  describe("logoutFunction", () => {
    it("should clear the session cookie and redirect to /auth/login by default", async () => {
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(logoutFunction({})).rejects.toThrow("NEXT_REDIRECT");

      expect(mockCookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
      expect(updateTag).toHaveBeenCalledWith("login-logout-button");
      expect(redirect).toHaveBeenCalledWith("/auth/login");
    });

    it("should redirect to custom path when redirectTo is provided", async () => {
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(
        logoutFunction({ redirectTo: "/custom-path" })
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(mockCookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
      expect(redirect).toHaveBeenCalledWith("/custom-path");
    });
  });
});
