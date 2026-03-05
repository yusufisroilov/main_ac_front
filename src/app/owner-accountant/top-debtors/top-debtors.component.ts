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

  fmt(value: number): string {
    if (value == null) return "0";
    return Math.floor(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
}
