import * as React from "react";
import { Button } from "@workspace/ui/components/button";

/**
 * This component renders the invoice lookup form. On submit, it simply adds the invoice ID to the URL as a query parameter. This invoice id changes will trigger the Result RSC in page.tsx to re-render.
 * The text area is used to input the invoice ID(s) separated by newlines.
 * @param invoiceId - The invoice ID.
 * @returns A div with the invoice lookup form.
 */
export const InvoiceLookupForm = ({ invoiceId }: { invoiceId: string }) => {
  return (
    <div>
      <form className="flex flex-col gap-4" method="GET" autoComplete="off">
        <label htmlFor="invoiceId" className="font-medium">
          Invoice Number(s){" "}
          <span className="text-xs text-muted-foreground">(one per line)</span>
        </label>
        <textarea
          id="invoiceId"
          name="invoiceId"
          className="border border-input bg-background text-foreground rounded p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          minLength={4}
          rows={4}
          defaultValue={invoiceId}
          required
          placeholder="e.g. G1234567"
          autoCorrect="off"
          autoCapitalize="off"
          autoFocus
        />
        <Button type="submit" variant="default">
          Find Invoices
        </Button>
      </form>
    </div>
  );
};
