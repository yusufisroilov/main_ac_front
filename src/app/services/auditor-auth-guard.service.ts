import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class AuditorAuthGuardService {
  constructor(private router: Router) {}

  canActivate() {
    const role = localStorage.getItem("role");
    if (role === "AUDITOR" || role === "MANAGER") {
      return true;
    } else {
      this.router.navigate(["/dashboard"]);
      return false;
    }
  }
}
