import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const Ctx = createContext<ToastCtx>(null!);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const success = useCallback((msg: string) => add(msg, "success"), [add]);
  const error = useCallback((msg: string) => add(msg, "error"), [add]);
  const info = useCallback((msg: string) => add(msg, "info"), [add]);

  const STYLES: Record<ToastType, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  const ICONS: Record<ToastType, string> = {
    success: "fa-check",
    error: "fa-xmark",
    info: "fa-info",
  };

  return (
    <Ctx.Provider value={{ success, error, info }}>
      {children}
      <div className="fixed top-5 right-5 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl text-white text-sm font-medium shadow-lg animate-slide-in ${STYLES[t.type]}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs shrink-0">
              <i className={`fa-regular ${ICONS[t.type]}`} />
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
