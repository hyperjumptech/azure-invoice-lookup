"use client";

import { verifyMagicLinkFormAction } from "@/actions/auth/verify-magic-link/verify-magic-link.server.function";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useResettableActionState } from "use-resettable-action-state";
import { useEffect } from "react";
import { getIpBeforeAction } from "@/lib/ip-address";

export const VerifyPageClient = ({ token }: { token: string }) => {
  const [state, formAction, isPending] = useResettableActionState(
    verifyMagicLinkFormAction,
    { success: false, error: null },
    undefined,
    getIpBeforeAction
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success && !isPending && !state.error) {
      router.push("/invoice");
    }
  }, [state.success, isPending, state.error, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error ? (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {state.error}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Verify Email</h2>
        <p>Click the button below to log in.</p>
      </div>
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Verifying..." : "Verify"}
      </Button>
    </form>
  );
};
