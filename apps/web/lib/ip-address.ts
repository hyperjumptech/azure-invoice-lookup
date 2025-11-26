import { toast } from "sonner";

/**
 * The function that is called before data is sent to a server function. It fetches the IP address and geo data and adds them to the payload.
 * @param payload
 * @param abortController
 * @returns
 */
export const getIpBeforeAction = async (
  payload: FormData | null,
  abortController: AbortController
) => {
  try {
    const ipResponse = await fetch("https://api.ipify.org?format=json");
    const ipJson = await ipResponse.json();
    const ip = ipJson.ip;

    // Use our server-side API route to avoid CORS issues
    const geoResponse = await fetch(`/api/ip-geo?ip=${encodeURIComponent(ip)}`);

    if (!geoResponse.ok) {
      throw new Error(`Failed to fetch geo data: ${geoResponse.statusText}`);
    }

    const geoJson = await geoResponse.json();

    payload?.set("ip_address", ip);
    payload?.set("geo_data", JSON.stringify(geoJson));
  } catch (error) {
    toast.error("Failed to get IP address. Please try again later.");
    abortController.abort();
  }

  return payload;
};
