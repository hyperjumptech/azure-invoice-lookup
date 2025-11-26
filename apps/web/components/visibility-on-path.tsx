"use client";
import { usePathname } from "next/navigation";

/**
 * A component that shows or hides its children based on the current path.
 * If the path matches, the children are shown if visible is true, otherwise they are hidden.
 * If the path does not match, the children are hidden if visible is true, otherwise they are shown.
 * @example
 *
 * <VisibilityOnPath path="/invoice" visible={true}>
 *   <div>Invoice</div>
 * </VisibilityOnPath>
 * This will show the div if the current path is /invoice, otherwise it will be hidden.
 *
 * <VisibilityOnPath path="/invoice" visible={false}>
 *   <div>Invoice</div>
 * </VisibilityOnPath>
 * This will hide the div if the current path is /invoice, otherwise it will be shown.
 *
 * @param path - The path to check
 * @param visible - Whether to show the children if the path matches
 * @param children - The children to show
 * @returns
 */
export const VisibilityOnPath = ({
  path,
  visible,
  children,
}: {
  visible: boolean;
  path: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

  if (pathname === path) {
    return visible ? children : null;
  }
  return visible ? null : children;
};
