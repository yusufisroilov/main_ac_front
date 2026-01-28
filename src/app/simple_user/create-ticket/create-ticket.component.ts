import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-customer-create-ticket",
  templateUrl: "./create-ticket.component.html",
  styleUrls: ["./create-ticket.component.css"],
})
export class CustomerCreateTicketComponent implements OnInit, AfterViewInit {
  @ViewChild("messageTextarea", { static: false }) messageTextarea: ElementRef;

  // Form fields
  relatedService: string = "None";
  selectedRole: string = ""; // Customer selected role for ticket assignment
  message: string = "";

  // Form state
  isSubmitting: boolean = false;
  lineCount: number = 0;
  wordCount: number = 0;

  // Language
  isChinaStaff: boolean = false;

  // File upload
  selectedFiles: File[] = [];
  maxFiles: number = 5;
  maxFileSize: number = 5 * 1024 * 1024; // 5MB
  allowedExtensions: string[] = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".zip",
    ".rar",
  ];

  // HTTP setup
  headers12: any;
  options: any;

  // Service/Category options
  serviceOptions: any[] = [];

  // Role options for ticket assignment
  roleOptions: any[] = [];

  constructor(
    private http: Http,
    private router: Router,
    public authService: AuthService,
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit(): void {
    this.isChinaStaff = localStorage.getItem("role") === "CHINASTAFF";

    if (this.isChinaStaff) {
      this.serviceOptions = [
        { value: "None", label: "None" },
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
      this.roleOptions = [
        { value: "", label: "Auto Assign" },
        { value: "MANAGER", label: "Manager" },
        { value: "CHINASTAFF", label: "China Staff" },
        { value: "YUKCHI", label: "Loader" },
      ];
    } else {
      this.serviceOptions = [
        { value: "None", label: "Yo'q" },
        { value: "delivery", label: "Yetkazish muammosi" },
        { value: "payment", label: "To'lov muammosi" },
        { value: "product", label: "Mahsulot haqida savol" },
        { value: "customs", label: "Bojxona muammosi" },
        { value: "damaged", label: "Shikastlangan yuk" },
        { value: "lost", label: "Yo'qolgan pochta" },
        { value: "pricing", label: "Narx haqida savol" },
        { value: "tracking", label: "Kuzatuv muammosi" },
        { value: "support", label: "Umumiy yordam" },
        { value: "complaint", label: "Shikoyat" },
        { value: "other", label: "Boshqa" },
      ];
      this.roleOptions = [
        { value: "", label: "Avtomatik tanlash" },
        { value: "MANAGER", label: "Menejer" },
        { value: "CHINASTAFF", label: "Xitoy xodimi" },
        { value: "YUKCHI", label: "Yukchi" },
      ];
    }
  }

  ngAfterViewInit(): void {
    // Auto-focus on message textarea when component loads
    this.focusMessageInput();
  }

  /**
   * Focus on the message textarea
   */
  focusMessageInput(): void {
    if (this.messageTextarea && this.messageTextarea.nativeElement) {
      setTimeout(() => {
        this.messageTextarea.nativeElement.focus();
      }, 300);
    }
  }

  /**
   * Update stats for message
   */
  onMessageChange(): void {
    if (this.message) {
      const lines = this.message.split("\n").length;
      const words = this.message
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

      this.lineCount = lines;
      this.wordCount = words;
    } else {
      this.lineCount = 0;
      this.wordCount = 0;
    }
  }

  /**
   * Submit the ticket to backend
   */
  onSubmit(): void {
    if (!this.isFormValid()) {
      swal.fire({
        icon: "warning",
        title: this.isChinaStaff ? "Incomplete form" : "To'ldirilmagan forma",
        text: this.isChinaStaff ? "Please fill in the message field" : "Iltimos, xabar maydonini to'ldiring",
      });
      return;
    }

    this.isSubmitting = true;

    // Determine category from service selection
    const category =
      this.relatedService === "None" ? "support" : this.relatedService;

    // Prepare FormData for file upload
    const formData = new FormData();
    formData.append("subject", this.getAutoGeneratedSubject());
    formData.append("category", category);
    formData.append("priority", "Medium");
    formData.append("message_text", this.message.trim());

    // Add selected role if customer chose one
    if (this.selectedRole) {
      formData.append("assigned_to", this.selectedRole);
    }

    // Append files
    for (let i = 0; i < this.selectedFiles.length; i++) {
      formData.append("attachments", this.selectedFiles[i]);
    }

    // Use XMLHttpRequest for FormData with file upload
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem("token");

    xhr.open("POST", GlobalVars.baseUrl + "/tickets/create", true);
    xhr.setRequestHeader("Authorization", token || "");

    xhr.onload = () => {
      this.isSubmitting = false;

      if (xhr.status === 201) {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          swal
            .fire({
              icon: "success",
              title: this.isChinaStaff ? "Ticket Created!" : "Murojaat yaratildi!",
              html: this.isChinaStaff
                ? `Your ticket <strong>#${data.ticket.ticket_number}</strong> has been created successfully.`
                : `Sizning <strong>#${data.ticket.ticket_number}</strong> raqamli murojaatingiz muvaffaqiyatli yaratildi.`,
              confirmButtonText: "OK",
            })
            .then(() => {
              this.router.navigate(["/customer/ticket-list"]);
            });
        }
      } else {
        const errorData = JSON.parse(xhr.responseText);
        swal.fire({
          icon: "error",
          title: this.isChinaStaff ? "Error" : "Xatolik",
          text:
            errorData.error ||
            (this.isChinaStaff ? "Failed to create ticket. Please try again." : "Murojaatni yaratib bo'lmadi. Qayta urinib ko'ring."),
        });
      }
    };

    xhr.onerror = () => {
      this.isSubmitting = false;
      swal.fire({
        icon: "error",
        title: this.isChinaStaff ? "Error" : "Xatolik",
        text: this.isChinaStaff ? "Failed to create ticket. Please try again." : "Murojaatni yaratib bo'lmadi. Qayta urinib ko'ring.",
      });
    };

    xhr.send(formData);
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      swal
        .fire({
          title: this.isChinaStaff ? "Discard changes?" : "O'zgarishlarni bekor qilasizmi?",
          text: this.isChinaStaff ? "You have unsaved changes. Are you sure you want to leave?" : "Saqlanmagan o'zgarishlar bor. Haqiqatan chiqmoqchimisiz?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: this.isChinaStaff ? "Yes, discard" : "Ha, bekor qilish",
          cancelButtonText: this.isChinaStaff ? "No, stay" : "Yo'q, qolish",
          confirmButtonColor: "#f44336",
        })
        .then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(["/customer/ticket-list"]);
          }
        });
    } else {
      this.router.navigate(["/customer/ticket-list"]);
    }
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.message.trim().length >= 10;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.message.trim().length > 0;
  }

  /**
   * Get auto-generated subject based on service
   */
  getAutoGeneratedSubject(): string {
    const serviceObj = this.serviceOptions.find(
      (s) => s.value === this.relatedService,
    );
    const serviceLabel = serviceObj ? serviceObj.label : "Yordam so'rovi";

    // Truncate message for subject (first 50 chars)
    const messagePreview = this.message.trim().substring(0, 50);
    return `${serviceLabel}: ${messagePreview}${
      this.message.length > 50 ? "..." : ""
    }`;
  }

  /**
   * Get line count
   */
  getLineCount(): number {
    return this.lineCount;
  }

  /**
   * Get word count
   */
  getWordCount(): number {
    return this.wordCount;
  }

  /**
   * Trigger file input click
   */
  onChooseFile(): void {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    // Check if adding these files would exceed max files
    if (this.selectedFiles.length + files.length > this.maxFiles) {
      swal.fire({
        icon: "warning",
        title: this.isChinaStaff ? "Too many files" : "Juda ko'p fayllar",
        text: this.isChinaStaff
          ? `You can upload a maximum of ${this.maxFiles} files`
          : `Siz maksimum ${this.maxFiles} ta fayl yuklashingiz mumkin`,
      });
      return;
    }

    // Validate and add each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > this.maxFileSize) {
        swal.fire({
          icon: "warning",
          title: this.isChinaStaff ? "File too large" : "Fayl juda katta",
          text: this.isChinaStaff
            ? `${file.name} exceeds the maximum file size (5MB)`
            : `${file.name} maksimal fayl hajmidan (5MB) oshib ketdi`,
        });
        continue;
      }

      // Check file extension
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
      if (!this.allowedExtensions.includes(fileExt)) {
        swal.fire({
          icon: "warning",
          title: this.isChinaStaff ? "Invalid file type" : "Fayl turi noto'g'ri",
          text: this.isChinaStaff
            ? `${file.name} has an invalid file type. Allowed: ${this.allowedExtensions.join(", ")}`
            : `${file.name} fayl turi noto'g'ri. Ruxsat etilgan: ${this.allowedExtensions.join(", ")}`,
        });
        continue;
      }

      // Add file to selected files
      this.selectedFiles.push(file);
    }

    // Clear input value to allow selecting the same file again
    event.target.value = "";
  }

  /**
   * Remove a file from selection
   */
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Get file size in readable format
   */
  getFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Check if file is an image
   */
  isImage(file: File): boolean {
    return file.type.startsWith("image/");
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
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
    };
    return iconMap[ext || ""] || "insert_drive_file";
  }

  /**
   * Get object URL for image preview
   */
  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Insert formatting at cursor position
   */
  insertFormatting(before: string, after: string = ""): void {
    const textarea = this.messageTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.message.substring(start, end);

    const newText =
      this.message.substring(0, start) +
      before +
      selectedText +
      after +
      this.message.substring(end);
    this.message = newText;

    // Update cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      );
    }, 0);

    this.onMessageChange();
  }

  /**
   * Format text - Bold
   */
  formatBold(): void {
    this.insertFormatting("**", "**");
  }

  /**
   * Format text - Italic
   */
  formatItalic(): void {
    this.insertFormatting("*", "*");
  }

  /**
   * Format text - Heading
   */
  formatHeading(): void {
    const textarea = this.messageTextarea.nativeElement;
    const start = textarea.selectionStart;
    const lineStart = this.message.lastIndexOf("\n", start - 1) + 1;

    this.message =
      this.message.substring(0, lineStart) +
      "# " +
      this.message.substring(lineStart);
    this.onMessageChange();
  }

  /**
   * Insert link
   */
  insertLink(): void {
    swal
      .fire({
        title: this.isChinaStaff ? "Insert Link" : "Havola qo'shish",
        html:
          `<input id="linkText" class="swal2-input" placeholder="${this.isChinaStaff ? 'Link text' : 'Havola matni'}">` +
          '<input id="linkUrl" class="swal2-input" placeholder="https://example.com">',
        showCancelButton: true,
        confirmButtonText: this.isChinaStaff ? "Insert" : "Qo'shish",
        preConfirm: () => {
          const text = (document.getElementById("linkText") as HTMLInputElement)
            .value;
          const url = (document.getElementById("linkUrl") as HTMLInputElement)
            .value;
          if (!text || !url) {
            swal.showValidationMessage(this.isChinaStaff ? "Please enter text and URL" : "Iltimos, matn va URL ni kiriting");
            return false;
          }
          return { text, url };
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          this.insertFormatting(`[${result.value.text}](${result.value.url})`);
        }
      });
  }

  /**
   * Insert bullet list
   */
  insertBulletList(): void {
    this.insertFormatting("\n- ");
  }

  /**
   * Insert numbered list
   */
  insertNumberedList(): void {
    this.insertFormatting("\n1. ");
  }

  /**
   * Insert quote
   */
  insertQuote(): void {
    this.insertFormatting("\n> ");
  }

  /**
   * Show preview modal
   */
  showPreview(): void {
    swal.fire({
      title: this.isChinaStaff ? "Message Preview" : "Xabar ko'rinishi",
      html: `<div style="text-align: left; white-space: pre-wrap;">${this.message}</div>`,
      width: "800px",
      confirmButtonText: this.isChinaStaff ? "Close" : "Yopish",
    });
  }

  /**
   * Show help modal
   */
  showHelp(): void {
    swal.fire({
      title: this.isChinaStaff ? "Formatting Help" : "Formatlash yordami",
      html: this.isChinaStaff
        ? `
        <div style="text-align: left;">
          <p><strong>**bold**</strong> - Bold text</p>
          <p><em>*italic*</em> - Italic text</p>
          <p><strong># Heading</strong> - Heading</p>
          <p><strong>[text](url)</strong> - Link</p>
          <p><strong>- item</strong> - Bullet list</p>
          <p><strong>1. item</strong> - Numbered list</p>
          <p><strong>> quote</strong> - Quote</p>
        </div>
      `
        : `
        <div style="text-align: left;">
          <p><strong>**qalin**</strong> - Qalin matn</p>
          <p><em>*qiyshiq*</em> - Qiyshiq matn</p>
          <p><strong># Sarlavha</strong> - Sarlavha</p>
          <p><strong>[matn](url)</strong> - Havola</p>
          <p><strong>- element</strong> - Nuqtali ro'yxat</p>
          <p><strong>1. element</strong> - Raqamlangan ro'yxat</p>
          <p><strong>> iqtibos</strong> - Iqtibos</p>
        </div>
      `,
      width: "600px",
      confirmButtonText: this.isChinaStaff ? "Got it" : "Tushundim",
    });
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen(): void {
    const textarea = this.messageTextarea.nativeElement;
    if (!document.fullscreenElement) {
      textarea.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }
}
