import { useEffect, useState } from "react";
import { api } from "../api/client";

export interface ActiveMotd {
  id: string;
  title: string;
  body: string;
  color: string;
  closeable: boolean;
  showDashboard: boolean;
  showGlobal: boolean;
  showMenu: boolean;
  linkUrl: string | null;
  linkLabel: string | null;
}

const STORAGE_KEY = "ubysoft_dismissed_motds";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function addDismissed(id: string) {
  const d = getDismissed();
  if (!d.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...d, id]));
  }
}

export function useMotd() {
  const [motds, setMotds] = useState<ActiveMotd[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(getDismissed());

  useEffect(() => {
    api.get("/motd/active").then((r) => setMotds(r.data)).catch(() => {});
  }, []);

  const dismiss = (id: string) => {
    addDismissed(id);
    setDismissed((d) => [...d, id]);
  };

  const visible = (filter: keyof Pick<ActiveMotd, "showDashboard" | "showGlobal" | "showMenu">) =>
    motds.filter((m) => m[filter] && !dismissed.includes(m.id));

  // Dashboard zobrazí showDashboard + showGlobal dohromady (bez duplikátů)
  const visibleDashboard = () =>
    motds.filter((m) => (m.showDashboard || m.showGlobal) && !dismissed.includes(m.id));

  return { visible, visibleDashboard, dismiss };
}
