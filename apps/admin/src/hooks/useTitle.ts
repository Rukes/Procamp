import { useEffect } from "react";

export function useTitle(page: string) {
  useEffect(() => {
    document.title = `${page} | MůjKemp.cz`;
    return () => { document.title = "MůjKemp.cz"; };
  }, [page]);
}
