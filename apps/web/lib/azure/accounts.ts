import { getAzureAuthTokenGenerator } from "./azure-auth";
import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";

/**
 * Get the billing account IDs from the environment variables.
 * @returns The billing account IDs.
 */
export const billingAccountIds = () => {
  const { AZURE_BILLING_ACCOUNT_ID } = process.env;
  if (!AZURE_BILLING_ACCOUNT_ID) {
    throw new Error(
      "AZURE_BILLING_ACCOUNT_ID is not set. Set it in the environment variables. Multiple IDs can be separated by commas."
    );
  }
  const ids = AZURE_BILLING_ACCOUNT_ID?.split(",");
  return ids;
};

/**
 * The schema for the billing account.
 * @returns The billing account schema.
 */
export const billingAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  properties: z.object({
    accountStatus: z.string(),
    accountType: z.string(),
    accountSubType: z.string(),
    agreementType: z.string(),
    displayName: z.string(),
    hasReadAccess: z.boolean(),
    primaryBillingTenantId: z.string(),
  }),
});

/**
 * Get the billing accounts from the billing accounts.
 * @param ids - The billing account IDs.
 * @returns The billing accounts.
 */
export const getBillingAccounts = async (ids: string[]) => {
  "use cache: private";
  cacheTag(`get-billing-accounts`);
  cacheLife({ stale: 60 * 60 * 24 }); // 24 hours
  const authHeaders = await getAzureAuthTokenGenerator();
  const billingAccountResponses = await Promise.all(
    ids.map((id) =>
      fetch(
        `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${id}?api-version=2024-04-01`,
        { headers: authHeaders }
      )
    )
  );
  const billingAccounts = await Promise.all(
    billingAccountResponses.map((response) => response.json())
  );
  const validatedBillingAccounts = await billingAccountSchema
    .array()
    .safeParseAsync(billingAccounts);
  if (!validatedBillingAccounts.success) {
    throw new Error("Invalid billing accounts data");
  }
  return validatedBillingAccounts.data;
};

/**
 * Get the billing account names from the billing accounts.
 * @param ids - The billing account IDs.
 * @returns The billing account names.
 */
export const getBillingAccountNames = async (ids: string[]) => {
  const accounts = await getBillingAccounts(ids);
  return accounts.map((account) => account.properties.displayName);
};
