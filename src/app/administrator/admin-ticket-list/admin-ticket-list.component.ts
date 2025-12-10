import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { HttpClient } from "@angular/common/http";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string;
  customer_name: string;
  unread_messages_count: number;
  messages_count: number;
  created_at: string;
  updated_at: string;
  last_reply_at: string;
}

@Component({
  selector: "app-admin-ticket-list",
  templateUrl: "./admin-ticket-list.component.html",
  styleUrls: ["./admin-ticket-list.component.css"],
})
export class AdminTicketListComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];

  // Pagination
  currentPage: number = 1;
  totalPages: number = 0;
  pageSize: number = 20;
  totalTickets: number = 0;
  needPagination: boolean = false;
  mypages = [];

  // Filters
  searchQuery: string = "";
  selectedStatus: string = "all"; // Changed from "all" to exclude closed tickets by default
  selectedPriority: string = "all";
  selectedCategory: string = "all";
  selectedAssignedTo: string = "all";

  // Sort
  sortField: string = "updated_at";
  sortOrder: string = "desc";

  // Loading states
  isLoading: boolean = false;

  // Notification count
  notificationCount: number = 0;

  // Stats counters
  resolvedTicketsCount: number = 0;
  urgentTicketsCount: number = 0;

  // Options arrays
  statusOptions: any = [];
  priorityOptions: any = [];
  categoryOptions: any = [];
  assignedToOptions: any = [];

  // HTTP setup
  headers12: any;
  options: any;

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit(): void {
    // Status options
    this.statusOptions = [
      { value: "all", label: "Barcha Statuslar" },
      { value: "unread", label: "O'qilmagan" },
      { value: "open", label: "Ochiq" },
      { value: "answered", label: "Javob Berilgan" },
      { value: "customer-reply", label: "Mijoz Javobi" },
      { value: "closed", label: "Yopilgan" },
    ];

    // Priority options
    this.priorityOptions = [
      { value: "all", label: "Barcha muhimlik darajasi" },
      { value: "Urgent", label: "Shoshilinch" },
      { value: "High", label: "Baland" },
      { value: "Medium", label: "O'rtacha" },
      { value: "Low", label: "Past" },
    ];

    // Category options
    this.categoryOptions = [
      { value: "all", label: "Barcha Kategoriyalar" },
      { value: "delivery", label: "Yetkazish Muammosi" },
      { value: "payment", label: "To'lov Muammosi" },
      { value: "product", label: "Zakaz Bo'yicha Savollar" },
      { value: "customs", label: "Bojxona muammosi" },
      { value: "damaged", label: "Shikastlangan Narsalar" },
      { value: "lost", label: "Yo'qolgan Narsalar" },
      { value: "pricing", label: "Narx Bo'yicha Savollar" },
      { value: "tracking", label: "Kuzatish Bo'yicha Savollar" },
      { value: "support", label: "Umumiya Konsultatsiya" },
      { value: "complaint", label: "Shikoyatlar" },
      { value: "other", label: "Boshqa" },
    ];

    // Assigned to options (roles)
    this.assignedToOptions = [
      { value: "all", label: "Barcha Ishchilar" },
      { value: "DELIVERER", label: "Kuryer" },
      { value: "ACCOUNTANT", label: "Bugalter" },
      { value: "YUKCHI", label: "Yukchi" },
      { value: "CHINASTAFF", label: "Xitoylik" },
      { value: "MANAGER", label: "Manager" },
      { value: "ADMIN", label: "Admin" },
    ];

    this.startNotificationPolling();
  }

  ngAfterViewInit() {
    this.getListOfTickets();
  }

  /**
   * Get list of tickets with pagination
   */
  getListOfTickets() {
    this.isLoading = true;

    // Build query params
    let queryParams = `?page=${this.currentPage}&limit=${this.pageSize}`;

    if (this.selectedStatus !== "all") {
      queryParams += `&status=${this.selectedStatus}`;
    }
    if (this.selectedPriority !== "all") {
      queryParams += `&priority=${this.selectedPriority}`;
    }
    if (this.selectedCategory !== "all") {
      queryParams += `&category=${this.selectedCategory}`;
    }
    if (this.selectedAssignedTo !== "all") {
      queryParams += `&assigned_to=${this.selectedAssignedTo}`;
    }
    if (this.searchQuery.trim()) {
      queryParams += `&search=${encodeURIComponent(this.searchQuery.trim())}`;
    }

    return this.http
      .get(
        GlobalVars.baseUrl + "/tickets/admin/all" + queryParams,
        this.options
      )
      .subscribe(
        (response) => {
          const data = response.json();
          this.tickets = data.tickets;
          console.log("all tickets ", this.tickets);

          this.getResolvedCounts(this.tickets);
          this.getUrgentCounts(this.tickets);
          this.filteredTickets = data.tickets;
          this.totalPages = data.pagination.total_pages;
          this.totalTickets = data.pagination.total;

          this.isLoading = false;

          if (this.totalPages > 1) {
            this.needPagination = true;
            this.mypages = [];
            for (let i = 0; i < this.totalPages; i++) {
              this.mypages[i] = { id: "page" + i };
            }
          } else {
            this.needPagination = false;
          }
        },
        (error) => {
          console.error("Error loading tickets:", error);
          this.isLoading = false;
          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to load tickets. Please try again.",
            });
          }
        }
      );
  }

  /**
   * Handle search input
   */
  onSearch(): void {
    this.currentPage = 1;
    this.getListOfTickets();
  }

  getResolvedCounts(tickets: any) {
    // Calculate resolved tickets (closed status)
    this.resolvedTicketsCount = tickets.filter(
      (ticket) => ticket.status === "closed"
    ).length;
  }

  getUrgentCounts(tickets: any) {
    // Calculate resolved tickets (closed status)
    this.urgentTicketsCount = tickets.filter(
      (ticket) => ticket.priority === "Urgent"
    ).length;
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.getListOfTickets();
  }

  /**
   * Handle pagination by page number
   */
  pagebyNum(ipage: number) {
    this.currentPage = ipage;
    document.getElementById("listcard")?.scrollIntoView({ behavior: "smooth" });
    this.getListOfTickets();
  }

  /**
   * Handle page change from pagination component
   */
  onPageChanged(pageIndex: number) {
    this.currentPage = pageIndex;
    document.getElementById("listcard")?.scrollIntoView({ behavior: "smooth" });
    this.getListOfTickets();
  }

  /**
   * Handle pagination
   */
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.getListOfTickets();
    window.scrollTo(0, 0);
  }

  /**
   * View ticket detail
   */
  viewTicket(ticket: Ticket): void {
    this.router.navigate(["/uzm/ticket-detail"], {
      queryParams: { ticket: +ticket.id },
    });
  }

  /**
   * Quick status update
   */
  quickUpdateStatus(ticket: Ticket, newStatus: string): void {
    this.http
      .put(
        GlobalVars.baseUrl + "/tickets/admin/" + ticket.id + "/status",
        { status: newStatus },
        this.options
      )
      .subscribe(
        (response) => {
          this.getListOfTickets();
          if (response.json().status === "success") {
            ticket.status = newStatus;
            swal.fire({
              icon: "success",
              title: "Success",
              text: "Ticket status updated",
              timer: 1500,
              showConfirmButton: false,
            });
            this.getListOfTickets();
          }
        },
        (error) => {
          console.error("Error updating status:", error);
          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update status",
            });
          }
        }
      );
  }

  /**
   * Quick priority update
   */
  quickUpdatePriority(ticket: Ticket, newPriority: string): void {
    this.http
      .put(
        GlobalVars.baseUrl + "/tickets/admin/" + ticket.id + "/priority",
        { priority: newPriority },
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            ticket.priority = newPriority;
            swal.fire({
              icon: "success",
              title: "Success",
              text: "Ticket priority updated",
              timer: 1500,
              showConfirmButton: false,
            });
            this.getListOfTickets();
          }
        },
        (error) => {
          console.error("Error updating priority:", error);
          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update priority",
            });
          }
        }
      );
  }

  /**
   * Reassign ticket
   */
  reassignTicket(ticket: Ticket): void {
    swal
      .fire({
        title: "Qayta Biriktirish So'rovni",
        input: "select",
        inputOptions: {
          DELIVERER: "Kuryer",
          ACCOUNTANT: "Bugalter",
          YUKCHI: "Yukchi",
          CHINASTAFF: "Xitoylik",
          MANAGER: "Manager",
          ADMIN: "Admin",
        },
        inputPlaceholder: "Yangi Biriktiriluvchini Tanlash",
        showCancelButton: true,
        confirmButtonText: "Qayta Biriktirish",
        inputValidator: (value) => {
          if (!value) {
            return "You need to select someone!";
          }
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .put(
              GlobalVars.baseUrl + "/tickets/admin/" + ticket.id + "/reassign",
              { assigned_to: result.value },
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status === "success") {
                  ticket.assigned_to = result.value;
                  swal.fire({
                    icon: "success",
                    title: "Success",
                    text: "Ticket reassigned successfully",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                  this.getListOfTickets();
                }
              },
              (error) => {
                console.error("Error reassigning ticket:", error);
                if (error.status == 403) {
                  this.authService.logout();
                } else {
                  swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to reassign ticket",
                  });
                }
              }
            );
        }
      });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const classes = {
      unread: "badge-danger",
      open: "badge-primary",
      answered: "badge-info",
      "customer-reply": "badge-warning",
      closed: "badge-success",
    };
    return classes[status] || "badge-secondary";
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: string): string {
    const classes = {
      Urgent: "badge-danger",
      High: "badge-warning",
      Medium: "badge-info",
      Low: "badge-success",
    };
    return classes[priority] || "badge-secondary";
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels = {
      unread: "O'qilmagan",
      open: "Ochiq",
      answered: "Javob berilgan",
      "customer-reply": "Mijoz Javob Bergan",
      closed: "Yopilgan",
    };
    return labels[status] || status;
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
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
   * Get time ago string
   */
  getTimeAgo(date: string): string {
    if (!date) return "-";

    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return this.formatDate(date);
  }

  /**
   * Start polling for notifications
   */
  startNotificationPolling(): void {
    // Initial load
    this.loadNotificationCount();

    // Poll every 30 seconds
    setInterval(() => {
      this.loadNotificationCount();
    }, 30000);
  }

  /**
   * Load notification count
   */
  loadNotificationCount(): void {
    this.http
      .get(
        GlobalVars.baseUrl + "/tickets/admin/notifications/count",
        this.options
      )
      .subscribe(
        (response) => {
          const data = response.json();
          this.notificationCount = data.notifications.total_needs_attention;
        },
        (error) => {
          console.error("Error fetching notification count:", error);
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.searchQuery = "";
    this.selectedStatus = "all";
    this.selectedPriority = "all";
    this.selectedCategory = "all";
    this.selectedAssignedTo = "all";
    this.currentPage = 1;
    this.getListOfTickets();
  }

  /**
   * Export tickets to Excel
   */
  exportToExcel(): void {
    let queryParams = "?";

    if (this.selectedStatus !== "all") {
      queryParams += `status=${this.selectedStatus}&`;
    }
    if (this.selectedPriority !== "all") {
      queryParams += `priority=${this.selectedPriority}&`;
    }
    if (this.selectedCategory !== "all") {
      queryParams += `category=${this.selectedCategory}&`;
    }

    // Using HttpClient for blob download
    this.httpClient
      .get(GlobalVars.baseUrl + "/tickets/admin/export" + queryParams, {
        responseType: "blob",
        headers: {
          Authorization: localStorage.getItem("token") || "",
        },
      })
      .subscribe(
        (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `tickets_export_${new Date().getTime()}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);

          swal.fire({
            icon: "success",
            title: "Success",
            text: "Tickets exported successfully",
            timer: 1500,
            showConfirmButton: false,
          });
        },
        (error) => {
          console.error("Error exporting tickets:", error);
          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to export tickets",
            });
          }
        }
      );
  }

  /**
   * Generate page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Math helper for template
   */
  Math = Math;
}
