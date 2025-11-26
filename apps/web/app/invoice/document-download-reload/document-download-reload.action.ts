"use server";

import { withAuth } from "@/lib/auth";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

const reloadDocumentSearchActionSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

/**
 * Reload the document search for the given invoice ID. This will rerun the getAzureInvoiceDocumentFromAllBillingAccounts function and getTransactionByInvoiceFromAllBillingAccounts function.
 * @param invoiceId - The invoice ID to reload
 */
const _reloadDocumentSearchAction = async (
  data: z.infer<typeof reloadDocumentSearchActionSchema>
) => {
  const validatedData = reloadDocumentSearchActionSchema.safeParse(data);
  if (!validatedData.success) {
    return {
      success: false,
      error: validatedData.error.issues[0]?.message || "Invalid request",
    };
  }
  const { invoiceId } = validatedData.data;
  const cookieStore = await cookies();
  const now = new Date().toISOString();

  // Update the last-fetched-invoice cookie so that the Suspense's fallback in DocumentDownload will be shown again.
  cookieStore.set(`last-fetched-invoice-${invoiceId}`, now);

  // Rerun getAzureInvoiceDocumentFromAllBillingAccounts
  updateTag(`get-invoice-pdf-${invoiceId}`);

  // rerun getTransactionByInvoiceFromAllBillingAccounts
  updateTag(`get-transactions-${invoiceId}`);
};

export const reloadDocumentSearchAction = withAuth(_reloadDocumentSearchAction);
