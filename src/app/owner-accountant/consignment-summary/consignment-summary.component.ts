import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-consignment-summary",
  templateUrl: "./consignment-summary.component.html",
  styleUrls: ["./consignment-summary.component.css"],
})
export class ConsignmentSummaryComponent implements OnInit {
  summaries: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;
  filterConsignment = "";

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
    let url = `${GlobalVars.baseUrl}/owner/consignment-summary?page=${this.currentPage}&size=${this.pageSize}`;
    if (this.filterConsignment) url += `&consignment=${this.filterConsignment}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.summaries = data.summaries || [];
        this.totalItems = data.totalItems || 0;
        this.totalPages = data.totalPages || 0;
        this.currentPage = data.currentPage || 0;
        this.loading = false;
      },
      (error) => { this.loading = false; if (error.status === 403) this.authService.logout(); },
    );
  }

  applyFilters() { this.currentPage = 0; this.loadData(); }
  clearFilters() { this.filterConsignment = ""; this.currentPage = 0; this.loadData(); }
  onPageChanged(page: number) { this.currentPage = page; this.loadData(); }

  fmt(value: number): string {
    if (value == null) return "0.00";
    const abs = Math.abs(value);
    const [intPart, decPart] = abs.toFixed(2).split(".");
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + decPart;
  }
}
