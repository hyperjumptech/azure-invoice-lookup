"use client";
import { Button } from "@workspace/ui/components/button";
import { sendMagicLinkFormAction } from "@/actions/auth/send-magic-link/send-magic-link.server.function";
import { useResettableActionState } from "use-resettable-action-state";
import { env } from "@workspace/env";
import { getIpBeforeAction } from "@/lib/ip-address";

export const LoginForm = () => {
  const [state, formAction, isPending, , payload] = useResettableActionState(
    sendMagicLinkFormAction,
    { success: false, error: null },
    undefined,
    getIpBeforeAction
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-medium text-sm">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={payload?.get("email")?.toString() || ""}
          autoFocus
          disabled={isPending || state.success}
          className="border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="your.email@example.com"
        />
      </div>

      {state.error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
          {env.NEXT_PUBLIC_NO_EMAIL_SEND
            ? "Email sending disabled. See the server log to see the magic link."
            : "Check your email inbox! We've sent you a magic link to sign in. Please check your spam folder if you don't see it."}
        </div>
      )}

      <Button type="submit" disabled={isPending || state.success}>
        {isPending
          ? "Sending..."
          : state.success
            ? "Email Sent!"
            : "Send Magic Link"}
      </Button>
    </form>
  );
};
