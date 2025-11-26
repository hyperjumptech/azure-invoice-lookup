import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { isAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/invoice");
  }

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="max-w-md w-full mx-auto p-6 space-y-4 bg-card text-card-foreground rounded-md border border-border shadow-md">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email address to receive a magic link to sign in.
        </p>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

