import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

/**
 * Admits MANAGER and OWNER only.
 *
 * Use this rather than ManagerAuthGuardService for MANAGER/OWNER-only pages:
 * that guard also admits UZBSTAFF and protects many other routes, so it must
 * not be narrowed.
 */
@Injectable({
  providedIn: "root",
})
export class ManagerOwnerAuthGuardService {
  constructor(private router: Router) {}

  canActivate() {
    const role = localStorage.getItem("role");
    if (role === "MANAGER" || role === "OWNER") {
      return true;
    }
    this.router.navigate(["/dashboard"]);
    return false;
  }
}
