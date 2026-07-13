import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { showBackendError } from "src/app/shared/backend-error";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { NotificationService } from "src/app/services/notification.service";
import { compressImageIfNeeded } from "src/app/shared/image-compression.util";

interface TicketMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: "customer" | "staff";
  sender_user_role?: string;
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

interface FileWithPreview {
  file: File;
  name: string;
  size: number;
  preview?: string;
}

@Component({
  selector: "app-customer-ticket-detail",
  templateUrl: "./ticket-detail.component.html",
  styleUrls: ["./ticket-detail.component.css"],
})
export class CustomerTicketDetailComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  ticket: TicketDetail | null = null;
  ticketNumber: string = "";
  isLoading: boolean = true;

  // The logged-in user's id, used to decide left/right alignment of message bubbles.
  currentUserId: number = parseInt(localStorage.getItem("id") || "0", 10);

  /** Poll interval (ms) for silently refreshing messages while the page is open. */
  private static readonly POLL_INTERVAL_MS = 15_000;
  /** Timer id for the periodic refresh; cleared in ngOnDestroy and on tab hidden. */
  private pollTimer: any = null;
  /** Bound handler kept so we can removeEventListener on destroy. */
  private onVisibilityChange = () => {
    if (document.hidden) {
      this.stopPolling();
    } else {
      // Immediate silent fetch on focus, then resume periodic.
      this.silentReload();
      this.startPolling();
    }
  };

  // Reply form with file upload (from reply-box component)
  messageText: string = "";
  selectedFiles: FileWithPreview[] = [];
  isSubmitting: boolean = false;
  isCompressing: boolean = false;
  maxFiles: number = 5;
  maxFileSize: number = 5 * 1024 * 1024; // 5MB
  allowedFileTypes: string[] = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/octet-stream",
  ];

  // Display messages (from message-thread component)
  displayMessages: TicketMessage[] = [];

  // Image preview (from message-thread component)
  selectedImage: string | null = null;

  // Accordion states
  isTicketInfoExpanded: boolean = false;
  isHelpSectionExpanded: boolean = false;

  // ViewChild for scroll
  @ViewChild("messagesContainer", { read: ElementRef })
  messagesContainer: ElementRef;

  // ViewChild for reply textarea auto-focus
  @ViewChild("replyTextarea") replyTextarea: ElementRef;

  // Auto-scroll control
  private shouldScrollToBottom = false;

  // HTTP setup
  headers12: any;
  options: any;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: Http,
    public authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit(): void {
    // Get ticket number from path params (e.g., /customer-ticket-detail/T-2025-000123)
    // or query params (e.g., /customer-ticket-detail?ticket=T-2025-000123)
    this.route.params.subscribe((params) => {
      if (params["ticketNumber"]) {
        this.ticketNumber = params["ticketNumber"];
        this.loadTicketDetail();
      } else {
        // Fallback to query params for backward compatibility
        this.route.queryParams.subscribe((queryParams) => {
          this.ticketNumber = queryParams["ticket"];
          if (this.ticketNumber) {
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

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  /** Start (or restart) the 15s silent refresh loop. Skips if the tab is hidden. */
  private startPolling(): void {
    this.stopPolling();
    if (document.hidden) return;
    this.pollTimer = setInterval(
      () => this.silentReload(),
      CustomerTicketDetailComponent.POLL_INTERVAL_MS,
    );
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Fetch fresh messages without touching the loading spinner, scroll position,
   * or the user's draft in the reply box. Only appends new messages; existing
   * ones are left in place so the DOM doesn't churn.
   */
  private silentReload(): void {
    if (!this.ticketNumber) return;
    // `?silent=true` tells the backend not to auto-mark messages as read on
    // this background poll — otherwise every 15s tick would wipe out unread
    // notifications for anyone else looking at this ticket.
    this.http
      .get(
        GlobalVars.baseUrl +
          "/tickets/" +
          this.ticketNumber +
          "?silent=true",
        this.options,
      )
      .subscribe(
        (response) => {
          const data = response.json();
          if (data.status !== "success" || !data.ticket) return;

          const incoming = ([...(data.ticket.messages || [])] as TicketMessage[])
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            );

          // Nothing changed → keep the DOM alone (no ngFor rebuild, no scroll jump).
          if (incoming.length === this.displayMessages.length) {
            const oldLastId =
              this.displayMessages[this.displayMessages.length - 1]?.id;
            const newLastId = incoming[incoming.length - 1]?.id;
            if (oldLastId === newLastId) return;
          }

          // Only auto-scroll if the user is already near the bottom.
          const nearBottom = this.isScrolledNearBottom();
          this.ticket = data.ticket;
          this.displayMessages = incoming;
          if (nearBottom) this.shouldScrollToBottom = true;
        },
        () => {
          // Silent — the periodic tick shouldn't nag the user with error dialogs.
        },
      );
  }

  private isScrolledNearBottom(): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
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
          const data = response.json();
          if (data.status === "success") {
            this.ticket = data.ticket;
            // console.log("ticket detail ", this.ticket);

            // Sort messages by created_at (oldest first, newest last - Telegram style)
            this.displayMessages = [...this.ticket.messages].sort((a, b) => {
              return (
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
              );
            });

            this.isLoading = false;

            // Trigger scroll after data loaded
            this.shouldScrollToBottom = true;

            // Focus on reply textarea after ticket loads
            this.focusReplyTextarea();

            // Kick off (or restart) the 15s silent-refresh loop and pause when
            // the browser tab is hidden.
            this.startPolling();
            document.removeEventListener("visibilitychange", this.onVisibilityChange);
            document.addEventListener("visibilitychange", this.onVisibilityChange);
          } else {
            this.isLoading = false;
            swal
              .fire({
                icon: "error",
                title: "Xatolik",
                text: data.message || "Murojaat ma'lumotlarini yuklab bo'lmadi",
              })
              .then(() => {
                this.router.navigate(["/uzm/tickets-list"]);
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
                title: "Murojaat Topilmadi",
                text: "Siz qidirayotgan murojaat mavjud emas yoki sizda unga kirish huquqi yo'q.",
              })
              .then(() => {
                this.router.navigate(["/uzm/tickets-list"]);
              });
          } else {
            swal.fire({
              icon: "error",
              title: "Xatolik",
              text: "Murojaat ma'lumotlarini yuklab bo'lmadi. Qayta urinib ko'ring.",
            });
          }
        },
      );
  }

  // ========================================
  // FILE UPLOAD METHODS (from reply-box)
  // ========================================

  /**
   * Handle file selection. Compresses images over ~500KB before adding
   * (see shared/image-compression.util). Non-images pass through untouched.
   */
  async onFileSelect(event: any): Promise<void> {
    const files: FileList = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    // Check if adding these files would exceed the maximum
    if (this.selectedFiles.length + files.length > this.maxFiles) {
      swal.fire({
        icon: "warning",
        title: "Juda ko'p fayllar",
        text: `Siz maksimum ${this.maxFiles} ta fayl yuklashingiz mumkin. Hozir tanlangan: ${this.selectedFiles.length}`,
      });
      return;
    }

    // Snapshot before clearing the input
    const incoming: File[] = Array.from(files);
    event.target.value = "";

    this.isCompressing = true;
    try {
      for (const original of incoming) {
        // Validate type first
        const fileExt = "." + original.name.split(".").pop()?.toLowerCase();
        const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip", ".rar"];
        if (
          !this.allowedFileTypes.includes(original.type) &&
          !allowedExts.includes(fileExt)
        ) {
          swal.fire({
            icon: "warning",
            title: "Fayl turi noto'g'ri",
            text: `${original.name} qo'llab-quvvatlanmaydi. Ruxsat etilgan: Rasm, PDF, ZIP, RAR`,
          });
          continue;
        }

        const file = await compressImageIfNeeded(original);

        // Post-compression size check
        if (file.size > this.maxFileSize) {
          swal.fire({
            icon: "warning",
            title: "Fayl juda katta",
            text: `${original.name} juda katta hajmda. Maksimal fayl hajmi ${this.formatFileSize(this.maxFileSize)}`,
          });
          continue;
        }

        const fileWithPreview: FileWithPreview = {
          file: file,
          name: file.name,
          size: file.size,
        };
        if (this.isImageFile(file.name)) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            fileWithPreview.preview = e.target.result;
          };
          reader.readAsDataURL(file);
        }

        this.selectedFiles.push(fileWithPreview);
      }
    } finally {
      this.isCompressing = false;
    }
  }

  /**
   * Remove a file from the list
   */
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Clear all selected files
   */
  clearAllFiles(): void {
    this.selectedFiles = [];
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();

    const iconMap: { [key: string]: string } = {
      pdf: "picture_as_pdf",
      zip: "folder_zip",
      rar: "folder_zip",
      doc: "description",
      docx: "description",
      txt: "text_snippet",
    };

    return iconMap[ext || ""] || "insert_drive_file";
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return this.messageText.trim().length >= 2 || this.selectedFiles.length > 0;
  }

  /**
   * Handle keyboard shortcuts (Ctrl+Enter to send)
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      if (this.isValid() && !this.isSubmitting) {
        this.onSubmitReply();
      }
    }
  }

  /**
   * Submit customer reply with files
   */
  onSubmitReply(): void {
    if (!this.ticket || !this.isValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // Create FormData for file uploads
    const formData = new FormData();
    formData.append("message_text", this.messageText.trim());

    // Append files
    this.selectedFiles.forEach((fileWithPreview) => {
      formData.append("attachments", fileWithPreview.file);
    });

    // IMPORTANT: Remove Content-Type header for FormData
    const headers = new Headers();
    headers.append("Authorization", localStorage.getItem("token"));
    const options = new RequestOptions({ headers: headers });

    this.http
      .post(
        GlobalVars.baseUrl + "/tickets/" + this.ticket.id + "/reply",
        formData,
        options,
      )
      .subscribe(
        (response) => {
          const data = response.json();
          if (data.status === "success") {
            swal.fire({
              icon: "success",
              title: "Javob yuborildi",
              text: "Javobingiz yordam xizmatiga yuborildi",
              timer: 1500,
              showConfirmButton: false,
            });

            // Reset form
            this.messageText = "";
            this.selectedFiles = [];
            this.isSubmitting = false;

            // Reload ticket
            this.loadTicketDetail();

            // Tell the notification service to refresh RIGHT NOW so the other
            // party's mail badge lights up without waiting for the 15s tick.
            this.notificationService.refreshNotifications();
          } else {
            this.isSubmitting = false;
            swal.fire({
              icon: "error",
              title: "Xatolik",
              text: data.message || "Javobni yuborib bo'lmadi",
            });
          }
        },
        (error) => {
          console.error("Error sending reply:", error);
          this.isSubmitting = false;

          if (error.status == 403) {
            this.authService.logout();
          } else {
            showBackendError(error, {
              fallback: "Javobni yuborib bo'lmadi. Qayta urinib ko'ring.",
            });
          }
        },
      );
  }

  // ========================================
  // MESSAGE DISPLAY METHODS (from message-thread)
  // ========================================

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
   * Telegram-style alignment: was this message sent by the currently logged-in
   * user? True → right-aligned bubble. False → left-aligned.
   */
  isOwnMessage(message: TicketMessage): boolean {
    return !!this.currentUserId && message.sender_id === this.currentUserId;
  }

  /**
   * Get initials from name for avatar
   */
  getInitials(name: string): string {
    // Strip empty / "undefined" / "null" name parts (e.g. a staff member with a
    // missing last_name) so the avatar never shows garbage like "KUNDEFINED".
    const parts = (name || "")
      .split(" ")
      .map((p) => p.trim())
      .filter(
        (p) =>
          p && p.toLowerCase() !== "undefined" && p.toLowerCase() !== "null",
      );
    if (parts.length === 0) return "?";
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  /**
   * Check if message has attachments
   */
  hasAttachments(message: TicketMessage): boolean {
    return message.attachments && message.attachments.length > 0;
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename: string): boolean {
    if (!filename) return false;
    const ext = filename.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  }

  /**
   * Check if file is a PDF
   */
  isPdfFile(filename: string): boolean {
    if (!filename) return false;
    return filename.toLowerCase().endsWith(".pdf");
  }

  /**
   * Get attachment icon based on file type
   */
  getAttachmentIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();

    const iconMap: { [key: string]: string } = {
      pdf: "picture_as_pdf",
      doc: "description",
      docx: "description",
      xls: "grid_on",
      xlsx: "grid_on",
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
      zip: "folder_zip",
      rar: "folder_zip",
      txt: "text_snippet",
    };

    return iconMap[ext || ""] || "attachment";
  }

  /**
   * Open image in modal
   */
  openImagePreview(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  /**
   * Close image preview
   */
  closeImagePreview(): void {
    this.selectedImage = null;
  }

  /**
   * Get file size in readable format
   */
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    if (!date) return "-";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hozirgina";
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays < 7) return `${diffDays} kun oldin`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Render message text with HTML
   */
  renderMessageHTML(text: string): string {
    return text;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Navigate back to ticket list
   */
  goBack(): void {
    this.router.navigate(["/uzm/tickets-list"]);
  }

  /**
   * Scroll to bottom of messages container
   */
  private scrollToBottom(): void {
    if (this.messagesContainer && this.messagesContainer.nativeElement) {
      setTimeout(() => {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 200);
    }
  }

  /**
   * Focus on the reply textarea
   */
  private focusReplyTextarea(): void {
    setTimeout(() => {
      if (
        this.replyTextarea &&
        this.replyTextarea.nativeElement &&
        !this.isTicketClosed()
      ) {
        this.replyTextarea.nativeElement.focus();
      }
    }, 300);
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
      unread: "O'qilmagan",
      open: "Ochiq",
      answered: "Javob berilgan",
      "customer-reply": "Yordam kutilmoqda",
      closed: "Yopilgan",
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
    const labels = {
      Urgent: "Shoshilinch",
      High: "Yuqori",
      Medium: "O'rta",
      Low: "Past",
    };
    return labels[priority] || "O'rta";
  }

  /**
   * Get category label
   */
  getCategoryLabel(category: string): string {
    const labelMap: { [key: string]: string } = {
      delivery: "Yetkazish muammosi",
      payment: "To'lov",
      product: "Mahsulot haqida savol",
      customs: "Bojxona",
      damaged: "Shikastlangan yuk",
      lost: "Yo'qolgan pochta",
      pricing: "Narx",
      tracking: "Kuzatuv",
      support: "Umumiy yordam",
      complaint: "Shikoyat",
      other: "Boshqa",
    };
    return labelMap[category] || category;
  }

  /**
   * Get status explanation
   */
  getStatusExplanation(status: string): string {
    const explanations: { [key: string]: string } = {
      unread: "Murojaatingiz qabul qilindi va tez orada ko'rib chiqiladi",
      open: "Yordam xizmati murojaatingiz ustida ishlamoqda",
      answered: "Yordam xizmati murojaatingizga javob berdi",
      "customer-reply": "Yordam javobi kutilmoqda",
      closed: "Murojaat hal qilindi va yopildi",
    };
    return explanations[status] || "";
  }

  /**
   * Toggle ticket info accordion
   */
  toggleTicketInfo(): void {
    this.isTicketInfoExpanded = !this.isTicketInfoExpanded;
  }

  /**
   * Toggle help section accordion
   */
  toggleHelpSection(): void {
    this.isHelpSectionExpanded = !this.isHelpSectionExpanded;
  }
}
