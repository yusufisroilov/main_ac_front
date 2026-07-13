import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
} from "@angular/core";

interface Message {
  id: number;
  sender_id?: number;
  sender_role: "customer" | "staff";
  sender_name: string;
  message_text: string;
  is_internal: boolean;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  attachments?: any[];
}

@Component({
  selector: "app-message-thread",
  templateUrl: "./message-thread.component.html",
  styleUrls: ["./message-thread.component.css"],
})
export class MessageThreadComponent
  implements OnChanges, AfterViewInit, AfterViewChecked
{
  @Input() messages: Message[] = [];
  @Input() ticketStatus: string = "";
  @Input() currentUserRole: string = localStorage.getItem("role") || "STAFF";
  // Id of the customer who owns the ticket. Rendered as `K<id>` next to the
  // sender name on customer-role messages so admins can identify the owner
  // at a glance while scrolling the thread.
  @Input() customerId?: number | string;

  // Logged-in user's id — drives Telegram-style left/right alignment.
  currentUserId: number = parseInt(localStorage.getItem("id") || "0", 10);

  @Output() messageEdit = new EventEmitter<{
    messageId: number;
    newText: string;
  }>();

  @ViewChild("messagesContainer", { static: false })
  messagesContainer: ElementRef;

  // Display messages in reverse order (newest at bottom)
  displayMessages: Message[] = [];

  // Edit state
  editingMessageId: number | null = null;
  editingMessageText: string = "";
  hoveredMessageId: number | null = null;

  // Image preview
  selectedImage: string | null = null;

  // Auto-scroll control
  private shouldScrollToBottom = true;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["messages"]) {
      // Sort messages by created_at to ensure oldest is first, newest is last (Telegram style)
      this.displayMessages = [...this.messages].sort((a, b) => {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      // ✅ REMOVED: Spammy console logs

      this.shouldScrollToBottom = true;
    }
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Scroll to bottom of messages container
   */
  scrollToBottom(): void {
    if (this.messagesContainer && this.messagesContainer.nativeElement) {
      setTimeout(() => {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 100);
    }
  }

  /**
   * Check if message is from customer
   */
  isCustomerMessage(message: Message): boolean {
    return message.sender_role === "customer";
  }

  /**
   * Check if message is from staff
   */
  isStaffMessage(message: Message): boolean {
    return message.sender_role === "staff";
  }

  /**
   * Telegram-style alignment: was this message sent by the currently
   * logged-in user? True → right-aligned bubble. False → left-aligned.
   */
  isOwnMessage(message: Message): boolean {
    return !!this.currentUserId && message.sender_id === this.currentUserId;
  }

  /**
   * Check if current user can edit this message
   * Only staff can edit their own messages
   */
  canEditMessage(message: Message): boolean {
    return (
      message.sender_role === "staff" &&
      this.ticketStatus !== "closed" &&
      this.currentUserRole !== "CUSTOMER"
    );
  }

  /**
   * Start editing a message
   */
  startEditing(message: Message): void {
    if (!this.canEditMessage(message)) return;

    this.editingMessageId = message.id;
    this.editingMessageText = message.message_text;
  }

  /**
   * Cancel editing
   */
  cancelEditing(): void {
    this.editingMessageId = null;
    this.editingMessageText = "";
  }

  /**
   * Save edited message
   */
  saveEdit(messageId: number): void {
    if (!this.editingMessageText.trim()) {
      return;
    }

    this.messageEdit.emit({
      messageId: messageId,
      newText: this.editingMessageText.trim(),
    });

    this.cancelEditing();
  }

  /**
   * Handle keyboard shortcuts in edit mode
   */
  onEditKeyDown(event: KeyboardEvent, messageId: number): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.saveEdit(messageId);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.cancelEditing();
    }
  }

  /**
   * Check if message is being edited
   */
  isEditing(messageId: number): boolean {
    return this.editingMessageId === messageId;
  }

  /**
   * Set hovered message
   */
  setHoveredMessage(messageId: number | null): void {
    if (this.editingMessageId === null) {
      this.hoveredMessageId = messageId;
    }
  }

  /**
   * Check if message is hovered
   */
  isHovered(messageId: number): boolean {
    return this.hoveredMessageId === messageId;
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Get initials from name for avatar
   */
  getInitials(name: string): string {
    // Strip empty / "undefined" / "null" name parts so the avatar never shows
    // garbage like "KUNDEFINED" (e.g. a staff member with a missing last_name).
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
  hasAttachments(message: Message): boolean {
    const hasAtts = message.attachments && message.attachments.length > 0;

    // ✅ OPTIONAL: Uncomment for debugging attachments
    // if (hasAtts) {
    //   console.log('Message has attachments:', message.attachments);
    // }

    return hasAtts;
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
  getFileSize(bytes: number): string {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Render message text with HTML (if it contains HTML from rich text editor)
   */
  renderMessageHTML(text: string): string {
    return text;
  }
}
