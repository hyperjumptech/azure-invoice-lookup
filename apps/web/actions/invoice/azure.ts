import { ClientSecretCredential } from "@azure/identity";

// Robust Azure Billing invoice lookup supporting multiple scopes and API versions.
export async function getAzureInvoiceDownloadLinks(
  invoiceQuery: string
): Promise<{ pdfUrl: string; csvUrl: string } | null> {
  const {
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
    AZURE_BILLING_ACCOUNT_ID,
  } = process.env;

  if (
    !AZURE_TENANT_ID ||
    !AZURE_CLIENT_ID ||
    !AZURE_CLIENT_SECRET ||
    !AZURE_BILLING_ACCOUNT_ID
  ) {
    throw new Error("Missing Azure environment configuration.");
  }

  const credential = new ClientSecretCredential(
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET
  );
  const tokenResp = await credential.getToken(
    "https://management.azure.com/.default"
  );
  if (!tokenResp?.token) throw new Error("Failed to get Azure access token");

  const authHeaders = {
    Authorization: `Bearer ${tokenResp.token}`,
    "Content-Type": "application/json",
  } as const;

  // Try several API versions
  const apiVersions = ["2024-04-01"];

  // First: attempt direct GET by invoice name at billing account scope (and others)
  const candidateNames = [invoiceQuery];
  for (const name of candidateNames) {
    const got = await tryGetInvoiceByName({
      token: tokenResp.token,
      apiVersions,
      billingAccountId: AZURE_BILLING_ACCOUNT_ID,
      invoiceName: name,
    });
    if (got) return got;
  }

  // If GET by name didn't work, list invoices across scopes and try to match
  const listEndpoints: ((v: string) => string)[] = [
    (v) =>
      `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${AZURE_BILLING_ACCOUNT_ID}/invoices?api-version=${v}`,
  ];

  const allInvoices: unknown[] = [];
  for (const build of listEndpoints) {
    let foundAnyForScope = false;
    for (const apiVersion of apiVersions) {
      let pageUrl: string | null = build(apiVersion);
      while (pageUrl) {
        const resp: Response = await fetch(pageUrl, { headers: authHeaders });
        if (!resp.ok) {
          if (resp.status === 403 || resp.status === 404) break;
          break;
        }
        foundAnyForScope = true;
        const json: unknown = await resp.json();
        const values = (
          typeof json === "object" &&
          json &&
          Array.isArray((json as { value?: unknown[] }).value)
            ? (json as { value?: unknown[]; nextLink?: string }).value
            : []
        ) as unknown[];
        allInvoices.push(...values);
        pageUrl =
          typeof json === "object" && json
            ? ((json as { nextLink?: string }).nextLink ?? null)
            : null;
      }
      if (foundAnyForScope) break;
    }
  }

  const normalizedQuery = invoiceQuery.trim().toLowerCase();
  const digitsOnly = normalizedQuery.replace(/[^0-9]/g, "");

  const matchInvoice = (inv: Record<string, unknown>) => {
    const name = ((inv?.name as string | undefined) ?? "").toString();
    const displayName = (
      (inv?.displayName as string | undefined) ?? ""
    ).toString();
    const invoiceNumber = (
      (inv?.invoiceNumber as string | undefined) ??
      ((inv?.properties as Record<string, unknown> | undefined)
        ?.invoiceNumber as string | undefined) ??
      ""
    ).toString();

    const candidates = [name, displayName, invoiceNumber]
      .filter(Boolean)
      .map((s) => s.toLowerCase());

    const digitsSet = [name, displayName, invoiceNumber]
      .filter(Boolean)
      .map((s) => s.replace(/[^0-9]/g, ""));

    return (
      candidates.includes(normalizedQuery) ||
      candidates.some((c) => c.includes(normalizedQuery)) ||
      (!!digitsOnly && digitsSet.includes(digitsOnly))
    );
  };

  const found = (allInvoices as Array<Record<string, unknown>>).find(
    matchInvoice
  );
  if (!found) return null;
  const foundObj = found as Record<string, unknown>;

  // Try embedded document links
  const documents =
    (foundObj?.properties as Record<string, unknown> | undefined)?.documents ||
    (foundObj?.documents as unknown) ||
    (foundObj?.properties as Record<string, unknown> | undefined)
      ?.additionalProperties ||
    [];

  let pdfUrl: string | undefined;
  let csvUrl: string | undefined;

  if (Array.isArray(documents)) {
    for (const d of documents) {
      const kind = (d?.kind || d?.type || d?.documentType || "")
        .toString()
        .toLowerCase();
      const url = d?.url || d?.properties?.url;
      if (!url) continue;
      if (!pdfUrl && (kind.includes("pdf") || kind === "invoicepdf"))
        pdfUrl = url;
      if (!csvUrl && (kind.includes("csv") || kind === "invoicetransactioncsv"))
        csvUrl = url;
    }
  }
  if (
    !pdfUrl &&
    typeof (foundObj?.properties as Record<string, unknown> | undefined)
      ?.downloadUrl === "string"
  ) {
    pdfUrl = (foundObj.properties as Record<string, unknown>)
      .downloadUrl as string;
  }
  if (pdfUrl && csvUrl) return { pdfUrl, csvUrl };

  // Fallback: try the download operation using the invoice's resource name
  const invoiceName = (
    (foundObj?.name as string | undefined) ??
    ((foundObj?.properties as Record<string, unknown> | undefined)?.name as
      | string
      | undefined) ??
    (foundObj?.invoiceName as string | undefined) ??
    ""
  ).toString();
  if (invoiceName) {
    const fromDownload = await tryDownloadDocuments({
      token: tokenResp.token,
      apiVersions,
      billingAccountId: AZURE_BILLING_ACCOUNT_ID,
      invoiceName,
    });
    if (fromDownload) return fromDownload;
  }

  return null;
}

