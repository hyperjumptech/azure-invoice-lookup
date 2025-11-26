import { getAzureAuthTokenGenerator } from "./azure-auth";
import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { retry } from "@/lib/retry";
import { billingAccountIds } from "./accounts";
import { getSessionEmail } from "../auth";
import { logActivity } from "../log-activity";

const invoiceSchema = z.object({
  properties: z.object({
    documents: z.array(
      z.object({
        kind: z.string(),
        name: z.string(),
        source: z.string(),
      })
    ),
  }),
});

const documentResponseSchema = z.object({
  expiryTime: z.string().datetime().optional(),
  url: z.string().url(),
});

/**
 * Get the invoice document from a single billing account.
 * @param invoiceName - The invoice name.
 * @param billingAccountId - The billing account ID.
 * @returns The invoice document URL.
 */
async function getAzureInvoiceDocument(
  invoiceName: string,
  billingAccountId: string
) {
  const authHeaders = await getAzureAuthTokenGenerator();

  const invoiceUrl = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/invoices/${invoiceName}?api-version=2024-04-01`;

  const invoiceResponse = await fetch(invoiceUrl, { headers: authHeaders });

  if (!invoiceResponse.ok) {
    // console.error(await invoiceResponse.text());
    throw new Error("Failed to get invoice response");
  }

  const invoiceData = await invoiceResponse.json();

  const parsedInvoice = await invoiceSchema.safeParseAsync(invoiceData);

  if (!parsedInvoice.success) {
    // console.error(parsedInvoice.error);
    throw new Error("Invalid invoice data");
  }

  const doc = parsedInvoice.data!.properties.documents.find(
    (d) => d.kind.toLowerCase() === "invoice"
  );

  if (!doc) {
    throw new Error("Invoice document not found");
  }

  const documentUrl = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/invoices/${invoiceName}/download?api-version=2024-04-01`;

  const documentResponse = await fetch(documentUrl, {
    headers: authHeaders,
    method: "POST",
  });

  if (!documentResponse.ok) {
    // console.error(await documentResponse.text());
    throw new Error("Failed to get document response");
  }

  // Azure returns 202 Accepted with an empty body and a Location header
  // for long-running operations. We must poll the Location until it
  // returns 200 with the payload containing the download URL.
  const pollLocation = documentResponse.headers.get("location");
  if (documentResponse.status === 202 && pollLocation) {
    // Validate pollLocation is a valid URL
    try {
      new URL(pollLocation);
    } catch {
      throw new Error(
        `Invalid poll location URL received from Azure: ${pollLocation}`
      );
    }

    const maxAttempts = 18; // allow a bit longer to account for eventual consistency
    const maxConsecutive404s = 5; // If we get too many 404s, the operation likely doesn't exist
    let attempt = 0;
    let lastResponse: Response | null = null;
    let consecutiveNotFound = 0;

    while (attempt < maxAttempts) {
      // Only apply retry-after delay if:
      // 1. This is not the first attempt (attempt > 0)
      // 2. The last response was not a 404 (we already backed off for 404s)
      if (attempt > 0 && lastResponse?.status !== 404) {
        // Respect server-provided Retry-After seconds if present
        const retryAfterHeader =
          lastResponse?.headers.get("retry-after") ??
          documentResponse.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader
          ? Number(retryAfterHeader)
          : 10;
        const delayMs = Number.isFinite(retryAfterSeconds)
          ? retryAfterSeconds * 1000
          : 5000;

        await new Promise((r) => setTimeout(r, delayMs));
      }

      lastResponse = await fetch(pollLocation, { headers: authHeaders });
      if (lastResponse.status === 200) {
        const data = await lastResponse.json();
        const parsed = await documentResponseSchema.safeParseAsync(data);
        if (!parsed.success) {
          // console.error(parsed.error);
          throw new Error("Invalid document response data");
        }
        return parsed.data!;
      }

      // Azure can intermittently return 404 for the poll URL while the
      // document becomes available. Treat 404 as a transient condition
      // and continue polling with a small exponential backoff.
      if (lastResponse.status === 404) {
        consecutiveNotFound += 1;

        // If we get too many consecutive 404s, the operation likely doesn't exist
        // or the location URL is invalid. Fail fast instead of polling indefinitely.
        if (consecutiveNotFound >= maxConsecutive404s) {
          const errorBody = await lastResponse.text().catch(() => "");
          throw new Error(
            `Poll location returned 404 ${maxConsecutive404s} times consecutively. The operation may not exist or the location URL may be invalid. Location: ${pollLocation.substring(0, 100)}...${errorBody ? ` Response: ${errorBody.substring(0, 200)}` : ""}`
          );
        }

        const backoffMs = Math.min(
          15000,
          500 * Math.pow(2, Math.max(0, consecutiveNotFound - 1))
        );
        console.warn(
          `Poll returned 404 (attempt ${attempt + 1}/${maxAttempts}, consecutive 404s: ${consecutiveNotFound}/${maxConsecutive404s}). Backing off for ${Math.round(
            backoffMs / 1000
          )}s and retrying...`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
        attempt += 1;
        continue;
      }

      // Reset 404 counter on any different status
      if (consecutiveNotFound > 0 && lastResponse.status !== 404) {
        consecutiveNotFound = 0;
      }

      if (lastResponse.status !== 202) {
        // Any non-202/200 response is unexpected; surface details
        // console.error(
        //   `Unexpected polling status: ${lastResponse.status} ${lastResponse.statusText}`
        // );
        // console.error(await lastResponse.text());
        throw new Error("Failed while polling invoice document generation");
      }

      attempt += 1;
    }

    throw new Error("Timed out waiting for invoice document to be ready");
  } else {
    const data = await documentResponse.json();
    const parsed = await documentResponseSchema.safeParseAsync(data);
    if (!parsed.success) {
      // console.error(parsed.error);
      throw new Error("Invalid document response data");
    }
    return parsed.data!;
  }
}

/**
 * Get the invoice document from all billing accounts.
 * @param invoiceName - The invoice name.
 * @returns The invoice document URL.
 */
export const getAzureInvoiceDocumentFromAllBillingAccounts = async (
  invoiceName: string
) => {
  "use cache: private";
  cacheTag(`get-invoice-pdf-${invoiceName}`);
  cacheLife({ stale: 60 * 60 * 24 }); // 24 hours

  const ids = billingAccountIds();

  const invoices = await Promise.allSettled(
    ids.map((id) => retry(() => getAzureInvoiceDocument(invoiceName, id), 3))
  );

  const successfulInvoices = invoices
    .filter((i) => i.status === "fulfilled")
    .map((i) => i.value);

  if (successfulInvoices.length > 0) {
    // track activity
    try {
      const email = await getSessionEmail();
      if (email) {
        await logActivity(
          "search-invoice",
          {
            email,
            ipAddress: "",
            geoData: {},
          },
          {
            email,
            invoiceName,
            invoice: successfulInvoices[0],
          }
        );
      }
    } catch (error) {
      console.error("Error logging activity", error);
    }

    return successfulInvoices[0];
  }

  return null;
};
