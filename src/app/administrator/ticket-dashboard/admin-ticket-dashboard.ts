import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-admin-ticket-dashboard",
  templateUrl: "./admin-ticket-dashboard.html",
  styleUrls: ["./admin-ticket-dashboard.component.css"],
})
export class AdminTicketDashboardComponent implements OnInit {
  // Stat cards
  totalTickets = 0;
  unreadTickets = 0;
  openTickets = 0;
  needsResponseTickets = 0;

  // Charts (progress rows)
  statusStats: Record<string, number> = {};
  priorityStats: Record<string, number> = {};
  categoryStats: Record<string, number> = {};
  avgResolutionTime = 0; // hours

  // Recent tickets
  recentTickets: any[] = [];
  loadingStats = false;
  loadingRecent = false;

  // HTTP setup
  headers12: any;
  options: any;

  // Polling interval reference
  private notificationInterval: any;

  constructor(
    private http: Http,
    private router: Router,
    public authService: AuthService
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit(): void {
    this.loadAll();
    this.startNotificationPolling();
  }

  ngOnDestroy(): void {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  /**
   * Load all dashboard data
   */
  private loadAll(): void {
    this.loadStatistics();
    this.loadRecentTickets();
    this.loadNotificationCount();
  }

  /**
   * Load ticket statistics
   */
  private loadStatistics(): void {
    this.loadingStats = true;

    this.http
      .get(GlobalVars.baseUrl + "/tickets/admin/stats", this.options)
      .subscribe(
        (response) => {
          const data = response.json();

          if (data.status === "success") {
            const stats = data.stats || {};

            this.totalTickets = stats.total || 0;

            // Status cards
            this.unreadTickets = stats.by_status?.unread || 0;
            this.openTickets = stats.by_status?.open || 0;
            this.needsResponseTickets =
              this.unreadTickets + (stats.by_status?.["customer-reply"] || 0);

            // Charts data
            this.statusStats = stats.by_status || {};
            this.priorityStats = stats.by_priority || {};
            this.categoryStats = stats.by_category || {};
            this.avgResolutionTime = stats.avg_resolution_time_hours || 0;
          }
          this.loadingStats = false;
        },
        (error) => {
          console.error("Error loading statistics:", error);
          this.loadingStats = false;

          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Ошибка",
              text: "Не удалось загрузить статистику",
            });
          }
        }
      );
  }

  /**
   * Load recent tickets
   */
  private loadRecentTickets(): void {
    this.loadingRecent = true;

    const queryParams = "?limit=10&sort_by=updated_at&sort_order=DESC";

    this.http
      .get(
        GlobalVars.baseUrl + "/tickets/admin/all" + queryParams,
        this.options
      )
      .subscribe(
        (response) => {
          const data = response.json();
          this.recentTickets = data.tickets || [];
          console.log("recent tickets ", this.recentTickets);

          this.loadingRecent = false;
        },
        (error) => {
          console.error("Error loading recent tickets:", error);
          this.loadingRecent = false;

          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  /**
   * Load notification count
   */
  private loadNotificationCount(): void {
    this.http
      .get(
        GlobalVars.baseUrl + "/tickets/admin/notifications/count",
        this.options
      )
      .subscribe(
        (response) => {
          const data = response.json();
          if (data.status === "success") {
            const notifications = data.notifications || {};
            this.unreadTickets = notifications.unread || 0;
            this.needsResponseTickets =
              notifications.total_needs_attention || 0;
          }
        },
        (error) => {
          console.error("Error loading notification count:", error);
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  /**
   * Start polling for notifications
   */
  private startNotificationPolling(): void {
    // Poll every 30 seconds
    this.notificationInterval = setInterval(() => {
      const prevNeeds = this.needsResponseTickets;

      this.http
        .get(
          GlobalVars.baseUrl + "/tickets/admin/notifications/count",
          this.options
        )
        .subscribe(
          (response) => {
            const data = response.json();
            if (data.status === "success") {
              const notifications = data.notifications || {};
              this.unreadTickets = notifications.unread || 0;
              this.needsResponseTickets =
                notifications.total_needs_attention || 0;

              // If count increased, show toast and refresh recent
              if (this.needsResponseTickets > prevNeeds) {
                this.toastNewActivity();
                this.loadRecentTickets();
              }
            }
          },
          (error) => {
            console.error("Error polling notifications:", error);
            if (error.status == 403) {
              this.authService.logout();
            }
          }
        );
    }, 30000);
  }

  /**
   * Show toast notification for new activity
   */
  private toastNewActivity(): void {
    swal.fire({
      icon: "info",
      title: "Новая активность!",
      text: "Есть новые тикеты, требующие внимания",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  /**
   * Navigate to ticket detail
   */
  viewTicket(ticket: any): void {
    this.router.navigate(["/uzm/ticket-detail"], {
      queryParams: { ticket: ticket.id },
    });
  }

  /**
   * Navigate to tickets filtered by status
   */
  viewTicketsByStatus(status: string): void {
    this.router.navigate(["/uzm/tickets-list"], {
      queryParams: { status },
    });
  }

  /**
   * Navigate to all tickets
   */
  viewAllTickets(): void {
    this.router.navigate(["/uzm/tickets-list"]);
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadAll();
    swal.fire({
      icon: "success",
      title: "Обновлено!",
      text: "Данные успешно обновлены",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
    });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      unread: "badge-danger",
      open: "badge-primary",
      answered: "badge-info",
      "customer-reply": "badge-warning",
      closed: "badge-success",
    };
    return map[status] || "badge-secondary";
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      Urgent: "badge-danger",
      High: "badge-warning",
      Medium: "badge-info",
      Low: "badge-success",
    };
    return map[priority] || "badge-secondary";
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      unread: "Unread",
      open: "Open",
      answered: "Answered",
      "customer-reply": "Customer Reply",
      closed: "Closed",
    };
    return labels[status] ?? status;
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: string): string {
    return priority || "-";
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Get status chart data for progress bars
   */
  getStatusChartData(): Array<{ label: string; value: number; class: string }> {
    return Object.keys(this.statusStats).map((key) => ({
      label: this.getStatusLabel(key),
      value: this.statusStats[key],
      class: this.getStatusClass(key),
    }));
  }

  /**
   * Get priority chart data for progress bars
   */
  getPriorityChartData(): Array<{
    label: string;
    value: number;
    class: string;
  }> {
    return Object.keys(this.priorityStats).map((key) => ({
      label: key,
      value: this.priorityStats[key],
      class: this.getPriorityClass(key),
    }));
  }

  /**
   * Calculate percentage for progress bars
   */
  calculatePercentage(value: number): number {
    if (!value || !this.totalTickets) return 0;
    return Math.round((value / this.totalTickets) * 100);
  }
}
