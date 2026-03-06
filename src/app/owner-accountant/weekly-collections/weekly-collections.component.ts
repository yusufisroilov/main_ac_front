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
  weeks = 4;
  includePending = false;

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
    const url = `${GlobalVars.baseUrl}/owner/weekly-collections?weeks=${this.weeks}&include_pending=${this.includePending}`;
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => { this.collections = data.collections || []; this.loading = false; },
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
