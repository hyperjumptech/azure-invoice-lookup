"use client";

import { useCallback } from "react";
import { FileDown } from "lucide-react";

/**
 * This component renders a button to download the transactions CSV.
 * @param onClick - The onClick handler.
 * @returns A button to download the transactions CSV.
 */
export const TransactionsLinkUrl = ({
  onClick,
}: {
  children: string;
  onClick: () => void;
}) => {
  return (
    <button
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer text-left hover:opacity-90 transition-opacity inline-flex items-center gap-2 text-sm"
      onClick={onClick}
    >
      <FileDown className="h-4 w-4" />
      Download Transactions CSV
    </button>
  );
};

/**
 * This component renders the TransactionsLinkUrl component and handles the click event to download the transactions CSV.
 * @param transactions - The transactions CSV string.
 * @param invoiceId - The invoice ID.
 * @returns A div with the TransactionsLinkUrl component and the onClick handler.
 */
export const TransactionsLinkDownloadWithHandler = ({
  transactions,
  invoiceId,
}: {
  transactions: string;
  invoiceId: string;
}) => {
  const handleDownloadCsv = useCallback(() => {
    if (!transactions) return;
    const csvContent = transactions;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeInvoice = invoiceId || "invoice";
    link.download = `${safeInvoice}-transactions.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [transactions, invoiceId]);

  return (
    <TransactionsLinkUrl onClick={handleDownloadCsv}>
      {transactions}
    </TransactionsLinkUrl>
  );
};
