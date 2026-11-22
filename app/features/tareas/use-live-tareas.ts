import { useEffect } from "react";
import { useRevalidator } from "react-router";
import { recentlyActive } from "~/lib/auth/idle";
export function useLiveTareas() {
  const { revalidate, state } = useRevalidator();
  useEffect(() => {
    const refresh = () => {
      if (state === "idle" && !document.hidden && recentlyActive()) void revalidate();
    };
    const interval = setInterval(refresh, 15000);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [revalidate, state]);
}
