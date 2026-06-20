import { useState, useRef } from "react";

interface TooltipProps {
  text: string;
  position?: "top" | "left";
  children: React.ReactElement;
}

export default function Tooltip({ text, position = "top", children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  };
  const hide = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 100);
  };

  const bubble = position === "left"
    ? "absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50 pointer-events-none"
    : "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50 pointer-events-none";

  const arrow = position === "left"
    ? "absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"
    : "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800";

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={(e) => { e.preventDefault(); setVisible((v) => !v); }}
    >
      {children}
      {visible && (
        <div className={bubble}>
          {text}
          <div className={arrow} />
        </div>
      )}
    </div>
  );
}
