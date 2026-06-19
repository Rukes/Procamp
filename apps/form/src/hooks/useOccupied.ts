import { useEffect, useState } from "react";
import { api } from "../api/client";

export function useOccupied(slug: string, typeId: string | null) {
  const [occupied, setOccupied] = useState<string[]>([]);

  useEffect(() => {
    if (!typeId) return;
    api.get(`/camp/${slug}/occupied?typeId=${typeId}`)
      .then((r) => setOccupied(r.data.occupied))
      .catch(() => {});
  }, [slug, typeId]);

  return occupied;
}
