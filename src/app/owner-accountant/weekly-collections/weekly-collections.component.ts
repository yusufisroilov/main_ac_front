import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-weekly-collections",
  templateUrl: "./weekly-collections.component.html",
  styleUrls: ["./weekly-collections.component.css"],
})
export class WeeklyCollectionsComponent implements OnInit {
  collections: any[] = [];
  loading = false;
  includePending = false;

  activePeriod: "this_month" | "last_month" | "custom" = "this_month";
  customFrom = "";
  customTo = "";

  constructor(private http: HttpClient, public authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() { this.loadData(); }

  setPeriod(p: "this_month" | "last_month" | "custom") {
    this.activePeriod = p;
    if (p !== "custom") this.loadData();
  }

  applyCustomRange() {
    if (this.customFrom && this.customTo) this.loadData();
  }

  loadData() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/owner/weekly-collections?period=${this.activePeriod}&include_pending=${this.includePending}`;
    if (this.activePeriod === "custom" && this.customFrom && this.customTo) {
      url += `&from=${this.customFrom}&to=${this.customTo}`;
    }
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => { this.collections = data.collections || []; this.loading = false; },
      (error) => { this.loading = false; if (error.status === 403) this.authService.logout(); },
    );
  }

  /** Period display label */
  get periodLabel(): string {
    const now = new Date();
    if (this.activePeriod === "this_month") {
      return `1-${this.monthName(now.getMonth())} — ${now.getDate()}-${this.monthName(now.getMonth())}`;
    }
    if (this.activePeriod === "last_month") {
      const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastDay = new Date(y, m + 1, 0).getDate();
      return `1-${this.monthName(m)} — ${lastDay}-${this.monthName(m)}`;
    }
    if (this.activePeriod === "custom" && this.customFrom && this.customTo) {
      return `${this.customFrom} — ${this.customTo}`;
    }
    return "";
  }

  private monthName(m: number): string {
    const months = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
    return months[m];
  }

  fmt(value: number): string {
    if (value == null) return "0.00";
    const abs = Math.abs(value);
    const [intPart, decPart] = abs.toFixed(2).split(".");
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + decPart;
  }
}
