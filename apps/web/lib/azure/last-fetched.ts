import { cookies } from "next/headers";

/**
 * Get the last fetched date for the given invoice name.
 * @param invoiceName - The invoice name.
 * @returns The last fetched date.
 */
export const getLastFetchedDate = async (invoiceName: string) => {
  const cookieStore = await cookies();
  const lastFetched =
    cookieStore.get(`last-fetched-invoice-${invoiceName}`)?.value || "";
  return lastFetched;
};
