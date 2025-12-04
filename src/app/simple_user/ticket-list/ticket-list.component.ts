import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  unread_messages_count: number;
  messages_count: number;
  created_at: string;
  updated_at: string;
  last_reply_at: string;
}

@Component({
  selector: "app-customer-ticket-list",
  templateUrl: "./ticket-list.component.html",
  styleUrls: ["./ticket-list.component.css"],
})
export class CustomerTicketListComponent implements OnInit {
  tickets: Ticket[] = [];

  // Pagination
  currentPage: number = 1;
  totalPages: number = 0;
  pageSize: number = 10;
  totalTickets: number = 0;
  needPagination: boolean = false;
  mypages = [];

  // Filters
  searchQuery: string = "";
  selectedStatus: string = "all";
  selectedPriority: string = "all";
  selectedCategory: string = "all";

  // Loading state
  isLoading: boolean = false;

  // Math for template
  Math = Math;

  // Options arrays
  statusOptions: any = [];
  priorityOptions: any = [];
  categoryOptions: any = [];

  // HTTP setup
  headers12: any;
  options: any;

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
    // Status options (simplified for customers)
    this.statusOptions = [
      { value: "all", label: "All Tickets" },
      { value: "unread", label: "Unread" },
      { value: "open", label: "Open" },
      { value: "answered", label: "Answered by Support" },
      { value: "customer-reply", label: "Waiting for Support" },
      { value: "closed", label: "Closed" },
    ];

    // Priority options
    this.priorityOptions = [
      { value: "all", label: "All Priorities" },
      { value: "Urgent", label: "Urgent" },
      { value: "High", label: "High" },
      { value: "Medium", label: "Medium" },
      { value: "Low", label: "Low" },
    ];

    // Category options
    this.categoryOptions = [
      { value: "all", label: "All Categories" },
      { value: "delivery", label: "Delivery Issue" },
      { value: "payment", label: "Payment" },
      { value: "product", label: "Product Question" },
      { value: "customs", label: "Customs" },
      { value: "damaged", label: "Damaged Cargo" },
      { value: "lost", label: "Lost Package" },
      { value: "pricing", label: "Pricing" },
      { value: "tracking", label: "Tracking" },
      { value: "support", label: "General Support" },
      { value: "complaint", label: "Complaint" },
      { value: "other", label: "Other" },
    ];
  }

  ngAfterViewInit() {
    this.getListOfTickets();
  }

  /**
   * Get list of customer's tickets with pagination
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
    if (this.searchQuery.trim()) {
      queryParams += `&search=${encodeURIComponent(this.searchQuery.trim())}`;
    }

    // Add sort params
    queryParams += `&sort_by=updated_at&sort_order=desc`;

    return this.http
      .get(
        GlobalVars.baseUrl + "/tickets/my-tickets" + queryParams,
        this.options
      )
      .subscribe(
        (response) => {
          const data = response.json();
          if (data.status === "success") {
            this.tickets = data.tickets || [];
            console.log("tickets ", this.tickets);

            this.currentPage = data.pagination.page;
            this.totalPages = data.pagination.total_pages;
            this.totalTickets = this.tickets.length;
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
          } else {
            this.tickets = [];
            this.isLoading = false;
          }
        },
        (error) => {
          console.error("Error loading tickets:", error);
          this.tickets = [];
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

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.getListOfTickets();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery = "";
    this.selectedStatus = "all";
    this.selectedPriority = "all";
    this.selectedCategory = "all";
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
    this.router.navigate(["/customer-ticket-detail"], {
      queryParams: { ticket: ticket.id },
    });
  }

  /**
   * Navigate to create ticket
   */
  createNewTicket(): void {
    this.router.navigate(["/create-ticket"]);
  }

  /**
   * Check if ticket has unread messages
   */
  hasUnreadMessages(ticket: Ticket): boolean {
    return (ticket.unread_messages_count || 0) > 0;
  }

  /**
   * Check if ticket is waiting for customer reply
   */
  isWaitingForCustomer(ticket: Ticket): boolean {
    return ticket.status === "answered";
  }

  /**
   * Check if ticket is waiting for support
   */
  isWaitingForSupport(ticket: Ticket): boolean {
    return (
      ticket.status === "customer-reply" ||
      ticket.status === "unread" ||
      ticket.status === "open"
    );
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const classes = {
      unread: "badge-warning",
      open: "badge-info",
      answered: "badge-success",
      "customer-reply": "badge-purple",
      closed: "badge-secondary",
    };
    return classes[status] || "badge-secondary";
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels = {
      unread: "Unread",
      open: "Open",
      answered: "Answered",
      "customer-reply": "Waiting for Support",
      closed: "Closed",
    };
    return labels[status] || status;
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: string): string {
    const classes = {
      Urgent: "badge-danger",
      High: "badge-danger",
      Medium: "badge-warning",
      Low: "badge-info",
    };
    return classes[priority] || "badge-secondary";
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: string): string {
    return priority || "Medium";
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      delivery: "local_shipping",
      payment: "payment",
      product: "inventory_2",
      customs: "gavel",
      damaged: "broken_image",
      lost: "search_off",
      pricing: "attach_money",
      tracking: "my_location",
      support: "help",
      complaint: "report",
      other: "more_horiz",
    };
    return iconMap[category] || "confirmation_number";
  }

  /**
   * Get friendly category label
   */
  getCategoryLabel(category: string): string {
    const labelMap: { [key: string]: string } = {
      delivery: "Delivery Issue",
      payment: "Payment",
      product: "Product Question",
      customs: "Customs",
      damaged: "Damaged Cargo",
      lost: "Lost Package",
      pricing: "Pricing",
      tracking: "Tracking",
      support: "General Support",
      complaint: "Complaint",
      other: "Other",
    };
    return labelMap[category] || category;
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
   * Get status explanation text
   */
  getStatusExplanation(status: string): string {
    const explanations: { [key: string]: string } = {
      unread: "Your ticket has been received",
      open: "Support is reviewing your ticket",
      answered: "Support has replied",
      "customer-reply": "Waiting for support response",
      closed: "Ticket resolved",
    };
    return explanations[status] || "";
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return (
      this.selectedStatus !== "all" ||
      this.selectedCategory !== "all" ||
      this.selectedPriority !== "all" ||
      this.searchQuery.trim() !== ""
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
}
