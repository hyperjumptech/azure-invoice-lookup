# @workspace/form-actions

A package providing utilities for creating form actions with request validation in Next.js applications.

## Features

- **`createFormAction`**: Higher-order function that creates a form action with automatic FormData parsing and validation
- **`withRequestValidation`**: Higher-order function that validates function arguments using Zod schemas
- **`getFormData`**: Utility function to convert FormData to a plain object

## Installation

This is a workspace package. It's automatically available to other packages in the monorepo.

## Usage

### createFormAction

Creates a form action that validates FormData using a Zod schema:

```ts
import { createFormAction } from "@workspace/form-actions";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

const myFunction = async (data: { name: string; age: number }) => {
  // Use validated data here
  return { success: true };
};

export const myFormAction = createFormAction(myFunction, schema);
```

### withRequestValidation

Validates function arguments using a Zod schema:

```ts
import { withRequestValidation } from "@workspace/form-actions";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

const myFunction = async (data: { name: string; age: number }) => {
  return { success: true };
};

export const validatedFunction = withRequestValidation(myFunction, schema);
```

### getFormData

Converts FormData to a plain object:

```ts
import { getFormData } from "@workspace/form-actions";

const formData = new FormData();
formData.append("name", "John");
formData.append("age", "30");

const data = getFormData(formData);
// { name: "John", age: "30" }
```

## Exports

- `createFormAction` - Main export for creating form actions
- `withRequestValidation` - Main export for validating function arguments
- `getFormData` - Utility for converting FormData to objects

You can also import from specific paths:
- `@workspace/form-actions/create-form-action`
- `@workspace/form-actions/request-validation`
- `@workspace/form-actions/form`

