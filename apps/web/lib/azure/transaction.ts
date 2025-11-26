import { getAzureAuthTokenGenerator } from "./azure-auth";
import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { retry } from "@/lib/retry";
import { billingAccountIds } from "./accounts";

// Azure Transactions -> Fields used for CSV export
// DATE,SERVICE PERIOD,TRANSACTION TYPE,PRODUCT FAMILY,PRODUCT TYPE,PRODUCT SKU,
// INVOICE SECTION,CHARGES/CREDITS CURRENCY,CHARGES/CREDITS
export const transactionItemSchema = z.object({
  properties: z.object({
    // DATE
    date: z.string().datetime(),
    // SERVICE PERIOD (compose from start and end)
    servicePeriodStartDate: z.string().datetime(),
    servicePeriodEndDate: z.string().datetime(),
    // TRANSACTION TYPE
    transactionType: z.string(),
    // PRODUCT FAMILY
    productFamily: z.string(),
    // PRODUCT TYPE
    productType: z.string(),
    // PRODUCT SKU (we use description for human-friendly SKU in CSV)
    productDescription: z.string(),
    // INVOICE SECTION
    invoiceSectionDisplayName: z.string(),
    // CHARGES/CREDITS CURRENCY and CHARGES/CREDITS
    subTotal: z.object({
      currency: z.string(),
      value: z.number(),
    }),
  }),
});

export const transactionsResponseSchema = z.object({
  totalCount: z.number(),
  value: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      properties: transactionItemSchema.shape.properties,
      type: z.string(),
    })
  ),
});

/**
 * Get the transactions by invoice from a single billing account.
 * @param invoiceName - The invoice name.
 * @param billingAccountId - The billing account ID.
 * @returns The transactions CSV string.
 */
async function getTransactionByInvoice(
  invoiceName: string,
  billingAccountId: string
) {
  const authHeaders = await getAzureAuthTokenGenerator();

  const transactionUrl = `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/invoices/${invoiceName}/transactions?api-version=2024-04-01`;

  const transactionResponse = await fetch(transactionUrl, {
    headers: authHeaders,
  });

  if (!transactionResponse.ok) {
    // console.error(await transactionResponse.text());
    throw new Error("Failed to get transaction response");
  }

  const transactionData = await transactionResponse.json();

  const validatedTransactions =
    await transactionsResponseSchema.safeParseAsync(transactionData);

  if (!validatedTransactions.success) {
    // console.error(validatedTransactions.error);
    throw new Error("Invalid transaction response data");
  }

  const csv = transactionsToCsv(validatedTransactions.data);
  return csv;
}

/**
 * Get the transactions by invoice from all billing accounts.
 * @param invoiceName - The invoice name.
 * @returns The transactions CSV string.
 */
export const getTransactionByInvoiceFromAllBillingAccounts = async (
  invoiceName: string
) => {
  "use cache: private";
  cacheTag(`get-transactions-${invoiceName}`);
  cacheLife({ stale: 60 * 60 * 24 }); // 24 hours

  const ids = billingAccountIds();
  const transactions = await Promise.allSettled(
    ids.map((id) => getTransactionByInvoice(invoiceName, id))
  );
  const successfulTransactions = transactions
    .filter((t) => t.status === "fulfilled")
    .map((t) => t.value);
  if (successfulTransactions.length > 0) {
    return successfulTransactions[0];
  }
  return null;
};

type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;

/**
 * Convert the transactions to a CSV string.
 * @param data - The transactions data.
 * @returns The CSV string.
 */
function transactionsToCsv(data: TransactionsResponse): string {
  const header = [
    "DATE",
    "SERVICE PERIOD",
    "TRANSACTION TYPE",
    "PRODUCT FAMILY",
    "PRODUCT TYPE",
    "PRODUCT SKU",
    "INVOICE SECTION",
    "CHARGES/CREDITS CURRENCY",
    "CHARGES/CREDITS",
  ];

  const lines: string[] = [];
  lines.push(header.join(","));

  for (const item of data.value) {
    const p = item.properties;

    const date = formatUsDate(p.date);
    const servicePeriod = `${formatUsDate(p.servicePeriodStartDate)} - ${formatUsDate(
      p.servicePeriodEndDate
    )}`;
    const transactionType = humanizeTransactionType(p.transactionType);
    const productFamily = p.productFamily;
    const productType = p.productType;
    const productSku = p.productDescription;
    const invoiceSection = p.invoiceSectionDisplayName;
    const currency = p.subTotal.currency;
    const amount = String(p.subTotal.value);

    const row = [
      date,
      servicePeriod,
      transactionType,
      productFamily,
      productType,
      productSku,
      invoiceSection,
      currency,
      amount,
    ].map(csvEscape);

    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Escape the value for CSV.
 * @param value - The value to escape.
 * @returns The escaped value.
 */
function csvEscape(value: string): string {
  const needsQuoting = /[",\n]/.test(value) || value.trim() !== value;
  const escaped = value.replaceAll('"', '""');
  return needsQuoting ? `"${escaped}"` : `"${escaped}"`;
}

/**
 * Format the date in the format of MM/DD/YYYY.
 * @param isoString - The ISO string.
 * @returns The formatted date.
 */
function formatUsDate(isoString: string): string {
  const d = new Date(isoString);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Humanize the transaction type.
 * @param value - The transaction type.
 * @returns The humanized transaction type.
 */
function humanizeTransactionType(value: string): string {
  switch (value) {
    case "cycleCharge":
      return "Monthly payment";
    case "purchase":
      return "Purchase";
    case "refund":
      return "Refund";
    default:
      return value;
  }
}
