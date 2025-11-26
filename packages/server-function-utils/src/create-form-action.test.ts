import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { createFormAction } from "./create-form-action";

describe("createFormAction", () => {
  describe("successful form action execution", () => {
    it("should create a form action that validates and calls the function with valid FormData", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.string().transform((val) => Number(val)),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("name", "John");
      formData.append("age", "30");

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({
        name: "John",
        age: 30,
      });
      expect(result).toEqual({ success: true });
    });

    it("should handle single field FormData", async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("email", "test@example.com");

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(result).toEqual({ success: true });
    });

    it("should handle multiple values for the same field as an array", async () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("tags", "tag1");
      formData.append("tags", "tag2");
      formData.append("tags", "tag3");

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({
        tags: ["tag1", "tag2", "tag3"],
      });
      expect(result).toEqual({ success: true });
    });

    it("should preserve previous state parameter even though it's not used", async () => {
      const schema = z.object({
        value: z.string(),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("value", "test");

      const previousState = { some: "state" };
      const result = await formAction(previousState, formData);

      expect(result).toEqual({ success: true });
    });
  });

  describe("validation errors", () => {
    it("should return validation error for invalid FormData", async () => {
      const schema = z.object({
        name: z.string(),
        age: z
          .string()
          .transform((val) => Number(val))
          .refine((val) => !Number.isNaN(val), {
            message: "Expected number",
          }),
      });

      const mockFunction = vi.fn();
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("name", "John");
      formData.append("age", "not-a-number");

      const result = await formAction(null, formData);

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("Expected number"),
      });
    });

    it("should return validation error when required fields are missing", async () => {
      const schema = z.object({
        name: z.string(),
        age: z.string(),
      });

      const mockFunction = vi.fn();
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("name", "John");

      const result = await formAction(null, formData);

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("age"),
      });
    });

    it("should return validation error for empty FormData", async () => {
      const schema = z.object({
        name: z.string(),
      });

      const mockFunction = vi.fn();
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();

      const result = await formAction(null, formData);

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("name"),
      });
    });

    it("should return validation error for invalid email format", async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const mockFunction = vi.fn();
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("email", "not-an-email");

      const result = await formAction(null, formData);

      expect(mockFunction).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("email"),
      });
    });
  });

  describe("function return value handling", () => {
    it("should return the original function's return value on success", async () => {
      const schema = z.object({ value: z.string() });
      const returnValue = { data: "test", status: 200 };

      const mockFunction = vi.fn().mockResolvedValue(returnValue);
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("value", "test");

      const result = await formAction(null, formData);

      expect(result).toEqual(returnValue);
    });

    it("should handle async function errors", async () => {
      const schema = z.object({ value: z.string() });
      const error = new Error("Function error");

      const mockFunction = vi.fn().mockRejectedValue(error);
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("value", "test");

      await expect(formAction(null, formData)).rejects.toThrow(
        "Function error"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty object schema", async () => {
      const schema = z.object({});
      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({});
      expect(result).toEqual({ success: true });
    });

    it("should handle array schema validation", async () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("items", "item1");
      formData.append("items", "item2");

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({
        items: ["item1", "item2"],
      });
      expect(result).toEqual({ success: true });
    });

    it("should handle optional fields in schema", async () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("required", "test");

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({ required: "test" });
      expect(result).toEqual({ success: true });
    });

    it("should handle FormData with extra fields not in schema", async () => {
      const schema = z.object({
        name: z.string(),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("name", "John");
      formData.append("extra", "field");

      const result = await formAction(null, formData);

      // Extra fields should be stripped by schema validation
      expect(mockFunction).toHaveBeenCalledWith({ name: "John" });
      expect(result).toEqual({ success: true });
    });

    it("should handle boolean values from FormData", async () => {
      const schema = z.object({
        active: z.string().transform((val) => val === "true"),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("active", "true");

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({ active: true });
      expect(result).toEqual({ success: true });
    });

    it("should handle numeric string transformation", async () => {
      const schema = z.object({
        count: z.string().transform((val) => Number(val)),
        price: z.string().transform((val) => parseFloat(val)),
      });

      const mockFunction = vi.fn().mockResolvedValue({ success: true });
      const formAction = createFormAction(mockFunction, schema);

      const formData = new FormData();
      formData.append("count", "42");
      formData.append("price", "19.99");

      const result = await formAction(null, formData);

      expect(mockFunction).toHaveBeenCalledWith({
        count: 42,
        price: 19.99,
      });
      expect(result).toEqual({ success: true });
    });
  });
});
