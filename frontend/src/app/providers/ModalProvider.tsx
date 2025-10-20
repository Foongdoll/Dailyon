import React from "react";
import { createPortal } from "react-dom";

type ModalCtx = {
  open: (node: React.ReactNode) => void;
  close: () => void;
};
const Ctx = React.createContext<ModalCtx | null>(null);

export default function ModalProvider({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [content, setContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    let el = document.getElementById("modal-root") as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = "modal-root";
      document.body.appendChild(el);
    }
    setContainer(el);
  }, []);

  const open = React.useCallback((node: React.ReactNode) => setContent(node), []);
  const close = React.useCallback(() => setContent(null), []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {container && content ? createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-6"
          onClick={close}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-4 max-w-[90vw] max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>,
        container
      ) : null}
    </Ctx.Provider>
  );
}

export const useModal = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
};
