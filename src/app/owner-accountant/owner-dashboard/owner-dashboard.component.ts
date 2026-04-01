import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
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
  cashAccounts: any[] = [];

  activePeriod: "this_month" | "last_month" | "custom" = "this_month";
  customFrom = "";
  customTo = "";

  // Delivery requests & tickets
  recentDeliveryRequests: any[] = [];
  recentTickets: any[] = [];
  loadingRequests = false;
  loadingTickets = false;

  constructor(private http: HttpClient, private router: Router, public authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  get negativeAccounts(): any[] {
    return this.cashAccounts.filter((a) => a.is_active && Number(a.balance) < 0);
  }

  ngOnInit() {
    this.loadStats();
    this.loadCashAccounts();
    this.loadRecentDeliveryRequests();
    this.loadRecentTickets();
  }

  loadCashAccounts() {
    this.http.get<any>(`${GlobalVars.baseUrl}/cash-accounts?active=true`, { headers: this.getHeaders() }).subscribe(
      (res) => { this.cashAccounts = res.accounts || []; },
    );
  }

  setPeriod(p: "this_month" | "last_month" | "custom") {
    this.activePeriod = p;
    if (p !== "custom") this.loadStats();
  }

  applyCustomRange() {
    if (this.customFrom && this.customTo) this.loadStats();
  }

  loadStats() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/owner/dashboard-stats?period=${this.activePeriod}`;
    if (this.activePeriod === "custom" && this.customFrom && this.customTo) {
      url += `&from=${this.customFrom}&to=${this.customTo}`;
    }
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => { this.stats = data; this.loading = false; },
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

  // ── Delivery Requests & Tickets ──

  loadRecentDeliveryRequests() {
    this.loadingRequests = true;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/requests/pending?limit=10`, { headers: this.getHeaders() })
      .subscribe(
        (data) => { this.recentDeliveryRequests = data.data?.requests || []; this.loadingRequests = false; },
        () => { this.loadingRequests = false; },
      );
  }

  loadRecentTickets() {
    this.loadingTickets = true;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/tickets/admin/all?limit=10&sort_by=updated_at&sort_order=DESC`, { headers: this.getHeaders() })
      .subscribe(
        (data) => { this.recentTickets = data.tickets || []; this.loadingTickets = false; },
        () => { this.loadingTickets = false; },
      );
  }

  goToDeliveryRequests() { this.router.navigate(["/uzm/admin-del-requests"]); }
  goToTicketsList() { this.router.navigate(["/uzm/tickets-list"]); }
  viewTicket(ticket: any) { this.router.navigate(["/uzm/ticket-detail"], { queryParams: { ticket: ticket.id } }); }

  getTicketStatusClass(s: string): string {
    return { unread: "badge-danger", open: "badge-primary", answered: "badge-info", "customer-reply": "badge-warning", closed: "badge-success" }[s] || "badge-secondary";
  }
  getTicketStatusLabel(s: string): string {
    return { unread: "O'qilmagan", open: "Ochiq", answered: "Javob berilgan", "customer-reply": "Mijoz javobi", closed: "Yopilgan" }[s] || s;
  }
}
