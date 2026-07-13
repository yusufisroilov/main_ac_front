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

/** Pull `error` / `message` / `msg` off a parsed body object. */
function pickMessage(body: any): string | null {
  if (body && typeof body === "object") {
    return body.error || body.message || body.msg || null;
  }
  return null;
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

  return err.statusText || err.message || fallback;
}

/**
 * Show the backend's real error message in a SweetAlert popup.
 * Pass `title` (e.g. localized) and/or `fallback` to override defaults.
 */
export function showBackendError(
  err: any,
  opts: { title?: string; fallback?: string } = {},
): Promise<SweetAlertResult> {
  return swal.fire({
    icon: "error",
    title: opts.title || "Xatolik",
    text: extractBackendError(err, opts.fallback),
  });
}
