import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

interface TicketMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: "customer" | "staff";
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
export class CustomerTicketDetailComponent implements OnInit, AfterViewChecked {
  ticket: TicketDetail | null = null;
  ticketNumber: string = "";
  isLoading: boolean = true;

  // Reply form with file upload (from reply-box component)
  messageText: string = "";
  selectedFiles: FileWithPreview[] = [];
  isSubmitting: boolean = false;
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
    public authService: AuthService
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
                this.router.navigate(["/customer-tickets"]);
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
          } else {
            this.isLoading = false;
            swal
              .fire({
                icon: "error",
                title: "Xatolik",
                text: data.message || "Murojaat ma'lumotlarini yuklab bo'lmadi",
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
                title: "Murojaat Topilmadi",
                text: "Siz qidirayotgan murojaat mavjud emas yoki sizda unga kirish huquqi yo'q.",
              })
              .then(() => {
                this.router.navigate(["/customer-tickets"]);
              });
          } else {
            swal.fire({
              icon: "error",
              title: "Xatolik",
              text: "Murojaat ma'lumotlarini yuklab bo'lmadi. Qayta urinib ko'ring.",
            });
          }
        }
      );
  }

  // ========================================
  // FILE UPLOAD METHODS (from reply-box)
  // ========================================

  /**
   * Handle file selection
   */
  onFileSelect(event: any): void {
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

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size
      if (file.size > this.maxFileSize) {
        swal.fire({
          icon: "warning",
          title: "Fayl juda katta",
          text: `${
            file.name
          } juda katta hajmda. Maksimal fayl hajmi ${this.formatFileSize(
            this.maxFileSize
          )}`,
        });
        continue;
      }

      // Validate file type
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
      const allowedExts = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".pdf",
        ".zip",
        ".rar",
      ];

      if (
        !this.allowedFileTypes.includes(file.type) &&
        !allowedExts.includes(fileExt)
      ) {
        swal.fire({
          icon: "warning",
          title: "Fayl turi noto'g'ri",
          text: `${file.name} qo'llab-quvvatlanmaydi. Ruxsat etilgan: Rasm, PDF, ZIP, RAR`,
        });
        continue;
      }

      // Create file preview for images
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

    // Clear the input so the same file can be selected again
    event.target.value = "";
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
    return this.messageText.trim().length >= 5 || this.selectedFiles.length > 0;
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
        options
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
            swal.fire({
              icon: "error",
              title: "Xatolik",
              text: "Javobni yuborib bo'lmadi. Qayta urinib ko'ring.",
            });
          }
        }
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
   * Get initials from name for avatar
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
    this.router.navigate(["/customer-tickets"]);
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
      if (this.replyTextarea && this.replyTextarea.nativeElement && !this.isTicketClosed()) {
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
      "Urgent": "Shoshilinch",
      "High": "Yuqori",
      "Medium": "O'rta",
      "Low": "Past"
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
