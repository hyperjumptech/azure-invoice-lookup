"use client";
import { use, useTransition } from "react";
import { FileText } from "lucide-react";
import { reloadDocumentSearchAction } from "./document-download-reload.action";
import { getTransactionByInvoiceFromAllBillingAccounts } from "@/lib/azure/transaction";
import { TransactionsLinkDownloadWithHandler } from "./transaction-link-url";
import { getAzureInvoiceDocumentFromAllBillingAccounts } from "@/lib/azure/invoice";

/**
 * NotFound component to render when a resource is not found. In this case, it's when the invoice or transactions are not found.
 * @param children - The children to render.
 * @returns A div with the children and a border and background color.
 */
const NotFound = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-4 py-2 bg-destructive/10 text-destructive-foreground rounded-md border border-destructive/20 text-sm">
      {children}
    </div>
  );
};

/**
 * This component acts as a data loader for the invoice. It waits for the data to arrive and then renders the invoice link.
 * @param dataFetcher - The data fetcher to fetch the invoice.
 * @param invoiceId - The invoice ID.
 * @returns An invoice link when the invoice is found or a not found message.
 */
export const InvoiceLinkFetcher = ({
  dataFetcher,
}: {
  invoiceId: string;
  dataFetcher: ReturnType<typeof getAzureInvoiceDocumentFromAllBillingAccounts>;
}) => {
  const invoice = use(dataFetcher);

  if (!invoice) {
    return <NotFound>Invoice not found.</NotFound>;
  }

  return <InvoiceLinkUrl>{invoice.url}</InvoiceLinkUrl>;
};

/**
 * This component renders a link to the invoice PDF.
 * @param children - The children to render.
 * @returns A link to the invoice PDF.
 */
const InvoiceLinkUrl = ({ children }: { children: string }) => {
  return (
    <a
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2 text-sm"
      href={children}
      target="_blank"
      rel="noopener noreferrer"
    >
      <FileText className="h-4 w-4" />
      Download Invoice PDF
    </a>
  );
};

/**
 * This component acts as a data loader for the transactions. It waits for the data to arrive and then renders the transactions link.
 * @param invoiceId - The invoice ID.
 * @param dataFetcher - The data fetcher to fetch the transactions.
 * @returns A transactions link when the transactions are found or a not found message.
 */
export const TransactionsLinkFetcher = ({
  invoiceId,
  dataFetcher,
}: {
  invoiceId: string;
  dataFetcher: ReturnType<typeof getTransactionByInvoiceFromAllBillingAccounts>;
}) => {
  const transactions = use(dataFetcher);

  if (!transactions) {
    return <NotFound>Transactions not found.</NotFound>;
  }

  return (
    <TransactionsLinkDownloadWithHandler
      transactions={transactions}
      invoiceId={invoiceId}
    />
  );
};

/**
 * This component renders a button to reload the invoice and transactions.
 * @param invoiceFetcher - The data fetcher to fetch the invoice.
 * @param transactionsFetcher - The data fetcher to fetch the transactions.
 * @param invoiceId - The invoice ID.
 * @returns A button to reload the invoice and transactions.
 */
export const ReloadButton = ({
  invoiceFetcher,
  transactionsFetcher,
  invoiceId,
}: {
  invoiceFetcher: ReturnType<
    typeof getAzureInvoiceDocumentFromAllBillingAccounts
  >;
  transactionsFetcher: ReturnType<
    typeof getTransactionByInvoiceFromAllBillingAccounts
  >;
  invoiceId: string;
}) => {
  const invoice = use(invoiceFetcher);
  const transactions = use(transactionsFetcher);
  const [isLoading, startTransition] = useTransition();

  if (invoice && transactions) {
    return null;
  }

  return (
    <button
      disabled={isLoading}
      onClick={() => {
        startTransition(() => {
          reloadDocumentSearchAction({ invoiceId });
        });
      }}
      className="px-4 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Reload
    </button>
  );
};
