import { useEffect } from "react";
import { useNavigate } from "react-router";
import { logout } from "../api/auth";
import { clearSession } from "./session";

/** RNF01: la sesión se cierra tras 30 minutos sin actividad humana. */
export const IDLE_LIMIT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;

let lastActivity = Date.now();

export function markActivity(now = Date.now()): void {
  lastActivity = now;
}
export function msSinceActivity(now = Date.now()): number {
  return now - lastActivity;
}

export function useIdleLogout(): void {
  const navigate = useNavigate();
  useEffect(() => {
    markActivity();
    const onActivity = () => markActivity();
    for (const event of ACTIVITY_EVENTS)
      window.addEventListener(event, onActivity, { passive: true });
    const check = () => {
      if (msSinceActivity() < IDLE_LIMIT_MS) return;
      window.clearInterval(timer);
      const next = window.location.pathname + window.location.search;
      void logout()
        .catch(() => undefined)
        .finally(() => {
          clearSession();
          void navigate(`/login?motivo=inactividad&next=${encodeURIComponent(next)}`, {
            replace: true,
          });
        });
    };
    const timer = window.setInterval(check, 30 * 1000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity);
    };
  }, [navigate]);
}
