import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  dying: boolean;
}

interface ToastCtx {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const Ctx = createContext<ToastCtx>(null!);

let counter = 0;
const FADE_MS = 300;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, dying: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), FADE_MS);
  }, []);

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type, dying: false }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

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
            onClick={() => dismiss(t.id)}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl text-white text-sm font-medium shadow-lg cursor-pointer select-none transition-opacity duration-300 ${t.dying ? "opacity-0 animate-none" : "opacity-100 animate-slide-in"} ${STYLES[t.type]}`}
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
