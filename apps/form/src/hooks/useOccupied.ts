import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AccommodationType } from "@procamp/shared";

export function useOccupied(slug: string, type: AccommodationType | null) {
  const [occupied, setOccupied] = useState<string[]>([]);

  useEffect(() => {
    if (!type) return;
    api.get(`/camp/${slug}/occupied?type=${type}`)
      .then((r) => setOccupied(r.data.occupied))
      .catch(() => {});
  }, [slug, type]);

  return occupied;
}
