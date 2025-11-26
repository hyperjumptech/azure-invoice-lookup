import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMagicLinkFormAction } from "./send-magic-link.server.function";

const sendMagicLinkFunctionMock = vi.hoisted(() => vi.fn());
vi.mock("./send-magic-link.function", async () => {
  const actual = await vi.importActual<
    typeof import("./send-magic-link.function")
  >("./send-magic-link.function");
  return {
    ...actual,
    sendMagicLinkFunction: sendMagicLinkFunctionMock,
  };
});

describe("sendMagicLinkFormAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful form action execution", () => {
    it("should validate FormData and call sendMagicLinkFunction with valid email", async () => {
      sendMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it("should handle case-insensitive email addresses", async () => {
      sendMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "TEST@EXAMPLE.COM");

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).toHaveBeenCalledWith({
        email: "TEST@EXAMPLE.COM",
      });
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it("should preserve previous state parameter even though it's not used", async () => {
      sendMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");

      const previousState = { some: "state" };
      const result = await sendMagicLinkFormAction(previousState, formData);

      expect(result).toEqual({
        success: true,
        error: null,
      });
    });
  });

  describe("validation errors", () => {
    it("should return validation error for invalid email format", async () => {
      const formData = new FormData();
      formData.append("email", "not-an-email");

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("email"),
      });
    });

    it("should return validation error when email field is missing", async () => {
      const formData = new FormData();

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("email"),
      });
    });

    it("should return validation error for empty email string", async () => {
      const formData = new FormData();
      formData.append("email", "");

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("email"),
      });
    });

    it("should return validation error for email without @ symbol", async () => {
      const formData = new FormData();
      formData.append("email", "invalidemail.com");

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("email"),
      });
    });
  });

  describe("function return value handling", () => {
    it("should return error when email is not allowed", async () => {
      sendMagicLinkFunctionMock.mockResolvedValue({
        success: false,
        error: "Email address is not allowed",
      });

      const formData = new FormData();
      formData.append("email", "notallowed@example.com");

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).toHaveBeenCalledWith({
        email: "notallowed@example.com",
      });
      expect(result).toEqual({
        success: false,
        error: "Email address is not allowed",
      });
    });

    it("should return error when email sending fails", async () => {
      sendMagicLinkFunctionMock.mockResolvedValue({
        success: false,
        error: "SMTP error",
      });

      const formData = new FormData();
      formData.append("email", "allowed@example.com");

      const result = await sendMagicLinkFormAction(null, formData);

      expect(sendMagicLinkFunctionMock).toHaveBeenCalledWith({
        email: "allowed@example.com",
      });
      expect(result).toEqual({
        success: false,
        error: "SMTP error",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle FormData with extra fields not in schema", async () => {
      sendMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("extra", "field");

      const result = await sendMagicLinkFormAction(null, formData);

      // Extra fields should be stripped by schema validation
      expect(sendMagicLinkFunctionMock).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it("should return validation error when multiple email values are provided", async () => {
      const formData = new FormData();
      formData.append("email", "first@example.com");
      formData.append("email", "second@example.com");

      const result = await sendMagicLinkFormAction(null, formData);

      // When multiple values exist, getFormData returns an array
      // But the schema expects a string, so validation should fail
      expect(sendMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("email"),
      });
    });
  });
});
