import { useEffect, useState } from "react";
import { api } from "../api/client";

export function useOccupied(orgSlug: string, campSlug: string, typeId: string | null) {
  const [occupied, setOccupied] = useState<string[]>([]);

  useEffect(() => {
    if (!typeId) return;
    api.get(`/camp/${orgSlug}/${campSlug}/occupied?typeId=${typeId}`)
      .then((r) => setOccupied(r.data.occupied))
      .catch(() => {});
  }, [orgSlug, campSlug, typeId]);

  return occupied;
}
