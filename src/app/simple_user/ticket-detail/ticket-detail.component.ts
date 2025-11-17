import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

interface TicketMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message_text: string;
  message_type: string;
  is_internal: boolean;
  is_read: boolean;
  created_at: string;
  attachments?: any[];
}

interface TicketDetail {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  customer_id: number;
  customer_name: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  closed_at: string;
  messages: TicketMessage[];
}

@Component({
  selector: "app-customer-ticket-detail",
  templateUrl: "./ticket-detail.component.html",
  styleUrls: ["./ticket-detail.component.css"],
})
export class CustomerTicketDetailComponent implements OnInit {
  ticket: TicketDetail | null = null;
  ticketNumber: string = "";
  isLoading: boolean = true;

  // Reply form
  replyMessage: string = "";
  isSubmittingReply: boolean = false;

  // Math for template
  Math = Math;

  // HTTP setup
  headers12: any;
  options: any;

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
    // Get ticket number from query params
    this.route.queryParams.subscribe((params) => {
      this.ticketNumber = params["ticket"];
      if (this.ticketNumber) {
        this.loadTicketDetail();
      } else {
        swal
          .fire({
            icon: "error",
            title: "Error",
            text: "Invalid ticket reference",
          })
          .then(() => {
            this.router.navigate(["/customer-tickets"]);
          });
      }
    });
  }

  /**
   * Load ticket detail from API
   */
  loadTicketDetail(): void {
    this.isLoading = true;

    this.http
      .get(GlobalVars.baseUrl + "/tickets/" + this.ticketNumber, this.options)
      .subscribe(
        (response) => {
          console.log("detail ", response.json());
          const data = response.json();
          if (data.status === "success") {
            this.ticket = data.ticket;

            this.isLoading = false;

            // Scroll to bottom of messages after rendering
            setTimeout(() => this.scrollToBottom(), 200);
          } else {
            this.isLoading = false;
            swal
              .fire({
                icon: "error",
                title: "Error",
                text: data.message || "Failed to load ticket details",
              })
              .then(() => {
                this.router.navigate(["/customer-tickets"]);
              });
          }
        },
        (error) => {
          console.error("Error loading ticket:", error);
          this.isLoading = false;

          if (error.status == 403) {
            this.authService.logout();
          } else if (error.status == 404) {
            swal
              .fire({
                icon: "error",
                title: "Ticket Not Found",
                text: "The ticket you're looking for doesn't exist or you don't have access to it.",
              })
              .then(() => {
                this.router.navigate(["/customer-tickets"]);
              });
          } else {
            swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to load ticket details. Please try again.",
            });
          }
        }
      );
  }

  /**
   * Submit customer reply
   */
  onSubmitReply(): void {
    if (!this.ticket || !this.replyMessage.trim()) {
      return;
    }

    if (this.replyMessage.trim().length < 5) {
      swal.fire({
        icon: "warning",
        title: "Message Too Short",
        text: "Please provide more details in your message (at least 5 characters)",
      });
      return;
    }

    this.isSubmittingReply = true;

    const payload = {
      message_text: this.replyMessage.trim(),
    };

    this.http
      .post(
        GlobalVars.baseUrl + "/tickets/" + this.ticket.id + "/reply",
        payload,
        this.options
      )
      .subscribe(
        (response) => {
          const data = response.json();
          if (data.status === "success") {
            swal.fire({
              icon: "success",
              title: "Reply Sent",
              text: "Your reply has been sent to support",
              timer: 1500,
              showConfirmButton: false,
            });

            // Clear form and reload ticket
            this.replyMessage = "";
            this.isSubmittingReply = false;
            this.loadTicketDetail();
          } else {
            this.isSubmittingReply = false;
            swal.fire({
              icon: "error",
              title: "Error",
              text: data.message || "Failed to send reply",
            });
          }
        },
        (error) => {
          console.error("Error sending reply:", error);
          this.isSubmittingReply = false;

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
   * Navigate back to ticket list
   */
  goBack(): void {
    this.router.navigate(["/customer-tickets"]);
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    const messagesContainer = document.querySelector(".messages-container");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Check if message is from customer
   */
  isCustomerMessage(message: TicketMessage): boolean {
    return message.sender_role === "customer";
  }

  /**
   * Check if message is from staff
   */
  isStaffMessage(message: TicketMessage): boolean {
    return message.sender_role === "staff";
  }

  /**
   * Check if ticket is closed
   */
  isTicketClosed(): boolean {
    return this.ticket?.status === "closed";
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
   * Get initials for avatar
   */
  getInitials(name: string): string {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Check if reply form is valid
   */
  isReplyValid(): boolean {
    return this.replyMessage.trim().length >= 5;
  }

  /**
   * Get category label
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
   * Get status explanation
   */
  getStatusExplanation(status: string): string {
    const explanations: { [key: string]: string } = {
      unread: "Your ticket has been received and will be reviewed soon",
      open: "Support is working on your ticket",
      answered: "Support has replied to your ticket",
      "customer-reply": "Waiting for support response",
      closed: "This ticket has been resolved and closed",
    };
    return explanations[status] || "";
  }

  /**
   * Check if message has attachments
   */
  hasAttachments(message: TicketMessage): boolean {
    return message.attachments && message.attachments.length > 0;
  }

  /**
   * Get attachment icon based on file extension
   */
  getAttachmentIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();

    const iconMap: { [key: string]: string } = {
      pdf: "picture_as_pdf",
      doc: "description",
      docx: "description",
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
      zip: "folder_zip",
      rar: "folder_zip",
      txt: "text_snippet",
      csv: "table_chart",
      xls: "table_chart",
      xlsx: "table_chart",
    };

    return iconMap[ext || ""] || "attachment";
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.ticket?.messages?.length || 0;
  }
}
