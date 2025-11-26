"use client";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReactErrorBoundary
      fallbackRender={({ error }) => (
        <div className="px-4 py-2 bg-destructive/10 text-destructive-foreground rounded-md border border-destructive/20">
          {error.message}
        </div>
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
};
