import swal, { SweetAlertResult } from "sweetalert2";

/**
 * Reusable backend-error helpers.
 *
 * The app talks to the backend three different ways — legacy `@angular/http`
 * (`Http`), modern `HttpClient` (`HttpErrorResponse`), and raw `XMLHttpRequest`
 * — and each surfaces errors in a different shape. These helpers pull the real
 * message out of ANY of them and show it in a SweetAlert, so the actual reason
 * (e.g. "Mijoz ID 2303 bo'yicha topilmadi") is visible even on small screens.
 *
 * Backends here return errors as `{ error }` or `{ message }`.
 */

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Pull `error` / `message` / `msg` off a parsed body object -- text only. */
function pickMessage(body: any): string | null {
  if (body && typeof body === "object") {
    for (const v of [body.error, body.message, body.msg]) {
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

export const NETWORK_ERROR_MESSAGE =
  "Server bilan aloqa yo'q. Internet ulanishini tekshiring yoki birozdan so'ng qayta urinib ko'ring.";

/**
 * True when the request never got an answer (server down or restarting, no
 * internet): HttpClient reports status 0 with a ProgressEvent as the body.
 */
export function isNetworkError(err: any): boolean {
  if (!err || typeof err !== "object") return false;
  if (typeof ProgressEvent !== "undefined" && err.error instanceof ProgressEvent) return true;
  return err.status === 0;
}

/**
 * Extract a human-readable message from any error shape:
 * a plain string, an HttpClient `HttpErrorResponse`, a legacy `@angular/http`
 * `Response`, a raw `XMLHttpRequest` (or its `responseText`), or an
 * already-parsed body object.
 */
export function extractBackendError(
  err: any,
  fallback = "Noma'lum xatolik yuz berdi",
): string {
  if (err == null) return fallback;
  if (isNetworkError(err)) return NETWORK_ERROR_MESSAGE;

  // Plain string (possibly a JSON string).
  if (typeof err === "string") {
    return pickMessage(safeJson(err)) ?? (err.trim() || fallback);
  }

  // HttpClient HttpErrorResponse: the body lives in `err.error`.
  if (err.error != null) {
    const body = err.error;
    if (typeof body === "string") {
      return pickMessage(safeJson(body)) ?? (body.trim() || fallback);
    }
    const m = pickMessage(body);
    if (m) return m;
  }

  // Legacy @angular/http Response: body via `.json()`.
  if (typeof err.json === "function") {
    try {
      const m = pickMessage(err.json());
      if (m) return m;
    } catch {
      /* not JSON — fall through */
    }
  }

  // Raw XMLHttpRequest (or anything carrying responseText).
  if (typeof err.responseText === "string") {
    const m = pickMessage(safeJson(err.responseText));
    if (m) return m;
  }

  // The error object itself might carry error/message.
  const direct = pickMessage(err);
  if (direct) return direct;

  const text = err.statusText || err.message;
  return typeof text === "string" && text.trim() ? text : fallback;
}

/**
 * Show the backend's real error message in a SweetAlert popup.
 * Pass `title` (e.g. localized) and/or `fallback` to override defaults.
 */
export function showBackendError(
  err: any,
  opts: { title?: string; fallback?: string } = {},
): Promise<SweetAlertResult> {
  const offline = isNetworkError(err);
  return swal.fire({
    icon: offline ? "warning" : "error",
    title: opts.title || (offline ? "Aloqa uzildi" : "Xatolik"),
    text: extractBackendError(err, opts.fallback),
  });
}
