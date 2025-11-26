import { LoginLogoutButton } from "./login-logout-button";
import { VisibilityOnPath } from "./visibility-on-path";
import { ThemeToggle } from "./theme-toggle.client";
import { Suspense } from "react";
import AboutDialog from "./about-dialog";
import { env } from "@workspace/env";

/**
 * This component renders the header. The app name is retrieved from the environment variables.
 * @returns A header with the app name and the login/logout button. The theme toggle, about dialog, and login/logout button are also rendered.
 */
export const Header = () => {
  return (
    <header className="bg-card text-card-foreground border-b border-border shadow-md sticky top-0 z-10 w-full">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {env.NEXT_PUBLIC_APP_NAME ?? "App"}
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Suspense fallback={<div>Loading...</div>}>
            <AboutDialog />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <VisibilityOnPath path="/auth/login" visible={false}>
              <LoginLogoutButton />
            </VisibilityOnPath>
          </Suspense>
        </div>
      </div>
    </header>
  );
};
