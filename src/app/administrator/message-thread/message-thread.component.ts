import { Component, Input } from "@angular/core";

interface Message {
  id: number;
  sender_type: "customer" | "staff";
  sender_name: string;
  message_text: string;
  is_internal: boolean;
  created_at: string;
  attachments?: any[];
}

@Component({
  selector: "app-message-thread",
  templateUrl: "./message-thread.component.html",
  styleUrls: ["./message-thread.component.css"],
})
export class MessageThreadComponent {
  @Input() messages: Message[] = [];
  @Input() ticketStatus: string = "";

  constructor() {}

  /**
   * Check if message is from customer
   */
  isCustomerMessage(message: Message): boolean {
    return message.sender_type === "customer";
  }

  /**
   * Check if message is from staff
   */
  isStaffMessage(message: Message): boolean {
    return message.sender_type === "staff";
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
  hasAttachments(message: Message): boolean {
    return message.attachments && message.attachments.length > 0;
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
   * Render message text with HTML (if it contains HTML from rich text editor)
   */
  renderMessageHTML(text: string): string {
    return text;
  }
}
