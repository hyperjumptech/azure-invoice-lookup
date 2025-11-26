import { InvoiceLookupForm } from "./invoice-lookup-form";
import { DocumentDownload } from "./document-download-reload/document-download-with-reload";
import { Suspense } from "react";
import { withAuthGuard } from "@/lib/auth-guard";

/**
 * This page renders the invoice lookup form and the result.
 * @param searchParams - The search params.
 * @returns A div with the invoice lookup form and the result.
 */
const InvoicePage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ invoiceId: string }>;
}) => {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 w-full mx-auto p-4 max-w-7xl">
      <div className="flex max-w-sm w-full flex-col p-6 space-y-4 bg-card text-card-foreground rounded-md border border-border shadow-md">
        <h1 className="text-xl font-bold mb-4">Find Azure Invoice</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <LookupForm searchParams={searchParams} />
        </Suspense>
      </div>
      <div className="flex-1">
        <Suspense fallback={<div>Loading...</div>}>
          <Result searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
};

/**
 * This RSC determines the invoice ID from the search params and renders the invoice lookup form.
 * @param searchParams - The search params.
 * @returns A div with the invoice lookup form.
 */
const LookupForm = async ({
  searchParams,
}: {
  searchParams?: Promise<{ invoiceId: string }>;
}) => {
  const { invoiceId } = (await searchParams) ?? {};

  return <InvoiceLookupForm invoiceId={invoiceId ?? ""} />;
};

/**
 * This RSC determines the invoice IDs from the search params and renders the invoice download components.
 * @param searchParams - The search params.
 * @returns A div with the invoice download components.
 */
const Result = async ({
  searchParams,
}: {
  searchParams?: Promise<{ invoiceId: string }>;
}) => {
  const { invoiceId } = (await searchParams) ?? {};
  const ids = parseInvoiceId(invoiceId ?? "");

  return (
    <div className="flex flex-col gap-4">
      {ids && ids.length > 0 && (
        <h2 className="text-lg font-bold sm:hidden">Invoices</h2>
      )}
      <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-4">
        {ids && ids.length > 0 && (
          <>
            {ids.map((id) => (
              <DocumentDownload key={id} invoiceId={id} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Parse the invoice ID into an array of invoice IDs without duplicates.
 * @param invoiceId - The invoice ID string with one or more invoice IDs separated by newlines.
 * @returns An array of invoice IDs.
 */
const parseInvoiceId = (invoiceId: string) => {
  const members = invoiceId.split("\n");
  return Array.from(
    new Set(
      members
        .map((member) => member.trim())
        .filter((member) => member.length > 0)
    )
  );
};

/**
 * Wrap the InvoicePage with the auth guard.
 */
export default withAuthGuard(InvoicePage);
