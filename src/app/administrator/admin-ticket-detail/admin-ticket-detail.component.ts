import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

interface TicketMessage {
  id: number;
  sender_role: "customer" | "staff"; // ✅ FIXED: Changed from sender_type to sender_role
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

  // Accordion states
  isTicketHeaderExpanded: boolean = false;
  isInternalNotesExpanded: boolean = false;
  isActivityLogExpanded: boolean = false;

  // ✅ NEW: ViewChild for reply box component
  @ViewChild("replyBoxComponent") replyBoxComponent: any;
  @ViewChild("internalNoteBox") internalNoteBox: any;

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
      { value: "unread", label: "O'qilmagan" },
      { value: "open", label: "Ochiq" },
      { value: "answered", label: "Javob berilgan" },
      { value: "customer-reply", label: "Mijoz Javobi" },
      { value: "closed", label: "Yopilgan" },
    ];

    this.priorityOptions = [
      { value: "Urgent", label: "Shoshilinch" },
      { value: "High", label: "Baland" },
      { value: "Medium", label: "O'rtacha" },
      { value: "Low", label: "Past" },
    ];

    this.categoryOptions = [
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

    this.assignedToOptions = [
      { value: "DELIVERER", label: "Kuryer" },
      { value: "ACCOUNTANT", label: "Bugalter" },
      { value: "YUKCHI", label: "Yukchi" },
      { value: "CHINASTAFF", label: "Xitoylik" },
      { value: "MANAGER", label: "Manager" },
    ];

    // Get ticket number from path params (e.g., /uzm/ticket-detail/T-2025-000123)
    // or query params (e.g., /uzm/ticket-detail?ticket=123)
    this.route.params.subscribe((params) => {
      if (params["ticketNumber"]) {
        this.ticketId = params["ticketNumber"];
        this.loadTicketDetail();
      } else {
        // Fallback to query params for backward compatibility
        this.route.queryParams.subscribe((queryParams) => {
          this.ticketId = queryParams["ticket"];
          if (this.ticketId) {
            this.loadTicketDetail();
          } else {
            swal
              .fire({
                icon: "error",
                title: "Xatolik",
                text: "Noto'g'ri murojaat raqami",
              })
              .then(() => {
                this.router.navigate(["/uzm/tickets-list"]);
              });
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    // ✅ Auto-focus on reply box after view is initialized
    this.focusReplyBox();
  }

  /**
   * Focus on the reply box input field
   */
  private focusReplyBox(): void {
    setTimeout(() => {
      if (this.replyBoxComponent && !this.isTicketClosed()) {
        // Try to focus the reply box component if it has a focus method
        if (typeof this.replyBoxComponent.focusInput === "function") {
          this.replyBoxComponent.focusInput();
        }
      }
    }, 300);
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

          // 🔍 DEBUG: Check message attachments structure
          console.log("=== TICKET DATA ===");
          console.log("Full ticket:", this.ticket);

          if (this.ticket && this.ticket.messages) {
            this.ticket.messages.forEach((msg, index) => {
              // console.log(`Message ${index}:`, msg);
              if (msg.attachments && msg.attachments.length > 0) {
                // console.log(
                //   `  Attachments for message ${index}:`,
                //   msg.attachments
                // );
                msg.attachments.forEach((att, attIndex) => {
                  // console.log(`    Attachment ${attIndex}:`, {
                  //   id: att.id,
                  //   file_name: att.file_name,
                  //   file_path: att.file_path,
                  //   file_url: att.file_url, // ← Check if this exists!
                  //   file_size: att.file_size,
                  //   file_type: att.file_type,
                  // });
                });
              }
            });
          }

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

          // ✅ Auto-focus on reply box after ticket loads
          this.focusReplyBox();
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
                title: "Xatolik",
                text: "So'rovni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
                confirmButtonText: "Orqaga Qaytish",
              })
              .then(() => {
                this.router.navigate(["/uzm/tickets"]);
              });
          }
        }
      );
  }

  /**
   * ✅ FIXED: Handle staff reply submission with file uploads
   */
  onStaffReply(data: { messageText: string; files: File[] }): void {
    if (!this.ticket) return;

    // Set submitting state
    if (this.replyBoxComponent) {
      this.replyBoxComponent.setSubmitting(true);
    }

    // Create FormData for file uploads
    const formData = new FormData();
    formData.append("message_text", data.messageText);

    // Append files
    data.files.forEach((file) => {
      formData.append("attachments", file);
    });

    // ✅ IMPORTANT: Remove Content-Type header for FormData
    const headers = new Headers();
    headers.append("Authorization", localStorage.getItem("token"));
    const options = new RequestOptions({ headers: headers });

    this.http
      .post(
        GlobalVars.baseUrl + "/tickets/admin/" + this.ticket.id + "/reply",
        formData,
        options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            swal.fire({
              icon: "success",
              title: "Muvaffaqiyatli",
              text: "Javob muvaffaqiyatli yuborildi",
              timer: 1500,
              showConfirmButton: false,
            });

            // Reset form and reload ticket
            if (this.replyBoxComponent) {
              this.replyBoxComponent.resetForm();
            }
            this.loadTicketDetail();
          }
        },
        (error) => {
          console.error("Error sending reply:", error);

          // Reset submitting state on error
          if (this.replyBoxComponent) {
            this.replyBoxComponent.setSubmitting(false);
          }

          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Xatolik",
              text: "Javob yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
            });
          }
        }
      );
  }

  /**
   * ✅ FIXED: Handle internal note submission with file uploads
   */
  onInternalNote(data: { messageText: string; files: File[] }): void {
    if (!this.ticket) return;

    // Set submitting state
    if (this.internalNoteBox) {
      this.internalNoteBox.setSubmitting(true);
    }

    // Create FormData for file uploads
    const formData = new FormData();
    formData.append("note_text", data.messageText);

    // Append files
    data.files.forEach((file) => {
      formData.append("attachments", file);
    });

    // Remove Content-Type header for FormData
    const headers = new Headers();
    headers.append("Authorization", localStorage.getItem("token"));
    const options = new RequestOptions({ headers: headers });

    this.http
      .post(
        GlobalVars.baseUrl +
          "/tickets/admin/" +
          this.ticket.id +
          "/internal-note",
        formData,
        options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            swal.fire({
              icon: "success",
              title: "Muvaffaqiyatli",
              text: "Ichki qayd qo'shildi",
              timer: 1500,
              showConfirmButton: false,
            });

            // Reset form and reload ticket
            if (this.internalNoteBox) {
              this.internalNoteBox.resetForm();
            }
            this.loadTicketDetail();
          }
        },
        (error) => {
          console.error("Error adding note:", error);

          // Reset submitting state on error
          if (this.internalNoteBox) {
            this.internalNoteBox.setSubmitting(false);
          }

          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Xatolik",
              text: "Ichki qayd qo'shishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
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
          title: "Yechimni kiriting",
          input: "text",
          inputPlaceholder: "Yechim kodi yoki tavsifi",
          showCancelButton: true,
          confirmButtonText: "Yopish So'rovni",
          inputValidator: (value) => {
            if (!value) {
              return "Yechim Kerak!";
            }
          },
        })
        .then((result) => {
          if (result.isConfirmed && this.ticket) {
            const body = {
              status: newStatus,
              resolution_code: result.value,
            };

            this.performStatusUpdate(body);
          }
        });
    } else {
      const body = { status: newStatus };
      this.performStatusUpdate(body);
    }
  }

  /**
   * Perform status update API call
   */
  private performStatusUpdate(body: any): void {
    if (!this.ticket) return;

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
              this.ticket.status = body.status;
            }

            swal.fire({
              icon: "success",
              title: "Muvaffaqiyatli",
              text: "So'rov holati yangilandi",
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
              title: "Xatolik",
              text: "Holatni yangilashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
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
              title: "Muvaffaqiyatli",
              text: "So'rov muhimligi yangilandi",
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
              title: "Xatolik",
              text: "Muhimlikni yangilashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
            });
          }
        }
      );
  }

  /**
   * Handle message edit
   */
  onMessageEdit(event: { messageId: number; newText: string }): void {
    // console.log("message edit ", event.messageId, event.newText);

    this.http
      .put(
        GlobalVars.baseUrl + "/tickets/message/" + event.messageId,
        { messageText: event.newText },
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status === "success") {
            // Reload to get updated activity log
            this.loadTicketDetail();
          }
        },
        (error) => {
          console.error("Error updating message:", error);
          if (error.status == 403) {
            this.authService.logout();
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Habarni tahrirlashda xatolik!!!",
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
        title: "Qayta Biriktirish So'rovni",
        input: "select",
        inputOptions: {
          DELIVERER: "Kuryer",
          ACCOUNTANT: "Bugalter",
          YUKCHI: "Yukchi",
          CHINASTAFF: "Xitoylik",
          MANAGER: "Manager",
        },
        inputPlaceholder: "Yangi Biriktiriluvchini Tanlash",
        showCancelButton: true,
        confirmButtonText: "Qayta biriktirish",
        inputValidator: (value) => {
          if (!value) {
            return "Biriktiriluvchini tanlash kerak!";
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
                    title: "Muvaffaqiyatli",
                    text: "So'rov qayta biriktirildi",
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
                    title: "Xatolik",
                    text: "Qayta biriktirishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
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
      unread: "O'qilmagan",
      open: "Ochiq",
      answered: "Javob Berilgan",
      "customer-reply": "Mijoz Javobi",
      closed: "Yopilgan",
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
      return `${diffDays} kun oldin`;
    } else if (diffHours > 0) {
      return `${diffHours} soat oldin`;
    } else {
      return "1 soatdan kam oldin";
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
      return "SLA Bajarildi";
    }

    if (this.isSLABreached()) {
      return "SLA Buzildi";
    }

    return "SLA Chegarasida";
  }

  /**
   * Toggle ticket header accordion
   */
  toggleTicketHeader(): void {
    this.isTicketHeaderExpanded = !this.isTicketHeaderExpanded;
  }

  /**
   * Toggle internal notes accordion
   */
  toggleInternalNotes(): void {
    this.isInternalNotesExpanded = !this.isInternalNotesExpanded;
  }

  /**
   * Toggle activity log accordion
   */
  toggleActivityLog(): void {
    this.isActivityLogExpanded = !this.isActivityLogExpanded;
  }
}
