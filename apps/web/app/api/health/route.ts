import { getBillingAccounts, billingAccountIds } from "@/lib/azure/accounts";
import {
  headersSchema,
  httpMethodSchema,
  requestSchema,
} from "@nicnocquee/zod-request";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@workspace/env";

const headers = headersSchema(
  z.object({
    "x-api-health-key": z.string().refine((key) => key === env.API_HEALTH_KEY, {
      message: "Invalid API health key",
    }),
  })
);

export async function GET(request: Request) {
  try {
    const schema = requestSchema({
      headers,
      method: httpMethodSchema("GET"),
    });

    await schema.parseAsync(request);
  } catch (error) {
    return NextResponse.json(
      {
        status: 401,
        data: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const billingAccounts = await getBillingAccounts(billingAccountIds());

  return NextResponse.json({
    status: 200,
    data: `Connected to ${billingAccounts.length} billing accounts`,
  });
}
