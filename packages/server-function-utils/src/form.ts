/**
 * Converts a FormData object to a plain object.
 * @param formData - The FormData object to convert.
 * @returns The plain object.
 */
export const getFormData = (formData: FormData) => {
  const data: Record<string, string | string[]> = {};

  formData.forEach((_, key) => {
    if (!(key in data)) {
      const values = formData.getAll(key);
      // If there's only one value, store it as string, otherwise as array
      data[key] =
        values.length === 1 ? (values[0] as string) : (values as string[]);
    }
  });

  return data;
};
