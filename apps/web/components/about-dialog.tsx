import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { withAuthGuard } from "@/lib/auth-guard";
import { env } from "@workspace/env";
import { getBillingAccounts, billingAccountIds } from "@/lib/azure/accounts";

const AboutDialogData = async () => {
  const billingAccounts = await getBillingAccounts(billingAccountIds());
  const data = {
    billingAccounts: billingAccounts.map((account) => {
      return {
        id: account.name,
        name: account.properties.displayName,
      };
    }),
    companyName: env.NEXT_PUBLIC_COMPANY_NAME ?? "Company",
    appName: env.NEXT_PUBLIC_APP_NAME ?? "App",
  };

  return <AboutDialog {...data} />;
};

function AboutDialog({
  billingAccounts,
  companyName,
  appName,
}: {
  billingAccounts: { id: string; name: string }[];
  companyName: string;
  appName: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">About</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>About {appName}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>
                This tool is used to lookup Azure invoices from billing accounts
                of {companyName}. Currently it searches for the given invoices
                in {billingAccounts.length} billing accounts:
              </p>
              <ul className="mt-4 space-y-3 list-disc list-outside ml-6">
                {billingAccounts?.map((account) => (
                  <li key={account.id} className="pl-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{account.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {account.id}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default withAuthGuard(AboutDialogData, undefined, "hide");
