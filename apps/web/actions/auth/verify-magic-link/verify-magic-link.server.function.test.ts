import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyMagicLinkFormAction } from "./verify-magic-link.server.function";

const fakeIpData = {
  ip_address: "127.0.0.1",
  geo_data: {
    ip: "127.0.0.1",
    city: "Test City",
    region: "Test Region",
    country: "Test Country",
    isp: "Test ISP",
  },
};

const verifyMagicLinkFunctionMock = vi.hoisted(() => vi.fn());
vi.mock("./verify-magic-link.function", async () => {
  const actual = await vi.importActual<
    typeof import("./verify-magic-link.function")
  >("./verify-magic-link.function");
  return {
    ...actual,
    verifyMagicLinkFunction: verifyMagicLinkFunctionMock,
  };
});

describe("verifyMagicLinkFormAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful form action execution", () => {
    it("should validate FormData and call verifyMagicLinkFunction with valid token", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("token", "valid-token-123");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      expect(verifyMagicLinkFunctionMock).toHaveBeenCalledWith({
        token: "valid-token-123",
        ip_address: fakeIpData.ip_address,
        geo_data: fakeIpData.geo_data,
      });
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it("should preserve previous state parameter even though it's not used", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("token", "valid-token-123");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const previousState = { some: "state" };
      const result = await verifyMagicLinkFormAction(previousState, formData);

      expect(result).toEqual({
        success: true,
        error: null,
      });
    });
  });

  describe("validation errors", () => {
    it("should return validation error when token field is missing", async () => {
      const formData = new FormData();

      const result = await verifyMagicLinkFormAction(null, formData);

      expect(verifyMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("token"),
      });
    });

    it("should return validation error for empty token string", async () => {
      const formData = new FormData();
      formData.append("token", "");

      const result = await verifyMagicLinkFormAction(null, formData);

      expect(verifyMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("token"),
      });
    });

    it("should call function with whitespace-only token (schema allows it, function will handle validation)", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: false,
        error: "Failed to verify magic link: Invalid token",
      });

      const formData = new FormData();
      formData.append("token", "   ");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      // Schema allows whitespace (min(1) passes), so function is called
      expect(verifyMagicLinkFunctionMock).toHaveBeenCalledWith({
        token: "   ",
        ip_address: fakeIpData.ip_address,
        geo_data: fakeIpData.geo_data,
      });
      expect(result).toEqual({
        success: false,
        error: "Failed to verify magic link: Invalid token",
      });
    });
  });

  describe("function return value handling", () => {
    it("should return error when token verification fails", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: false,
        error: "Failed to verify magic link: Invalid token",
      });

      const formData = new FormData();
      formData.append("token", "invalid-token");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      expect(verifyMagicLinkFunctionMock).toHaveBeenCalledWith({
        token: "invalid-token",
        ip_address: fakeIpData.ip_address,
        geo_data: fakeIpData.geo_data,
      });
      expect(result).toEqual({
        success: false,
        error: "Failed to verify magic link: Invalid token",
      });
    });

    it("should return error when token is expired", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: false,
        error: "Failed to verify magic link: Token has expired",
      });

      const formData = new FormData();
      formData.append("token", "expired-token");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      expect(verifyMagicLinkFunctionMock).toHaveBeenCalledWith({
        token: "expired-token",
        ip_address: fakeIpData.ip_address,
        geo_data: fakeIpData.geo_data,
      });
      expect(result).toEqual({
        success: false,
        error: "Failed to verify magic link: Token has expired",
      });
    });

    it("should return success when token is valid", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("token", "valid-magic-link-token");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      expect(verifyMagicLinkFunctionMock).toHaveBeenCalledWith({
        token: "valid-magic-link-token",
        ip_address: fakeIpData.ip_address,
        geo_data: fakeIpData.geo_data,
      });
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle FormData with extra fields not in schema", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const formData = new FormData();
      formData.append("token", "valid-token");
      formData.append("extra", "field");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      // Extra fields should be stripped by schema validation
      expect(verifyMagicLinkFunctionMock).toHaveBeenCalledWith({
        token: "valid-token",
        ip_address: fakeIpData.ip_address,
        geo_data: fakeIpData.geo_data,
      });
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it("should return validation error when multiple token values are provided", async () => {
      const formData = new FormData();
      formData.append("token", "first-token");
      formData.append("token", "second-token");
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      // When multiple values exist, getFormData returns an array
      // But the schema expects a string, so validation should fail
      expect(verifyMagicLinkFunctionMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("token"),
      });
    });

    it("should handle long token strings", async () => {
      verifyMagicLinkFunctionMock.mockResolvedValue({
        success: true,
        error: null,
      });

      const longToken = "a".repeat(1000);
      const formData = new FormData();
      formData.append("token", longToken);
      formData.append("ip_address", fakeIpData.ip_address);
      formData.append("geo_data", JSON.stringify(fakeIpData.geo_data));

      const result = await verifyMagicLinkFormAction(null, formData);

      expect(verifyMagicLinkFunctionMock).toHaveBeenCalledWith({
        token: longToken,
        ip_address: fakeIpData.ip_address,
        geo_data: fakeIpData.geo_data,
      });
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });
  });
});
