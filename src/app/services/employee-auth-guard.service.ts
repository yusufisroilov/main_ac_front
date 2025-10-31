import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class EmployeeAuthGuardService {
  constructor(private router: Router) {}

  canActivate() {
    let isAdmin = localStorage.getItem("role");

    if (isAdmin == "YUKCHI" || isAdmin == "UZBSTAFF" || isAdmin === "MANAGER") {
      return true;
    } else {
      this.router.navigate(["/dashboard"]);
      return false;
    }
  }
}
