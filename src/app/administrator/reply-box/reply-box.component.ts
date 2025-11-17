import { Component, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "app-reply-box",
  templateUrl: "./reply-box.component.html",
  styleUrls: ["./reply-box.component.css"],
})
export class ReplyBoxComponent {
  @Output() replySubmit = new EventEmitter<{
    message: string;
    closeAfterReply: boolean;
  }>();

  replyMessage: string = "";
  closeAfterReply: boolean = false;
  isSubmitting: boolean = false;

  // Rich text editor config (simple toolbar)
  editorConfig = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
    placeholder: "Type your reply here...",
  };

  constructor() {}

  /**
   * Submit reply
   */
  onSubmit(): void {
    if (!this.replyMessage.trim()) {
      return;
    }

    this.isSubmitting = true;

    this.replySubmit.emit({
      message: this.replyMessage,
      closeAfterReply: this.closeAfterReply,
    });

    // Reset form after short delay (parent will handle reload)
    setTimeout(() => {
      this.replyMessage = "";
      this.closeAfterReply = false;
      this.isSubmitting = false;
    }, 500);
  }

  /**
   * Cancel/Clear reply
   */
  onCancel(): void {
    this.replyMessage = "";
    this.closeAfterReply = false;
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return this.replyMessage.trim().length > 0;
  }
}
