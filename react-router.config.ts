import type { Config } from "@react-router/dev/config";

// SPA: la API (Django) es un servicio aparte con JWT; no hay servidor Node en produccion.
export default {
  ssr: false,
} satisfies Config;
