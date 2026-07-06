import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { cs } from "date-fns/locale";
import { format, isValid } from "date-fns";
import "react-day-picker/dist/style.css";

interface Props {
  value: string; // datetime-local format: "YYYY-MM-DDTHH:mm"
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
}

function toLocalStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocal(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isValid(d) ? d : undefined;
}

export default function DateTimePicker({ value, onChange, label, required }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = parseLocal(value);
  const [time, setTime] = useState(() => value ? value.slice(11, 16) : "00:00");

  useEffect(() => {
    if (value) setTime(value.slice(11, 16));
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, []);

  const handleDay = (day: Date | undefined) => {
    if (!day) return;
    const [h, m] = time.split(":").map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    onChange(toLocalStr(d));
    setOpen(false);
  };

  const handleTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    if (selected) {
      const [h, m] = e.target.value.split(":").map(Number);
      const d = new Date(selected);
      d.setHours(h, m, 0, 0);
      onChange(toLocalStr(d));
    }
  };

  const displayVal = selected
    ? `${format(selected, "d. M. yyyy", { locale: cs })}, ${time}`
    : "";

  return (
    <div className="relative" ref={ref}>
      {label && <label className="label">{label}{required && " *"}</label>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input w-full text-left flex items-center gap-2"
      >
        <i className="fa-regular fa-calendar text-gray-400" />
        <span className={displayVal ? "text-gray-900" : "text-gray-400"}>
          {displayVal || "Vyberte datum a čas"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 min-w-[260px]" style={{ fontSize: "0.8rem" }}>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDay}
            locale={cs}
            classNames={{
              months: "flex flex-col",
              month: "space-y-1",
              caption: "flex justify-center items-center relative py-1",
              caption_label: "text-sm font-medium",
              nav: "flex items-center gap-1",
              nav_button: "p-1 rounded hover:bg-gray-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-gray-400 w-8 font-normal text-[0.7rem] text-center",
              row: "flex w-full mt-0.5",
              cell: "w-8 h-8 text-center text-xs p-0 relative",
              day: "w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors",
              day_selected: "bg-blue-600 text-white hover:bg-blue-700 rounded-lg",
              day_today: "font-bold",
              day_outside: "text-gray-300",
            }}
            modifiersStyles={{
              selected: { backgroundColor: "#2563eb", color: "#fff", borderRadius: "0.5rem" },
              today: { fontWeight: "bold" },
            }}
          />
          <div className="border-t border-gray-100 pt-3 px-1 flex items-center gap-3">
            <i className="fa-regular fa-clock text-gray-400" />
            <label className="text-sm text-gray-600 font-medium">Čas</label>
            <input
              type="time"
              value={time}
              onChange={handleTime}
              className="input flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
