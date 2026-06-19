import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Camp, Language, Surcharge } from "@procamp/shared";

interface CampPublic extends Omit<Camp, "surcharges"> {
  surcharges: (Surcharge & { name: string })[];
}

interface CampData {
  camp: CampPublic;
  languages: Language[];
  currentLang: string;
}

export function useCamp(slug: string, lang: string) {
  const [data, setData] = useState<CampData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/camp/${slug}?lang=${lang}`)
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  }, [slug, lang]);

  return { data, error };
}

export type { CampPublic };
