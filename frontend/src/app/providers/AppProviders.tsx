import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import ThemeProvider from "./ThemeProvider";
import ToastProvider from "./ToastProvider";
import ModalProvider from "./ModalProvider";
import AuthSessionProvider from "./AuthSessionProvider";
import QueryProvider from "./QueryProvider";
import PwaUpdateProvider from "./PwaUpdateProvider";
import WsProvider from "./WsProvider";

type Props = { children: React.ReactNode };

export default function AppProviders({ children }: Props) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <ModalProvider>
            <AuthSessionProvider>
              <QueryProvider>
                <PwaUpdateProvider>
                  <WsProvider>
                    {children}
                  </WsProvider>
                </PwaUpdateProvider>
              </QueryProvider>
            </AuthSessionProvider>
          </ModalProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
