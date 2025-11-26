import { describe, it, expect } from "vitest";
import { getFormData } from "./form";

describe("getFormData", () => {
  describe("single value fields", () => {
    it("should convert FormData with single value to string", () => {
      const formData = new FormData();
      formData.append("name", "John");

      const result = getFormData(formData);

      expect(result).toEqual({ name: "John" });
      expect(typeof result.name).toBe("string");
    });

    it("should handle multiple fields with single values", () => {
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("email", "john@example.com");
      formData.append("age", "30");

      const result = getFormData(formData);

      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
        age: "30",
      });
      expect(typeof result.name).toBe("string");
      expect(typeof result.email).toBe("string");
      expect(typeof result.age).toBe("string");
    });

    it("should handle empty string values", () => {
      const formData = new FormData();
      formData.append("field", "");

      const result = getFormData(formData);

      expect(result).toEqual({ field: "" });
      expect(typeof result.field).toBe("string");
    });
  });

  describe("multiple value fields", () => {
    it("should convert FormData with multiple values for same key to array", () => {
      const formData = new FormData();
      formData.append("tags", "tag1");
      formData.append("tags", "tag2");
      formData.append("tags", "tag3");

      const result = getFormData(formData);

      expect(result).toEqual({ tags: ["tag1", "tag2", "tag3"] });
      expect(Array.isArray(result.tags)).toBe(true);
    });

    it("should handle multiple values with empty strings", () => {
      const formData = new FormData();
      formData.append("items", "item1");
      formData.append("items", "");
      formData.append("items", "item2");

      const result = getFormData(formData);

      expect(result).toEqual({ items: ["item1", "", "item2"] });
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should handle duplicate values", () => {
      const formData = new FormData();
      formData.append("colors", "red");
      formData.append("colors", "red");
      formData.append("colors", "blue");

      const result = getFormData(formData);

      expect(result).toEqual({ colors: ["red", "red", "blue"] });
      expect(Array.isArray(result.colors)).toBe(true);
    });
  });

  describe("mixed single and multiple value fields", () => {
    it("should handle both single and multiple value fields correctly", () => {
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("tags", "tag1");
      formData.append("tags", "tag2");
      formData.append("email", "john@example.com");

      const result = getFormData(formData);

      expect(result).toEqual({
        name: "John",
        tags: ["tag1", "tag2"],
        email: "john@example.com",
      });
      expect(typeof result.name).toBe("string");
      expect(Array.isArray(result.tags)).toBe(true);
      expect(typeof result.email).toBe("string");
    });

    it("should handle multiple fields where some have multiple values", () => {
      const formData = new FormData();
      formData.append("single1", "value1");
      formData.append("multiple", "a");
      formData.append("multiple", "b");
      formData.append("single2", "value2");
      formData.append("multiple2", "x");
      formData.append("multiple2", "y");
      formData.append("multiple2", "z");

      const result = getFormData(formData);

      expect(result).toEqual({
        single1: "value1",
        multiple: ["a", "b"],
        single2: "value2",
        multiple2: ["x", "y", "z"],
      });
      expect(typeof result.single1).toBe("string");
      expect(Array.isArray(result.multiple)).toBe(true);
      expect(typeof result.single2).toBe("string");
      expect(Array.isArray(result.multiple2)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should return empty object for empty FormData", () => {
      const formData = new FormData();

      const result = getFormData(formData);

      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it("should handle special characters in values", () => {
      const formData = new FormData();
      formData.append("text", "Hello & World!");
      formData.append("special", "test@#$%^&*()");

      const result = getFormData(formData);

      expect(result).toEqual({
        text: "Hello & World!",
        special: "test@#$%^&*()",
      });
    });

    it("should handle unicode characters", () => {
      const formData = new FormData();
      formData.append("unicode", "你好世界");
      formData.append("emoji", "🎉");

      const result = getFormData(formData);

      expect(result).toEqual({
        unicode: "你好世界",
        emoji: "🎉",
      });
    });

    it("should handle numeric strings", () => {
      const formData = new FormData();
      formData.append("number", "123");
      formData.append("decimal", "45.67");

      const result = getFormData(formData);

      expect(result).toEqual({
        number: "123",
        decimal: "45.67",
      });
      expect(typeof result.number).toBe("string");
      expect(typeof result.decimal).toBe("string");
    });

    it("should handle whitespace-only values", () => {
      const formData = new FormData();
      formData.append("space", " ");
      formData.append("tab", "\t");
      formData.append("newline", "\n");

      const result = getFormData(formData);

      expect(result).toEqual({
        space: " ",
        tab: "\t",
        newline: "\n",
      });
    });

    it("should handle very long values", () => {
      const longValue = "a".repeat(10000);
      const formData = new FormData();
      formData.append("long", longValue);

      const result = getFormData(formData);

      expect(result).toEqual({ long: longValue });
      expect(result.long).toHaveLength(10000);
    });

    it("should handle field names with special characters", () => {
      const formData = new FormData();
      formData.append("field-name", "value1");
      formData.append("field_name", "value2");
      formData.append("field.name", "value3");

      const result = getFormData(formData);

      expect(result).toEqual({
        "field-name": "value1",
        field_name: "value2",
        "field.name": "value3",
      });
    });
  });

  describe("type safety", () => {
    it("should return Record<string, string | string[]> type", () => {
      const formData = new FormData();
      formData.append("single", "value");
      formData.append("multiple", "a");
      formData.append("multiple", "b");

      const result = getFormData(formData);

      // Type check: result should be Record<string, string | string[]>
      expect(result).toBeDefined();
      expect(typeof result.single).toBe("string");
      expect(Array.isArray(result.multiple)).toBe(true);
    });

    it("should correctly type single value as string", () => {
      const formData = new FormData();
      formData.append("single", "test");

      const result = getFormData(formData);

      // Type assertion: single value should be string, not array
      expect(result.single).toBe("test");
      expect(Array.isArray(result.single)).toBe(false);
    });

    it("should correctly type multiple values as string array", () => {
      const formData = new FormData();
      formData.append("multiple", "a");
      formData.append("multiple", "b");

      const result = getFormData(formData);

      // Type assertion: multiple values should be array, not string
      expect(Array.isArray(result.multiple)).toBe(true);
      expect(result.multiple).toEqual(["a", "b"]);
    });
  });
});
