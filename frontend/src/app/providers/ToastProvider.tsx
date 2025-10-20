import React from "react";
import { Toaster } from "sonner";

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={3000}
      />
    </>
  );
}
