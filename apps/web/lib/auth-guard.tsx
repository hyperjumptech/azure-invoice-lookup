import { redirect } from "next/navigation";
import { isAuthenticated } from "./auth";

/**
 * A higher-order component that protects a component by checking if the user is authenticated.
 * If the user is not authenticated, it will redirect to the specified URL, render a component, or hide the component.
 * There are 3 modes to choose from:
 * - "redirect": Redirects to the specified URL.
 * - "render": Renders the specified component.
 * - "hide": Hides the component.
 *
 * @example
 * const ProtectedComponent = withAuthGuard(Component);
 * export default ProtectedComponent;
 *
 * @param Component - The component to protect
 * @param isAuthenticatedFunc - The function to check if the user is authenticated
 * @param redirectTo - The URL to redirect to if the user is not authenticated
 * @param renderComponent - The component to render if the user is not authenticated
 * @param mode - The mode to use to protect the component. Accepts "redirect", "render", or "hide".
 * @returns The protected component
 */
export const withAuthGuard = <
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(
  Component: React.ComponentType<TProps>,
  isAuthenticatedFunc: () => Promise<boolean> = isAuthenticated,
  mode: "redirect" | "render" | "hide" = "redirect",
  redirectTo: string = "/auth/login",
  renderComponent: React.ReactNode = null
) => {
  const AuthGuard = async (props: TProps) => {
    const isLoggedIn = await isAuthenticatedFunc();
    if (!isLoggedIn) {
      if (mode === "redirect") {
        redirect(redirectTo);
      } else if (mode === "render") {
        return renderComponent;
      } else if (mode === "hide") {
        return null;
      }
    }
    return <Component {...props} />;
  };
  return AuthGuard;
};
