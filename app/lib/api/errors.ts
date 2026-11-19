export interface ApiErrorPayload {
  code?: string;
  detail?: unknown;
}

function messages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(messages);
  return [];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string> = {};

  constructor(status: number, payload: ApiErrorPayload = {}) {
    const detail = payload.detail;
    let message = "No se pudo completar la solicitud.";
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail)) message = messages(detail).join(" ");
    else if (detail && typeof detail === "object") {
      message =
        messages((detail as Record<string, unknown>).non_field_errors).join(" ") ||
        "Revisa los campos marcados.";
    }
    super(status === 0 ? "No se pudo conectar con el servidor." : message);
    this.name = "ApiError";
    this.status = status;
    this.code = status === 0 ? "network_error" : payload.code || "unknown_error";
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      for (const [field, value] of Object.entries(detail)) {
        const first = messages(value)[0];
        if (field !== "non_field_errors" && first) this.fieldErrors[field] = first;
      }
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
