import { describe, it, expect, vi, beforeEach } from "vitest";
import { logoutServerFunction } from "./logout.server.function";

const logoutFunctionMock = vi.hoisted(() => vi.fn());
vi.mock("./logout.function", async () => {
  const actual = await vi.importActual<typeof import("./logout.function")>(
    "./logout.function"
  );
  return {
    ...actual,
    logoutFunction: logoutFunctionMock,
  };
});

describe("Logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logoutServerFunction", () => {
    it("should validate the input and call the logoutFunction", async () => {
      logoutFunctionMock.mockResolvedValue(undefined);
      const result = await logoutServerFunction({ redirectTo: "/custom-path" });
      expect(result).toBeUndefined();
      expect(logoutFunctionMock).toHaveBeenCalledWith({
        redirectTo: "/custom-path",
      });
    });

    it("should return error when validation fails", async () => {
      logoutFunctionMock.mockResolvedValueOnce({
        success: false,
        error: "Invalid redirectTo",
      });
      const result = await logoutServerFunction({ redirectTo: "123" });
      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
    });
  });
});
