"use client";

import { Button } from "@workspace/ui/components/button";
import { useTransition } from "react";
import { logoutServerFunction } from "@/actions/auth/logout/logout.server.function";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";

/**
 * This component renders a login button.
 * @returns A login button.
 */
const LoginButtonClient = () => {
  return (
    <Button variant="outline" asChild>
      <Link href="/auth/login">Login</Link>
    </Button>
  );
};

/**
 * This component renders a logout button. On click, it shows an alert dialog to confirm the logout.
 * @param email - The email of the user.
 * @returns A logout button.
 */
const LogoutButtonClient = ({ email }: { email: string }) => {
  const [isPending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Logout</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Logout</AlertDialogTitle>
          <AlertDialogDescription>
            You are logged in as {email}. Are you sure you want to logout?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              className="text-white"
              onClick={() => {
                startTransition(() => {
                  logoutServerFunction({ redirectTo: "/auth/login" });
                });
              }}
              disabled={isPending}
            >
              {isPending ? "Logging out..." : "Logout"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * This component renders a login or logout button based on the email.
 * @param email - The email of the user.
 * @returns A login or logout button.
 */
export const LoginLogoutButtonClient = ({
  email,
}: {
  email: string | null;
}) => {
  return (
    <>{email ? <LogoutButtonClient email={email} /> : <LoginButtonClient />}</>
  );
};
