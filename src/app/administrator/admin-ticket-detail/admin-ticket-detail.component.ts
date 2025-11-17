import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

interface TicketMessage {
  id: number;
  sender_type: "customer" | "staff";
  sender_name: string;
  message_text: string;
  is_internal: boolean;
  created_at: string;
  attachments?: any[];
}

interface ActivityLog {
  id: number;
  action_type: string;
  action_description: string;
  performed_by: string;
  created_at: string;
}

interface TicketDetail {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string;
  assigned_user_id?: number;
  customer: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    telegramId?: string;
    phone?: string;
    email?: string;
  };
  shipment_code?: string;
  first_response_at?: string;
  resolved_at?: string;
  resolution_code?: string;
  sla_response_due?: string;
  sla_resolution_due?: string;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
  activityLog: ActivityLog[];
  attachments?: any[];
}

@Component({
  selector: "app-admin-ticket-detail",
  templateUrl: "./admin-ticket-detail.component.html",
  styleUrls: ["./admin-ticket-detail.component.css"],
})
export class AdminTicketDetailComponent implements OnInit {
  ticket: TicketDetail | null = null;
  ticketId: string = "";
  isLoading: boolean = true;

  // Filtered messages (exclude internal notes for display in main thread)
  customerMessages: TicketMessage[] = [];
  internalNotes: TicketMessage[] = [];

  // Current user role
  currentUserRole: string = localStorage.getItem("role") || "STAFF";

  // HTTP setup
  headers12: any;
  options: any;

  // Status options
  statusOptions: any = [];

  // Priority options
  priorityOptions: any = [];

  // Category options
  categoryOptions: any = [];

  // Assigned to options (roles)
  assignedToOptions: any = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
    public authService: AuthService
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit(): void {
    // Initialize options arrays
    this.statusOptions = [
      { value: "unread", label: "Unread" },
      { value: "open", label: "Open" },
      { value: "answered", label: "Answered" },
      { value: "customer-reply", label: "Customer Reply" },
      { value: "closed", label: "Closed" },
    ];

    this.priorityOptions = [
      { value: "Urgent", label: "Urgent" },
      { value: "High", label: "High" },
      { value: "Medium", label: "Medium" },
      { value: "Low", label: "Low" },
    ];

    this.categoryOptions = [
      { value: "delivery", label: "Delivery Issue" },
      { value: "payment", label: "Payment Issue" },
      { value: "product", label: "Product Question" },
      { value: "customs", label: "Customs Issue" },
      { value: "damaged", label: "Damaged Cargo" },
      { value: "lost", label: "Lost Package" },
      { value: "pricing", label: "Pricing Question" },
      { value: "tracking", label: "Tracking Issue" },
      { value: "support", label: "General Support" },
      { value: "complaint", label: "Complaint" },
      { value: "other", label: "Other" },
    ];

    this.assignedToOptions = [
      { value: "DELIVERER", label: "Deliverer" },
      { value: "ACCOUNTANT", label: "Accountant" },
      { value: "YUKCHI", label: "Yukchi" },
      { value: "CHINASTAFF", label: "China Staff" },
      { value: "MANAGER", label: "Manager" },
    ];

    // Get ticket ID from query params
    this.route.queryParams.subscribe((params) => {
      this.ticketId = params["ticket"];
      if (this.ticketId) {
        this.loadTicketDetail();
      }
    });
  }

  ngAfterViewInit() {
    // Additional initialization if needed
  }

