import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  InvoiceLinkFetcher,
  ReloadButton,
  TransactionsLinkFetcher,
} from "./document-download-with-reload.client";
import { getLastFetchedDate } from "@/lib/azure/last-fetched";
import { getAzureInvoiceDocumentFromAllBillingAccounts } from "@/lib/azure/invoice";
import { getTransactionByInvoiceFromAllBillingAccounts } from "@/lib/azure/transaction";

/**
 * This RSC initiates the fetching of the invoice and transactions and stream the results to the corresponding components.
 * @param invoiceId - The invoice ID.
 * @returns A div with the invoice download with reload functionality.
 */
export const DocumentDownload = async ({
  invoiceId,
}: {
  invoiceId: string;
}) => {
  // The lastFetched is used as a key for the Suspense's fallback in the InvoiceLinkFetcher and TransactionsLinkFetcher. So when the lastFetched changes, the Suspense's fallback will be shown again.
  const lastFetched = await getLastFetchedDate(invoiceId);

  // Initiate the fetching of the invoice. Note that we don't await the result here.
  const invoicePdfFetcher =
    getAzureInvoiceDocumentFromAllBillingAccounts(invoiceId);

  // Initiate the fetching of the transactions. Note that we don't await the result here.
  const transactionsFetcher =
    getTransactionByInvoiceFromAllBillingAccounts(invoiceId);
  return (
    <div className="flex flex-col gap-2 p-4 bg-muted/50 border border-border shadow-md rounded-md">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-muted-foreground">Invoice</span>
          <h2 className="text-lg font-bold">{invoiceId}</h2>
        </div>
        <Suspense key={lastFetched} fallback={<Loading />}>
          <ReloadButton
            invoiceId={invoiceId}
            invoiceFetcher={invoicePdfFetcher}
            transactionsFetcher={transactionsFetcher}
          />
        </Suspense>
      </div>
      <ErrorBoundary>
        <Suspense key={lastFetched} fallback={<Loading />}>
          <InvoiceLinkFetcher
            invoiceId={invoiceId}
            dataFetcher={invoicePdfFetcher}
          />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense key={lastFetched} fallback={<Loading />}>
          <TransactionsLinkFetcher
            invoiceId={invoiceId}
            dataFetcher={transactionsFetcher}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

const Loading = () => {
  return (
    <div className="px-4 py-2 bg-muted text-muted-foreground rounded-md">
      Loading...
    </div>
  );
};
