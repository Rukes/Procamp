import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OrgSummary { id: string; name: string; slug: string; }

interface OrgContextValue {
  selectedOrgId: string | null;
  selectedOrg: OrgSummary | null;
  orgs: OrgSummary[];
  setSelectedOrgId: (id: string | null) => void;
  setOrgs: (orgs: OrgSummary[]) => void;
}

const OrgContext = createContext<OrgContextValue>({
  selectedOrgId: null, selectedOrg: null, orgs: [],
  setSelectedOrgId: () => {}, setOrgs: () => {},
});

const STORAGE_KEY = "mujkemp_selected_org";

export function OrgProvider({ children }: { children: ReactNode }) {
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);

  const setSelectedOrgId = (id: string | null) => {
    setSelectedOrgIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId) ?? null;

  return (
    <OrgContext.Provider value={{ selectedOrgId, selectedOrg, orgs, setSelectedOrgId, setOrgs }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() { return useContext(OrgContext); }
