import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-owner-dashboard",
  templateUrl: "./owner-dashboard.component.html",
  styleUrls: ["./owner-dashboard.component.css"],
})
export class OwnerDashboardComponent implements OnInit {
  stats: any = null;
  loading = false;
  activePeriod: "today" | "week" = "today";

  constructor(private http: HttpClient, public authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() { this.loadStats(); }

  loadStats() {
    this.loading = true;
    this.http.get<any>(GlobalVars.baseUrl + "/owner/dashboard-stats", { headers: this.getHeaders() }).subscribe(
      (data) => { this.stats = data; this.loading = false; },
      (error) => { this.loading = false; if (error.status === 403) this.authService.logout(); },
    );
  }

  fmt(value: number): string {
    if (value == null) return "0.00";
    const abs = Math.abs(value);
    const [intPart, decPart] = abs.toFixed(2).split(".");
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + decPart;
  }
}
