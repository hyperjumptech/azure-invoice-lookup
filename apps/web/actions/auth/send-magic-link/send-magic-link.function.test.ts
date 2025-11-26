import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMagicLinkFunction } from "./send-magic-link.function";

// Mock the @workspace/auth module
vi.mock("@workspace/auth", async () => {
  const actual = await vi.importActual("@workspace/auth");
  return {
    ...actual,
    sendMagicLinkEmail: vi.fn(),
  };
});

describe("send-magic-link.function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should send a magic link email for an allowed email address", async () => {
    const { sendMagicLinkEmail } = await import("@workspace/auth");

    const result = await sendMagicLinkFunction({
      email: "allowed@example.com",
    });

    expect(result).toEqual({
      success: true,
      error: null,
    });
    expect(sendMagicLinkEmail).toHaveBeenCalledWith("allowed@example.com");
  });

  it("should return an error for an email address not in the allowlist", async () => {
    const result = await sendMagicLinkFunction({
      email: "notallowed@example.com",
    });

    expect(result).toEqual({
      success: false,
      error: "Email address is not allowed",
    });
  });

  it("should normalize email case when checking allowlist", async () => {
    const { sendMagicLinkEmail } = await import("@workspace/auth");

    const result = await sendMagicLinkFunction({
      email: "ALLOWED@EXAMPLE.COM",
    });

    expect(result).toEqual({
      success: true,
      error: null,
    });
    expect(sendMagicLinkEmail).toHaveBeenCalledWith("ALLOWED@EXAMPLE.COM");
  });

  it("should handle email sending errors gracefully", async () => {
    const { sendMagicLinkEmail } = await import("@workspace/auth");
    vi.mocked(sendMagicLinkEmail).mockRejectedValueOnce(
      new Error("SMTP error")
    );

    const result = await sendMagicLinkFunction({
      email: "allowed@example.com",
    });

    expect(result).toEqual({
      success: false,
      error: "SMTP error",
    });
  });
});