  /**
   * Load ticket detail from API
   */
  loadTicketDetail(): void {
    this.isLoading = true;

    this.http
      .get(GlobalVars.baseUrl + "/tickets/admin/" + this.ticketId, this.options)
      .subscribe(
        (response) => {
          const data = response.json();

          this.ticket = data.ticket;
          console.log("ticket ", this.ticket);

          // Separate customer messages and internal notes
          if (this.ticket && this.ticket.messages) {
            this.customerMessages = this.ticket.messages.filter(
              (m) => !m.is_internal
            );
            this.internalNotes = this.ticket.messages.filter(
              (m) => m.is_internal
            );
          }

          this.isLoading = false;
        },
        (error) => {
          console.error("Error loading ticket:", error);
          this.isLoading = false;

          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal
              .fire({
                icon: "error",
                title: "Error",
                text: "Failed to load ticket details. Please try again.",
                confirmButtonText: "Go Back",
              })
              .then(() => {
                this.router.navigate(["/uzm/tickets"]);
              });
          }
        }
      );
  }

  /**
   * Handle staff reply submission
   */
  onStaffReply(data: { message: string; closeAfterReply: boolean }): void {
    if (!this.ticket) return;

    const body = {
      message_text: data.message,
      close_after_reply: data.closeAfterReply,
    };

    this.http
      .post(
        GlobalVars.baseUrl + "/tickets/admin/" + this.ticket.id + "/reply",
        body,
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            swal.fire({
              icon: "success",
              title: "Success",
              text: "Reply sent successfully",
              timer: 1500,
              showConfirmButton: false,
            });

            // Reload ticket to show new message
            this.loadTicketDetail();
          }
        },
        (error) => {
          console.error("Error sending reply:", error);
          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to send reply. Please try again.",
            });
          }
        }
      );
  }

  /**
   * Handle internal note submission
   */
  onInternalNote(noteText: string): void {
    if (!this.ticket) return;

    const body = {
      note_text: noteText,
    };

    this.http
      .post(
        GlobalVars.baseUrl +
          "/tickets/admin/" +
          this.ticket.id +
          "/internal-note",
        body,
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            swal.fire({
              icon: "success",
              title: "Success",
              text: "Internal note added",
              timer: 1500,
              showConfirmButton: false,
            });

            // Reload ticket to show new note
            this.loadTicketDetail();
          }
        },
        (error) => {
          console.error("Error adding note:", error);
          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to add internal note. Please try again.",
            });
          }
        }
      );
  }

  /**
   * Update ticket status
   */
  updateStatus(newStatus: string): void {
    if (!this.ticket) return;

    // If closing ticket, ask for resolution code
    if (newStatus === "closed") {
      swal
        .fire({
          title: "Close Ticket",
          input: "select",
          inputOptions: {
            resolved: "Resolved",
            duplicate: "Duplicate",
            "cannot-resolve": "Cannot Resolve",
            "customer-no-response": "Customer No Response",
          },
          inputPlaceholder: "Select resolution reason",
          showCancelButton: true,
          confirmButtonText: "Close Ticket",
          inputValidator: (value) => {
            if (!value) {
              return "You need to select a reason!";
            }
          },
        })
        .then((result) => {
          if (result.isConfirmed) {
            this.performStatusUpdate(newStatus, result.value);
          }
        });
    } else {
      this.performStatusUpdate(newStatus);
    }
  }

  /**
   * Perform the actual status update
   */
  private performStatusUpdate(status: string, resolutionCode?: string): void {
    if (!this.ticket) return;

    const body: any = { status: status };
    if (resolutionCode) {
      body.resolution_code = resolutionCode;
    }

    this.http
      .put(
        GlobalVars.baseUrl + "/tickets/admin/" + this.ticket.id + "/status",
        body,
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            if (this.ticket) {
              this.ticket.status = status;
              if (resolutionCode) {
                this.ticket.resolution_code = resolutionCode;
              }
            }

            swal.fire({
              icon: "success",
              title: "Success",
              text: "Ticket status updated",
              timer: 1500,
              showConfirmButton: false,
            });

            // Reload to get updated activity log
            this.loadTicketDetail();
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
              text: "Failed to update status. Please try again.",
            });
          }
        }
      );
  }

  /**
   * Update ticket priority
   */
  updatePriority(newPriority: string): void {
    if (!this.ticket) return;

    const body = { priority: newPriority };

    this.http
      .put(
        GlobalVars.baseUrl + "/tickets/admin/" + this.ticket.id + "/priority",
        body,
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            if (this.ticket) {
              this.ticket.priority = newPriority;
            }

            swal.fire({
              icon: "success",
              title: "Success",
              text: "Ticket priority updated",
              timer: 1500,
              showConfirmButton: false,
            });

            // Reload to get updated activity log
            this.loadTicketDetail();
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
              text: "Failed to update priority. Please try again.",
            });
          }
        }
      );
  }

  /**
   * Reassign ticket
   */
  reassignTicket(): void {
    if (!this.ticket) return;

    swal
      .fire({
        title: "Reassign Ticket",
        input: "select",
        inputOptions: {
          DELIVERER: "Deliverer",
          ACCOUNTANT: "Accountant",
          YUKCHI: "Yukchi",
          CHINASTAFF: "China Staff",
          MANAGER: "Manager",
        },
        inputPlaceholder: "Select new assignee",
        showCancelButton: true,
        confirmButtonText: "Reassign",
        inputValidator: (value) => {
          if (!value) {
            return "You need to select someone!";
          }
        },
      })
      .then((result) => {
        if (result.isConfirmed && this.ticket) {
          const body = { assigned_to: result.value };

          this.http
            .put(
              GlobalVars.baseUrl +
                "/tickets/admin/" +
                this.ticket.id +
                "/reassign",
              body,
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status === "success") {
                  if (this.ticket) {
                    this.ticket.assigned_to = result.value;
                  }

                  swal.fire({
                    icon: "success",
                    title: "Success",
                    text: "Ticket reassigned successfully",
                    timer: 1500,
                    showConfirmButton: false,
                  });

                  // Reload to get updated activity log
                  this.loadTicketDetail();
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
                    text: "Failed to reassign ticket. Please try again.",
                  });
                }
              }
            );
        }
      });
  }

  /**
   * Navigate back to ticket list
   */
  goBack(): void {
    this.router.navigate(["/uzm/tickets-list"]);
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
      unread: "Unread",
      open: "Open",
      answered: "Answered",
      "customer-reply": "Customer Reply",
      closed: "Closed",
    };
    return labels[status] || status;
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: string): string {
    return priority;
  }

  /**
   * Format date
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
   * Get customer full name
   */
  getCustomerName(): string {
    if (!this.ticket || !this.ticket.customer) return "-";
    return (
      `${this.ticket.customer.first_name} ${this.ticket.customer.last_name}`.trim() ||
      this.ticket.customer.username
    );
  }

  /**
   * Check if ticket is closed
   */
  isTicketClosed(): boolean {
    return this.ticket?.status === "closed";
  }

  /**
   * Check if user can reassign (only managers)
   */
  canReassign(): boolean {
    return this.currentUserRole === "MANAGER";
  }

  /**
   * Get category label
   */
  getCategoryLabel(category: string): string {
    const option = this.categoryOptions.find((opt) => opt.value === category);
    return option ? option.label : category;
  }

  /**
   * Calculate time since ticket creation
   */
  getTimeSinceCreation(): string {
    if (!this.ticket) return "-";

    const created = new Date(this.ticket.created_at).getTime();
    const now = new Date().getTime();
    const diffHours = Math.floor((now - created) / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      return "Less than 1 hour ago";
    }
  }

  /**
   * Check if SLA is breached
   */
  isSLABreached(): boolean {
    if (!this.ticket?.sla_response_due) return false;

    const due = new Date(this.ticket.sla_response_due).getTime();
    const now = new Date().getTime();

    return now > due && !this.ticket.first_response_at;
  }

  /**
   * Get SLA status text
   */
  getSLAStatus(): string {
    if (!this.ticket) return "-";

    if (this.ticket.first_response_at) {
      return "SLA Met";
    }

    if (this.isSLABreached()) {
      return "SLA Breached";
    }

    return "Within SLA";
  }
}
