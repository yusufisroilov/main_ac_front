import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { showBackendError } from "src/app/shared/backend-error";
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
  assigned_user_id: number;
  assigned_user_name: string;
  customer_name: string;
  unread_messages_count: number;
  receipt?: "sent" | "replied" | "unread" | "read" | null;
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
export class AdminTicketListComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];

  // Timers for silent auto-refresh (list rows + notification count).
  private static readonly POLL_INTERVAL_MS = 15_000;
  private listPollTimer: any = null;
  private countPollTimer: any = null;
  private onVisibilityChange = () => {
    if (document.hidden) {
      this.stopPolling();
    } else {
      this.getListOfTickets(true);
      this.loadNotificationCount();
      this.startPolling();
    }
  };

  // Pagination
  currentPage: number = 1;
  totalPages: number = 0;
  pageSize: number = 100;
  totalTickets: number = 0;
  needPagination: boolean = false;
  mypages = [];

  // Filters
  searchQuery: string = "";
  selectedStatus: string = "all"; // Changed from "all" to exclude closed tickets by default
  selectedPriority: string = "all";
  selectedCategory: string = "all";
  selectedAssignedTo: string = "";

  // Sort
  sortField: string = "updated_at";
  sortOrder: string = "desc";

  // Loading states
  isLoading: boolean = false;

  // UI state
  statsExpanded: boolean = false;

  // Role-based visibility. This list is shared by every role, but staff-only
  // controls are gated to the roles the backend endpoints actually allow, so a
  // non-permitted user never triggers a 403 (which would log them out).
  role: string = localStorage.getItem("role") || "";
  canReassign: boolean = false; // PUT /admin/:id/reassign → OWNER/MANAGER
  canChangeStatus: boolean = false; // only OWNER/MANAGER may change ticket status
  canExport: boolean = false; // GET /admin/export → OWNER/MANAGER/CHINASTAFF/ADMIN
  canFilterByAssignee: boolean = false; // assigned_to filter only applies for OWNER/MANAGER
  canCreate: boolean = false; // roles whose purpose is filing tickets
  isChinaStaff: boolean = false; // China staff see the UI in English

  // Active UI label set (Uzbek by default, English for CHINASTAFF).
  L: any = {};
  private readonly LABELS = {
    uz: {
      title: "So'rovlar",
      search: "Qidirish...",
      staffId: "Ishchi ID",
      clear: "Tozalash",
      export: "Yuklash",
      refresh: "Yangilash",
      newTicket: "Yangi Murojaat",
      colRequest: "So'rov #",
      colSubject: "Mavzusi",
      colCustomer: "Mijoz (ID)",
      colCategory: "Kategoriya",
      colStatus: "Status",
      colAssigned: "Biriktirilgan",
      colMessages: "Habarlar",
      colTime: "Vaqt",
      noResults: "So'rovlar topilmadi",
      counter: "ta",
      stats: "Statistika",
      statNeedsAttention: "Etibor berish",
      statTotal: "Umumiy",
      statResolved: "Hal bo'lgan",
      statUrgent: "Shoshilinch",
      actView: "Detallarni Ko'rish",
      actStatus: "Statusni O'zgartirish",
      actReassign: "Qayta Biriktirish",
      stOpen: "Ochiq",
      stAnswered: "Javob Berilgan",
      stClosed: "Yopilgan",
    },
    en: {
      title: "Requests",
      search: "Search...",
      staffId: "Staff ID",
      clear: "Clear",
      export: "Export",
      refresh: "Refresh",
      newTicket: "New Ticket",
      colRequest: "Request #",
      colSubject: "Subject",
      colCustomer: "Customer (ID)",
      colCategory: "Category",
      colStatus: "Status",
      colAssigned: "Assigned",
      colMessages: "Messages",
      colTime: "Time",
      noResults: "No requests found",
      counter: "",
      stats: "Statistics",
      statNeedsAttention: "Needs attention",
      statTotal: "Total",
      statResolved: "Resolved",
      statUrgent: "Urgent",
      actView: "View Details",
      actStatus: "Change Status",
      actReassign: "Reassign",
      stOpen: "Open",
      stAnswered: "Answered",
      stClosed: "Closed",
    },
  };

  // Notification count
  notificationCount: number = 0;

  // Stats counters
  resolvedTicketsCount: number = 0;
  urgentTicketsCount: number = 0;

  // Options arrays
  statusOptions: any = [];
  priorityOptions: any = [];
  categoryOptions: any = [];

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
    // Resolve role-based control visibility (mirrors the backend requireRole
    // lists so hidden = not permitted).
    this.role = localStorage.getItem("role") || "";
    this.canReassign = ["OWNER", "MANAGER"].includes(this.role);
    this.canChangeStatus = ["OWNER", "MANAGER"].includes(this.role);
    this.canExport = ["OWNER", "MANAGER", "CHINASTAFF", "ADMIN"].includes(
      this.role
    );
    this.canFilterByAssignee = ["OWNER", "MANAGER"].includes(this.role);
    this.canCreate = ["CLIENT", "CHINASTAFF", "MANAGER", "OWNER"].includes(
      this.role
    );
    this.isChinaStaff = this.role === "CHINASTAFF";
    this.L = this.isChinaStaff ? this.LABELS.en : this.LABELS.uz;

    // Status options
    this.statusOptions = this.isChinaStaff
      ? [
          { value: "all", label: "All Statuses" },
          { value: "unread", label: "Unread" },
          { value: "open", label: "Open" },
          { value: "answered", label: "Answered" },
          { value: "customer-reply", label: "Customer Reply" },
          { value: "closed", label: "Closed" },
        ]
      : [
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
    this.categoryOptions = this.isChinaStaff
      ? [
          { value: "all", label: "All Categories" },
          { value: "delivery", label: "Delivery Issue" },
          { value: "payment", label: "Payment Issue" },
          { value: "product", label: "Order Questions" },
          { value: "customs", label: "Customs Issue" },
          { value: "damaged", label: "Damaged Items" },
          { value: "lost", label: "Lost Items" },
          { value: "pricing", label: "Pricing Questions" },
          { value: "tracking", label: "Tracking Questions" },
          { value: "support", label: "General Support" },
          { value: "complaint", label: "Complaints" },
          { value: "other", label: "Other" },
        ]
      : [
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


    // Initial notification count; periodic refresh is handled by startPolling().
    this.loadNotificationCount();
  }

  ngAfterViewInit() {
    this.getListOfTickets();
    // Silent auto-refresh of both the list rows and the notification count,
    // so the "new message" row highlight appears without a manual reload.
    this.startPolling();
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  private startPolling(): void {
    this.stopPolling();
    if (document.hidden) return;
    this.listPollTimer = setInterval(
      () => this.getListOfTickets(true),
      AdminTicketListComponent.POLL_INTERVAL_MS,
    );
    this.countPollTimer = setInterval(
      () => this.loadNotificationCount(),
      AdminTicketListComponent.POLL_INTERVAL_MS,
    );
  }

  private stopPolling(): void {
    if (this.listPollTimer) {
      clearInterval(this.listPollTimer);
      this.listPollTimer = null;
    }
    if (this.countPollTimer) {
      clearInterval(this.countPollTimer);
      this.countPollTimer = null;
    }
  }

  /**
   * Get list of tickets with pagination
   */
  getListOfTickets(silent: boolean = false) {
    // Silent polls skip the loading spinner so the list doesn't flicker.
    if (!silent) this.isLoading = true;

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
    if (this.selectedAssignedTo && this.selectedAssignedTo.trim()) {
      queryParams += `&assigned_to=${this.selectedAssignedTo.trim()}`;
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
          // console.log("all tickets ", this.tickets);

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
          } else if (!silent) {
            // Don't nag with an error dialog on background polls.
            showBackendError(error, {
              title: this.isChinaStaff ? "Error" : "Xatolik",
              fallback: this.isChinaStaff
                ? "Failed to load tickets. Please try again."
                : "So'rovlarni yuklab bo'lmadi. Qayta urinib ko'ring.",
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
    // Staff roles reply via the admin detail (POST /tickets/admin/:id/reply).
    // CLIENT/AUDITOR are NOT allowed there — sending would 403 and log them out
    // — so route them to the customer detail (POST /tickets/:id/reply instead).
    const STAFF_REPLY_ROLES = [
      "OWNER",
      "MANAGER",
      "CHINASTAFF",
      "YUKCHI",
      "DELIVERER",
      "ACCOUNTANT",
      "ADMIN",
    ];
    const detailPath = STAFF_REPLY_ROLES.includes(this.role)
      ? "/uzm/ticket-detail"
      : "/customer-ticket-detail";
    this.router.navigate([detailPath], {
      queryParams: { ticket: +ticket.id },
    });
  }

  /**
   * Open the create-ticket page (only shown to ticket-filing roles).
   */
  createNewTicket(): void {
    this.router.navigate(["/create-ticket"]);
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
            showBackendError(error, {
              title: this.isChinaStaff ? "Error" : "Xatolik",
              fallback: this.isChinaStaff
                ? "Failed to update status"
                : "Statusni yangilab bo'lmadi",
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
            showBackendError(error, {
              title: this.isChinaStaff ? "Error" : "Xatolik",
              fallback: this.isChinaStaff
                ? "Failed to update priority"
                : "Muhimlik darajasini yangilab bo'lmadi",
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
        title: "Qayta Biriktirish",
        text: "Foydalanuvchi ID raqamini kiriting",
        input: "text",
        inputPlaceholder: "Masalan: 22",
        showCancelButton: true,
        confirmButtonText: "Biriktirish",
        inputValidator: (value) => {
          if (!value || isNaN(parseInt(value))) {
            return "ID raqam bo'lishi kerak!";
          }
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .put(
              GlobalVars.baseUrl + "/tickets/admin/" + ticket.id + "/reassign",
              { assigned_user_id: parseInt(result.value) },
              this.options
            )
            .subscribe(
              (response) => {
                const data = response.json();
                if (data.status === "success") {
                  swal.fire({
                    icon: "success",
                    title: "Muvaffaqiyatli",
                    text: data.message || "Qayta biriktirildi",
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
                  showBackendError(error, {
                    title: this.isChinaStaff ? "Error" : "Xatolik",
                    fallback: this.isChinaStaff
                      ? "Reassign failed"
                      : "Qayta biriktirishda xatolik",
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
    const labels = this.isChinaStaff
      ? {
          unread: "Unread",
          open: "Open",
          answered: "Answered",
          "customer-reply": "Customer Reply",
          closed: "Closed",
        }
      : {
          unread: "O'qilmagan",
          open: "Ochiq",
          answered: "Javob berilgan",
          "customer-reply": "Mijoz Javob Bergan",
          closed: "Yopilgan",
        };
    return labels[status] || status;
  }

  /**
   * Viewer-relative status. A brand-new ticket has status "unread" (support
   * hasn't opened it) — but for the person who FILED it, with nothing unread on
   * their side, that reads wrong. Show "Sent/Yuborilgan" instead. Once someone
   * else replies (unread_messages_count > 0) the real "unread" status shows.
   */
  /**
   * Per-viewer status label. A closed ticket always reads "Closed"; otherwise
   * the backend `receipt` (sent / replied / unread / read — relative to the
   * viewer and the latest message) drives it, falling back to the raw workflow
   * status if no messages exist.
   */
  statusLabelFor(ticket: Ticket): string {
    if (ticket.status === "closed") return this.getStatusLabel("closed");
    const map: any = this.isChinaStaff
      ? { sent: "Sent", replied: "Replied", unread: "Unread", read: "Read" }
      : {
          sent: "Yuborilgan",
          replied: "Javob berildi",
          unread: "O'qilmagan",
          read: "O'qildi",
        };
    if (ticket.receipt && map[ticket.receipt]) return map[ticket.receipt];
    return this.getStatusLabel(ticket.status);
  }

  statusClassFor(ticket: Ticket): string {
    if (ticket.status === "closed") return this.getStatusClass("closed");
    const cls: any = {
      sent: "badge-info",
      replied: "badge-primary",
      unread: "badge-danger",
      read: "badge-success",
    };
    if (ticket.receipt && cls[ticket.receipt]) return cls[ticket.receipt];
    return this.getStatusClass(ticket.status);
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
    this.selectedAssignedTo = "";
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
            showBackendError(error, {
              title: this.isChinaStaff ? "Error" : "Xatolik",
              fallback: this.isChinaStaff
                ? "Failed to export tickets"
                : "Eksport qilib bo'lmadi",
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
