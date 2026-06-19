import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Camp, Language } from "@procamp/shared";

export interface PublicAccommodationType {
  id: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  adultPricePerNight: number;
  childPricePerNight: number;
}

export interface PublicSurcharge {
  id: string;
  name: string;
  pricePerNight: number;
  isOptional: boolean;
}

interface CampPublic extends Omit<Camp, "surcharges" | "accommodationTypes"> {
  surcharges: PublicSurcharge[];
  accommodationTypes: PublicAccommodationType[];
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
