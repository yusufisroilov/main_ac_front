import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class OwnerAuthGuardService {
  constructor(private router: Router) {}

  canActivate() {
    const role = localStorage.getItem("role");
    if (role === "OWNER" || role === "MANAGER" || role === "ACCOUNTANT") {
      return true;
    } else {
      this.router.navigate(["/dashboard"]);
      return false;
    }
  }
}
