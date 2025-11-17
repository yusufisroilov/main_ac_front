import { Component, Input, Output, EventEmitter } from "@angular/core";

interface InternalNote {
  id: number;
  sender_name: string;
  message_text: string;
  created_at: string;
}

@Component({
  selector: "app-internal-notes",
  templateUrl: "./internal-notes.component.html",
  styleUrls: ["./internal-notes.component.css"],
})
export class InternalNotesComponent {
  @Input() notes: InternalNote[] = [];
  @Output() noteSubmit = new EventEmitter<string>();

  newNoteText: string = "";
  isSubmitting: boolean = false;
  showAddForm: boolean = false;

  constructor() {}

  /**
   * Toggle add note form
   */
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newNoteText = "";
    }
  }

  /**
   * Submit new note
   */
  onSubmit(): void {
    if (!this.newNoteText.trim()) {
      return;
    }

    this.isSubmitting = true;
    this.noteSubmit.emit(this.newNoteText.trim());

    // Reset form after short delay
    setTimeout(() => {
      this.newNoteText = "";
      this.showAddForm = false;
      this.isSubmitting = false;
    }, 500);
  }

  /**
   * Cancel adding note
   */
  onCancel(): void {
    this.newNoteText = "";
    this.showAddForm = false;
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
   * Check if form is valid
   */
  isValid(): boolean {
    return this.newNoteText.trim().length > 0;
  }
}