export type InvoiceSummary = {
  name: string;
  displayName?: string;
  invoiceNumber?: string;
  billingPeriodStart?: string; // ISO date string
  billingPeriodEnd?: string; // ISO date string
  invoiceDate?: string; // ISO date string
};

// Returns up to `limit` most recent invoices across available scopes.
export async function listRecentInvoices(
  limit: number = 10
): Promise<InvoiceSummary[]> {
  const {
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
    AZURE_BILLING_ACCOUNT_ID,
  } = process.env;

  if (
    !AZURE_TENANT_ID ||
    !AZURE_CLIENT_ID ||
    !AZURE_CLIENT_SECRET ||
    !AZURE_BILLING_ACCOUNT_ID
  ) {
    throw new Error("Missing Azure environment configuration.");
  }

  const credential = new ClientSecretCredential(
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET
  );
  const tokenResp = await credential.getToken(
    "https://management.azure.com/.default"
  );
  if (!tokenResp?.token) throw new Error("Failed to get Azure access token");

  const authHeaders = {
    Authorization: `Bearer ${tokenResp.token}`,
    "Content-Type": "application/json",
  } as const;

  const apiVersions = ["2024-04-01", "2020-05-01", "2019-10-01-preview"];

  const listEndpoints: ((v: string) => string)[] = [
    (v) =>
      `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${AZURE_BILLING_ACCOUNT_ID}/invoices?api-version=${v}`,
  ];

  const allInvoices: unknown[] = [];
  for (const build of listEndpoints) {
    let foundAnyForScope = false;
    for (const apiVersion of apiVersions) {
      let pageUrl: string | null = build(apiVersion);
      while (pageUrl) {
        const resp: Response = await fetch(pageUrl, { headers: authHeaders });
        if (!resp.ok) {
          if (resp.status === 403 || resp.status === 404) break;
          break;
        }
        foundAnyForScope = true;
        const json: unknown = await resp.json();

        const values = (
          typeof json === "object" &&
          json &&
          Array.isArray((json as { value?: unknown[] }).value)
            ? (json as { value?: unknown[]; nextLink?: string }).value
            : []
        ) as unknown[];
        allInvoices.push(...values);
        pageUrl =
          typeof json === "object" && json
            ? ((json as { nextLink?: string }).nextLink ?? null)
            : null;
      }
      if (foundAnyForScope) break;
    }
  }

  const summaries: InvoiceSummary[] = (
    allInvoices as Array<Record<string, unknown>>
  ).map((inv) => {
    const properties = (inv?.properties as Record<string, unknown>) ?? {};
    return {
      name: ((inv?.name as string | undefined) ?? "").toString(),
      displayName:
        (
          (inv?.displayName as string | undefined) ??
          (properties?.displayName as string | undefined) ??
          ""
        ).toString() || undefined,
      invoiceNumber:
        (
          (inv?.invoiceNumber as string | undefined) ??
          (properties?.invoiceNumber as string | undefined) ??
          ""
        ).toString() || undefined,
      billingPeriodStart:
        (properties?.billingPeriodStartDate as string | undefined) ??
        (properties?.servicePeriodStartDate as string | undefined) ??
        undefined,
      billingPeriodEnd:
        (properties?.billingPeriodEndDate as string | undefined) ??
        (properties?.servicePeriodEndDate as string | undefined) ??
        undefined,
      invoiceDate: (properties?.invoiceDate as string | undefined) ?? undefined,
    };
  });

  const parseDate = (s?: string): number =>
    s ? Date.parse(s) : Number.NEGATIVE_INFINITY;
  const sorted = summaries.sort((a, b) => {
    const aKey = Math.max(
      parseDate(a.invoiceDate),
      parseDate(a.billingPeriodEnd),
      parseDate(a.billingPeriodStart)
    );
    const bKey = Math.max(
      parseDate(b.invoiceDate),
      parseDate(b.billingPeriodEnd),
      parseDate(b.billingPeriodStart)
    );
    return bKey - aKey;
  });

  return sorted.slice(0, Math.max(0, Math.min(limit ?? 10, 100)));
}

