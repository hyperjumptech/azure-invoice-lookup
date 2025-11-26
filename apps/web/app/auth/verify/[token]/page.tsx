import { VerifyPageClient } from "./page.client";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex items-center justify-center min-h-svh">
      <VerifyPageClient token={token} />
    </div>
  );
}
