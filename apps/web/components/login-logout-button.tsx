import { getSessionEmail } from "@/lib/auth";
import { LoginLogoutButtonClient } from "./login-logout-button.client";
import { cacheTag, cacheLife } from "next/cache";

/**
 * This RSC fetches the user email and renders the LoginLogoutButtonClient component.
 * @returns A login or logout button.
 */
export const LoginLogoutButton = async () => {
  "use cache: private";
  cacheTag("login-logout-button");
  cacheLife({ stale: 60 });

  const userEmail = await getSessionEmail();

  return <LoginLogoutButtonClient email={userEmail} />;
};
