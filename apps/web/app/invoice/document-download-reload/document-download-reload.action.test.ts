import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reloadDocumentSearchAction } from "./document-download-reload.action";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE_NAME } from "@workspace/auth";

// Mock the @workspace/auth module
vi.mock("@workspace/auth", async () => {
  const actual = await vi.importActual("@workspace/auth");
  return {
    ...actual,
  };
});

describe("reloadDocumentSearchAction", () => {
  let mockCookieStore: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let originalToISOString: () => string;

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

    // Store original toISOString
    originalToISOString = Date.prototype.toISOString;
  });

  afterEach(() => {
    // Restore original toISOString
    Date.prototype.toISOString = originalToISOString;
  });

  describe("authentication", () => {
    it("should redirect to login when user is not authenticated", async () => {
      // No session cookie present
      mockCookieStore.get.mockReturnValue(undefined);

      vi.mocked(redirect).mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(
        reloadDocumentSearchAction({ invoiceId: "INV-123" })
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(redirect).toHaveBeenCalledWith("/auth/login");
      expect(mockCookieStore.set).not.toHaveBeenCalled();
      expect(updateTag).not.toHaveBeenCalled();
    });

    it("should proceed when user is authenticated", async () => {
      const email = "allowed@example.com";
      // Create session token before mocking Date
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      // Mock toISOString to return a predictable timestamp
      const mockNow = "2025-01-15T10:30:00.000Z";
      Date.prototype.toISOString = vi.fn(() => mockNow);

      await reloadDocumentSearchAction({ invoiceId: "INV-123" });

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "last-fetched-invoice-INV-123",
        mockNow
      );
      expect(updateTag).toHaveBeenCalledWith("get-invoice-pdf-INV-123");
      expect(updateTag).toHaveBeenCalledWith("get-transactions-INV-123");
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should return error when invoiceId is missing", async () => {
      const email = "allowed@example.com";
      // Create session token before any Date operations
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      // @ts-expect-error - test invalid input
      const result = await reloadDocumentSearchAction({});

      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
      expect(mockCookieStore.set).not.toHaveBeenCalled();
      expect(updateTag).not.toHaveBeenCalled();
    });

    it("should return error when invoiceId is not a string", async () => {
      const email = "allowed@example.com";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      const result = await reloadDocumentSearchAction({
        // @ts-expect-error - test invalid input
        invoiceId: 123,
      });

      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
      expect(mockCookieStore.set).not.toHaveBeenCalled();
      expect(updateTag).not.toHaveBeenCalled();
    });

    it("should not accept empty string invoiceId", async () => {
      const email = "allowed@example.com";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      const mockNow = "2025-01-15T10:30:00.000Z";
      Date.prototype.toISOString = vi.fn(() => mockNow);

      const result = await reloadDocumentSearchAction({
        invoiceId: "",
      });

      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
      expect(mockCookieStore.set).not.toHaveBeenCalled();
      expect(updateTag).not.toHaveBeenCalled();
    });
  });

  describe("successful reload", () => {
    it("should set cookie and update cache tags for valid invoiceId", async () => {
      const email = "allowed@example.com";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      const mockNow = "2025-01-15T10:30:00.000Z";
      Date.prototype.toISOString = vi.fn(() => mockNow);

      await reloadDocumentSearchAction({ invoiceId: "INV-123" });

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "last-fetched-invoice-INV-123",
        mockNow
      );
      expect(updateTag).toHaveBeenCalledTimes(2);
      expect(updateTag).toHaveBeenCalledWith("get-invoice-pdf-INV-123");
      expect(updateTag).toHaveBeenCalledWith("get-transactions-INV-123");
    });

    it("should use the correct invoiceId in cookie and cache tag names", async () => {
      const email = "allowed@example.com";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      const invoiceId = "G118332459";
      const mockNow = "2025-10-08T06:02:34.000Z";
      Date.prototype.toISOString = vi.fn(() => mockNow);

      await reloadDocumentSearchAction({ invoiceId });

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        `last-fetched-invoice-${invoiceId}`,
        mockNow
      );
      expect(updateTag).toHaveBeenCalledWith(`get-invoice-pdf-${invoiceId}`);
      expect(updateTag).toHaveBeenCalledWith(`get-transactions-${invoiceId}`);
    });

    it("should set cookie with current timestamp when successful", async () => {
      const email = "allowed@example.com";
      const sessionToken = await createSessionToken(email);

      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
      });

      // Don't mock toISOString here - let it use the real one
      await reloadDocumentSearchAction({ invoiceId: "INV-456" });

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      const setCall = mockCookieStore.set.mock.calls[0];
      expect(setCall?.[0]).toBe("last-fetched-invoice-INV-456");
      expect(setCall?.[1]).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      ); // ISO 8601 format
      expect(updateTag).toHaveBeenCalledWith("get-invoice-pdf-INV-456");
      expect(updateTag).toHaveBeenCalledWith("get-transactions-INV-456");
    });
  });
});
