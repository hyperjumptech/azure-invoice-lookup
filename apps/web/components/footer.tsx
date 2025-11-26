/**
 * This component renders the footer. The company name is retrieved from the environment variables.
 * @returns A footer with the company name and the year.
 */
import { env } from "@workspace/env";
export const Footer = () => {
  return (
    <footer className="bg-black text-white shadow-md w-full py-10">
      <div className="max-w-7xl mx-auto px-4 py-4 text-center">
        <p className="text-sm">
          © 2025 {env.NEXT_PUBLIC_COMPANY_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
