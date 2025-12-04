import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import swal from "sweetalert2";

interface FileWithPreview {
  file: File;
  name: string;
  size: number;
  preview?: string;
}

@Component({
  selector: "app-reply-box",
  templateUrl: "./reply-box.component.html",
  styleUrls: ["./reply-box.component.css"],
})
export class ReplyBoxComponent implements OnInit {
  @Input() placeholder: string = "Type your message here...";
  @Input() submitButtonText: string = "Send Reply";
  @Input() hintText: string =
    "Press Ctrl+Enter to send, or click the send button";
  @Input() maxFiles: number = 5;
  @Input() maxFileSize: number = 5 * 1024 * 1024; // 5MB
  @Input() allowedFileTypes: string[] = [
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

  @Output() replySubmit = new EventEmitter<{
    messageText: string;
    files: File[];
  }>();

  messageText: string = "";
  selectedFiles: FileWithPreview[] = [];
  isSubmitting: boolean = false;

  constructor() {}

  ngOnInit(): void {}

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
        title: "Too Many Files",
        text: `You can only attach up to ${this.maxFiles} files. Currently selected: ${this.selectedFiles.length}`,
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
          title: "File Too Large",
          text: `${
            file.name
          } is too large. Maximum file size is ${this.formatFileSize(
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
          title: "Invalid File Type",
          text: `${file.name} is not a supported file type. Allowed: Images, PDF, ZIP, RAR`,
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
   * Check if file is an image
   */
  isImageFile(filename: string): boolean {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
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
   * Format file size to readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return this.messageText.trim().length >= 5 || this.selectedFiles.length > 0;
  }

  /**
   * Handle keyboard shortcuts
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      if (this.isValid() && !this.isSubmitting) {
        this.onSubmit();
      }
    }
  }

  /**
   * Submit the reply
   */
  onSubmit(): void {
    if (!this.isValid() || this.isSubmitting) {
      return;
    }

    // Extract actual File objects from FileWithPreview
    const files = this.selectedFiles.map((f) => f.file);

    // Emit the reply data
    this.replySubmit.emit({
      messageText: this.messageText.trim(),
      files: files,
    });

    // Note: The parent component should handle:
    // 1. Setting isSubmitting = true
    // 2. Making the API call
    // 3. Resetting the form by calling resetForm()
  }

  /**
   * Reset the form (called by parent after successful submission)
   */
  resetForm(): void {
    this.messageText = "";
    this.selectedFiles = [];
    this.isSubmitting = false;
  }

  /**
   * Set submitting state (called by parent)
   */
  setSubmitting(state: boolean): void {
    this.isSubmitting = state;
  }
}
