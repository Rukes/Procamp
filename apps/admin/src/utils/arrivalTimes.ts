// Generates arrival time slots starting at 14:00, wrapping around midnight
const HOURS = Array.from({ length: 24 }, (_, i) => (i + 14) % 24);

export const ARRIVAL_TIMES = HOURS.map((h) => {
  const next = (h + 1) % 24;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { value: `${pad(h)}:00–${pad(next)}:00`, label: `${pad(h)}:00 – ${pad(next)}:00` };
});
