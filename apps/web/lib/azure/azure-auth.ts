import { ClientSecretCredential } from "@azure/identity";

export async function getAzureAuthTokenGenerator() {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;

  const credential = new ClientSecretCredential(
    AZURE_TENANT_ID!,
    AZURE_CLIENT_ID!,
    AZURE_CLIENT_SECRET!
  );
  const tokenResp = await credential.getToken(
    "https://management.azure.com/.default"
  );
  if (!tokenResp?.token) throw new Error("Failed to get Azure access token");

  const authHeaders = {
    Authorization: `Bearer ${tokenResp.token}`,
    "Content-Type": "application/json",
  } as const;

  return authHeaders;
}
