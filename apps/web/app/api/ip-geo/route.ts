import { NextResponse } from "next/server";

/**
 * Server-side API route to proxy IP geolocation requests.
 * This avoids CORS issues by making the request from the server instead of the client.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get("ip");

    if (!ip) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      );
    }

    // Fetch IP geolocation data from ip-api.com
    const geoResponse = await fetch(`https://ip-api.com/json/${ip}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!geoResponse.ok) {
      throw new Error(`Failed to fetch geo data: ${geoResponse.statusText}`);
    }

    const geoJson = await geoResponse.json();

    return NextResponse.json(geoJson);
  } catch (error) {
    console.error("Error fetching IP geolocation:", error);
    return NextResponse.json(
      { error: "Failed to fetch IP geolocation data" },
      { status: 500 }
    );
  }
}

