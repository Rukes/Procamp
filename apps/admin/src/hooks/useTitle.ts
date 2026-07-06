import { useEffect } from "react";

export function useTitle(page: string) {
  useEffect(() => {
    document.title = `${page} | Ubysoft.cz`;
    return () => { document.title = "Ubysoft.cz"; };
  }, [page]);
}
