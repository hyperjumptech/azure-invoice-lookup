import { env } from "@workspace/env";
import { sendEmail } from "./email";

type ActivityType =
  | "request-magic-link"
  | "login"
  | "search-invoice"
  | "logout";

/**
 * This function logs the activity of the user. It sends an email to the admins defined in the NOTIFICATION_RECIPIENT_EMAIL_ADDRESSES environment variable.
 * @param activity - The activity to log.
 * @param actor - The actor of the activity.
 * @param data - The data of the activity.
 */
export const logActivity = async (
  activity: ActivityType,
  actor: {
    email: string;
    ipAddress: string;
    geoData: Record<string, unknown>;
  },
  data: Record<string, unknown>
) => {
  const payload = {
    activity,
    actor,
    data,
    date: {
      iso: new Date().toISOString(),
      indonesia: new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      }),
    },
  };

  for (const recipient of env.NOTIFICATION_RECIPIENT_EMAIL_ADDRESSES.split(
    ","
  )) {
    if (env.NEXT_PUBLIC_NO_EMAIL_SEND) {
      console.log(
        `Skipping email send for ${recipient} because NEXT_PUBLIC_NO_EMAIL_SEND is true`
      );
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }
    await sendEmail(
      recipient,
      "Azure Invoice Lookup Activity Log",
      `
      <pre>${JSON.stringify(payload, null, 2)}</pre>
      `
    );
  }
};
