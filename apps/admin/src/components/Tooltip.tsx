import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  text: string;
  position?: "top" | "left" | "right";
  children: React.ReactElement;
}

export default function Tooltip({ text, position = "top", children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      if (position === "left")  setCoords({ x: r.left, y: r.top + r.height / 2 });
      else if (position === "right") setCoords({ x: r.right, y: r.top + r.height / 2 });
      else setCoords({ x: r.left + r.width / 2, y: r.top });
    }
    setVisible(true);
  };
  const hide = () => { hideTimer.current = setTimeout(() => setVisible(false), 100); };

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  const tooltipStyle: React.CSSProperties =
    position === "left"  ? { position: "fixed", top: coords.y, right: window.innerWidth - coords.x + 8, transform: "translateY(-50%)" }
    : position === "right" ? { position: "fixed", top: coords.y, left: coords.x + 8, transform: "translateY(-50%)" }
    : { position: "fixed", bottom: window.innerHeight - coords.y + 8, left: coords.x, transform: "translateX(-50%)" };

  const arrow =
    position === "left"  ? "absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"
    : position === "right" ? "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"
    : "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800";

  return (
    <div
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={(e) => { e.preventDefault(); show(); }}
    >
      {children}
      {visible && createPortal(
        <div style={{ ...tooltipStyle, zIndex: 9999, maxWidth: "240px" }} className="px-2 py-1.5 text-xs text-white bg-gray-800 rounded leading-snug pointer-events-none">
          {text}
          <div className={arrow} />
        </div>,
        document.body
      )}
    </div>
  );
}
