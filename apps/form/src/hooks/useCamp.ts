import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Camp, Language } from "@procamp/shared";

export interface PublicAccommodationType {
  id: string;
  name: string;
  capacity: number;
  shortDescription?: string | null;
  longDescription?: string | null;
  pricePerNight: number;
  adultPricePerNight: number;
  childPricePerNight: number;
}

export interface PublicSurcharge {
  id: string;
  name: string;
  pricePerNight: number;
  isOptional: boolean;
  note?: string | null;
}

interface CampPublic extends Omit<Camp, "surcharges" | "accommodationTypes"> {
  surcharges: PublicSurcharge[];
  accommodationTypes: PublicAccommodationType[];
}

interface CampData {
  camp: CampPublic;
  languages: Language[];
  currentLang: string;
  termsText: string;
  requireTermsAcceptance: boolean;
}

export function useCamp(orgSlug: string, campSlug: string, lang: string) {
  const [data, setData] = useState<CampData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/camp/${orgSlug}/${campSlug}?lang=${lang}`)
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  }, [orgSlug, campSlug, lang]);

  return { data, error };
}

export type { CampPublic };
