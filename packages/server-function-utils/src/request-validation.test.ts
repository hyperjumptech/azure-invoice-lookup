import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { withRequestValidation } from "./request-validation";

describe("withRequestValidation", () => {
  describe("single argument validation", () => {
    it("should validate and pass a single valid argument to the function", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction({ name: "John", age: 30 });

      expect(mockFunction).toHaveBeenCalledWith({ name: "John", age: 30 });
      expect(result).toEqual({ success: true });
    });

    it("should return validation error for invalid single argument", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const mockFunction = vi.fn();
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction({ name: "John", age: "invalid" });

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("number"),
      });
    });

    it("should return validation error when required fields are missing", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const mockFunction = vi.fn();
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction({ name: "John" });

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("age"),
      });
    });
  });

  describe("multiple arguments validation", () => {
    it("should validate and pass multiple valid arguments as an array", async () => {
      const schema = z.tuple([z.string(), z.number(), z.boolean()]);

      const mockFunction = vi.fn().mockResolvedValue({ result: "success" });
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction("test", 42, true);

      expect(mockFunction).toHaveBeenCalledWith("test", 42, true);
      expect(result).toEqual({ result: "success" });
    });

    it("should return validation error for invalid multiple arguments", async () => {
      const schema = z.tuple([z.string(), z.number(), z.boolean()]);

      const mockFunction = vi.fn();
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction("test", "invalid", true);

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("number"),
      });
    });

    it("should return validation error when argument count doesn't match tuple", async () => {
      const schema = z.tuple([z.string(), z.number()]);

      const mockFunction = vi.fn();
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction("test");

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.any(String),
      });
    });
  });

  describe("function return value handling", () => {
    it("should return the original function's return value on success", async () => {
      const schema = z.object({ value: z.string() });
      const returnValue = { data: "test", status: 200 };

      const mockFunction = vi.fn().mockResolvedValue(returnValue);
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction({ value: "test" });

      expect(result).toEqual(returnValue);
    });

    it("should handle async function errors", async () => {
      const schema = z.object({ value: z.string() });
      const error = new Error("Function error");

      const mockFunction = vi.fn().mockRejectedValue(error);
      const validatedFunction = withRequestValidation(mockFunction, schema);

      await expect(validatedFunction({ value: "test" })).rejects.toThrow(
        "Function error"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty object schema", async () => {
      const schema = z.object({});
      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction({});

      expect(mockFunction).toHaveBeenCalledWith({});
      expect(result).toEqual({ success: true });
    });

    it("should handle nested object validation", async () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            age: z.number(),
          }),
        }),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction({
        user: { name: "John", profile: { age: 30 } },
      });

      expect(mockFunction).toHaveBeenCalledWith({
        user: { name: "John", profile: { age: 30 } },
      });
      expect(result).toEqual({ success: true });
    });

    it("should handle array schema validation", async () => {
      const schema = z.array(z.string());
      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction(["a", "b", "c"]);

      expect(mockFunction).toHaveBeenCalledWith(["a", "b", "c"]);
      expect(result).toEqual({ success: true });
    });

    it("should handle optional fields in schema", async () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const validatedFunction = withRequestValidation(mockFunction, schema);

      const result = await validatedFunction({ required: "test" });

      expect(mockFunction).toHaveBeenCalledWith({ required: "test" });
      expect(result).toEqual({ success: true });
    });
  });
});
