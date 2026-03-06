import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-top-debtors",
  templateUrl: "./top-debtors.component.html",
  styleUrls: ["./top-debtors.component.css"],
})
export class TopDebtorsComponent implements OnInit {
  debtors: any[] = [];
  loading = false;
  limit = 50;
  searchTerm = "";

  constructor(private http: HttpClient, public authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading = true;
    this.http.get<any>(`${GlobalVars.baseUrl}/owner/top-debtors?limit=${this.limit}`, { headers: this.getHeaders() }).subscribe(
      (data) => { this.debtors = data.debtors || []; this.loading = false; },
      (error) => { this.loading = false; if (error.status === 403) this.authService.logout(); },
    );
  }

  get filteredDebtors(): any[] {
    if (!this.searchTerm) return this.debtors;
    const term = this.searchTerm.toLowerCase();
    return this.debtors.filter(d =>
      (d.first_name || "").toLowerCase().includes(term) ||
      (d.last_name || "").toLowerCase().includes(term) ||
      (d.username || "").toLowerCase().includes(term) ||
      ("k" + d.id).includes(term)
    );
  }

  get totalDebtUsd(): number {
    return this.filteredDebtors.reduce((sum, d) => sum + (parseFloat(d.balance_usd) || 0), 0);
  }

  get totalDebtUzs(): number {
    return this.filteredDebtors.reduce((sum, d) => sum + (parseFloat(d.balance_uzs) || 0), 0);
  }

  fmt(value: number): string {
    if (value == null) return "0.00";
    const abs = Math.abs(value);
    const [intPart, decPart] = abs.toFixed(2).split(".");
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + decPart;
  }
}