async function tryGetInvoiceByName(args: {
  token: string;
  apiVersions: string[];
  billingAccountId: string;
  invoiceName: string;
}): Promise<{ pdfUrl: string; csvUrl: string } | null> {
  const { token, apiVersions, billingAccountId, invoiceName } = args;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;

  const getPaths: ((v: string) => string)[] = [
    (v) =>
      `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/invoices/${invoiceName}?api-version=${v}`,
  ];

  for (const build of getPaths) {
    for (const v of apiVersions) {
      const url = build(v);
      const resp: Response = await fetch(url, { headers });
      if (!resp.ok) {
        continue;
      }
      const json: unknown = await resp.json();
      // Some intermediaries/tools may wrap the real body under a `json` key (as seen in logs).
      const body: unknown =
        typeof json === "object" &&
        json &&
        (json as Record<string, unknown>).json
          ? (json as Record<string, unknown>).json
          : json;
      console.dir(
        {
          json: body,
          url,
        },
        { depth: null }
      );

      // Try embedded docs first
      const documents =
        (typeof body === "object" && body
          ? (
              body as {
                properties?: {
                  documents?: unknown;
                  additionalProperties?: unknown;
                };
              }
            ).properties?.documents
          : undefined) ||
        (typeof body === "object" && body
          ? (body as { documents?: unknown }).documents
          : undefined) ||
        (typeof body === "object" && body
          ? (
              body as {
                properties?: {
                  documents?: unknown;
                  additionalProperties?: unknown;
                };
              }
            ).properties?.additionalProperties
          : undefined) ||
        [];
      let pdfUrl: string | undefined;
      let csvUrl: string | undefined;
      if (Array.isArray(documents)) {
        for (const d of documents) {
          const kind = (d?.kind || d?.type || d?.documentType || "")
            .toString()
            .toLowerCase();
          const urlOut = d?.url || d?.properties?.url;
          if (!urlOut) continue;
          if (!pdfUrl && (kind.includes("pdf") || kind === "invoicepdf"))
            pdfUrl = urlOut;
          if (
            !csvUrl &&
            (kind.includes("csv") || kind === "invoicetransactioncsv")
          )
            csvUrl = urlOut;
        }
      }
      if (pdfUrl && csvUrl) return { pdfUrl, csvUrl };

      // Otherwise call downloadDocuments for this specific invoice name
      const viaDownload = await tryDownloadDocuments({
        token,
        apiVersions: [v], // try the same version first
        billingAccountId,
        invoiceName,
      });
      if (viaDownload) return viaDownload;
    }
  }
  return null;
}

async function tryDownloadDocuments(args: {
  token: string;
  apiVersions: string[];
  billingAccountId: string;
  invoiceName: string;
}): Promise<{ pdfUrl: string; csvUrl: string } | null> {
  const { token, apiVersions, billingAccountId, invoiceName } = args;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;

  const scopePaths: ((v: string) => string)[] = [
    (v) =>
      `https://management.azure.com/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/invoices/${invoiceName}/downloadDocuments?api-version=${v}`,
  ];

  const payloads = [
    { documents: [{ documentType: "InvoicePDF" }, { documentType: "Csv" }] },
    { documents: [{ kind: "InvoicePdf" }, { kind: "Csv" }] },
    { documents: [{ type: "InvoicePdf" }, { type: "Csv" }] },
  ];

  for (const build of scopePaths) {
    for (const v of apiVersions) {
      const url = build(v);
      for (const body of payloads) {
        const resp: Response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (!resp.ok) continue;
        const json: unknown = await resp.json();
        const docs = ((typeof json === "object" && json
          ? (json as { value?: unknown[] }).value
          : undefined) ??
          (typeof json === "object" && json
            ? (json as { documents?: unknown[] }).documents
            : undefined) ??
          []) as unknown[];
        if (!Array.isArray(docs)) continue;
        let pdfUrl: string | undefined;
        let csvUrl: string | undefined;
        for (const d of docs as Array<Record<string, unknown>>) {
          const kind = (
            (d?.kind as string | undefined) ||
            (d?.type as string | undefined) ||
            (d?.documentType as string | undefined) ||
            ""
          )
            .toString()
            .toLowerCase();
          const urlOut =
            (d?.url as string | undefined) ||
            ((d?.properties as Record<string, unknown> | undefined)?.url as
              | string
              | undefined);
          if (!urlOut) continue;
          if (!pdfUrl && (kind.includes("pdf") || kind === "invoicepdf"))
            pdfUrl = urlOut;
          if (
            !csvUrl &&
            (kind.includes("csv") || kind === "invoicetransactioncsv")
          )
            csvUrl = urlOut;
        }
        if (pdfUrl && csvUrl) return { pdfUrl, csvUrl };
      }
    }
  }
  return null;
}
