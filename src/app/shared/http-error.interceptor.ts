import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { showBackendError } from "./backend-error";

/**
 * Surfaces authorization failures that would otherwise fail silently.
 *
 * Since the backend was split into 401 = "session invalid" and 403 = "your role
 * may not do this", most components only handle 401 (log out). A 403 therefore
 * left the user staring at an empty screen with no explanation. This shows the
 * backend's real message once, centrally.
 *
 * IMPORTANT SCOPE LIMIT: Angular interceptors only apply to `HttpClient`.
 * Components still using the legacy `@angular/http` `Http` service bypass this
 * entirely and need their own handling.
 *
 * The error is always re-thrown, so existing component error callbacks keep
 * running exactly as before.
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  /** Endpoints whose 403 means "bad credentials", not "wrong role". */
  private static isAuthUrl(url: string): boolean {
    return /\/(login|register)(\?|$)/.test(url || "");
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // 401 is handled by the components (log out) — don't double-report it.
        // Only explain the "authenticated but not allowed" case.
        //
        // /login is excluded on purpose: it answers 403 for BAD CREDENTIALS
        // (not a role problem). Popping a modal there would stack on top of the
        // login form's own inline message and would surface the backend's
        // "User not found" vs "Invalid password" wording — user enumeration.
        if (err.status === 403 && !HttpErrorInterceptor.isAuthUrl(req.url)) {
          showBackendError(err, {
            fallback: "Bu amal uchun ruxsatingiz yo'q.",
          });
        }
        return throwError(err);
      }),
    );
  }
}
