import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "../../global-vars";
import { showBackendError } from "../../shared/backend-error";
import swal from "sweetalert2";

/**
 * Manage what the assistant is allowed to say.
 *
 * Every answer here is sent to clients word for word — the model chooses which
 * entry fits, it never writes one. So this screen is the whole vocabulary, and
 * editing a price here changes what every client is told from the next message
 * onward.
 *
 * The answers that exist -- what the model chooses from, never writes itself.
 */
@Component({
  selector: "app-telegram-faq",
  templateUrl: "./telegram-faq.component.html",
  styleUrls: ["./telegram-faq.component.css"],
})
export class TelegramFaqComponent implements OnInit {
  entries: any[] = [];
  loading = false;
  saving = false;

  /** The entry open in the editor, or null. */
  editing: any = null;

  showRetired = false;

  /** "Javoblar" (today's approved answers), "Bilimlar bazasi" (facts assistant
   * B reads), or "Avtomatik javob" (the bot's own on/off switch). */
  activeTab: "faq" | "kb" | "auto" = "faq";

  constructor(private http: HttpClient) {}

  switchTab(tab: "faq" | "kb" | "auto"): void {
    this.activeTab = tab;
  }

  ngOnInit(): void {
    this.load();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `${localStorage.getItem("token")}`,
    });
  }

  load(): void {
    this.loading = true;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/telegram/faq/manage`, {
        headers: this.headers(),
      })
      .subscribe({
        next: (res) => {
          this.entries = res.entries || [];
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          showBackendError(err);
        },
      });
  }

  get visibleEntries(): any[] {
    return this.showRetired
      ? this.entries
      : this.entries.filter((e) => e.is_active);
  }

  get lockedCount(): number {
    return this.entries.filter((e) => e.is_active && e.never_auto_send).length;
  }

  // ------------------------------------------------------------------ editor

  newEntry(): void {
    this.editing = {
      id: null,
      category: "",
      answer: "",
      variantText: "",
      never_auto_send: false,
      is_active: true,
    };
  }

  edit(entry: any): void {
    this.editing = {
      ...entry,
      // One phrasing per line is far easier to scan and edit than a JSON array.
      variantText: (entry.variants || []).join("\n"),
    };
  }

  cancel(): void {
    this.editing = null;
  }

  private variantsFromText(): string[] {
    return (this.editing.variantText || "")
      .split("\n")
      .map((v: string) => v.trim())
      .filter((v: string) => v.length > 0);
  }

  save(): void {
    if (this.saving || !this.editing) return;

    const variants = this.variantsFromText();
    if (!this.editing.answer?.trim()) {
      showBackendError("Javob matni bo'sh", { title: "To'ldiring" });
      return;
    }

    this.saving = true;
    const body: any = {
      category: this.editing.category,
      answer: this.editing.answer,
      variants,
      never_auto_send: !!this.editing.never_auto_send,
    };

    const done = (res: any) => {
      this.saving = false;
      this.editing = null;
      // The server decides whether an edit took ownership from the seed file;
      // saying so here stops a manager being surprised later.
      if (res?.took_ownership) {
        swal.fire({
          icon: "info",
          title: "Saqlandi",
          text: "Bu javob endi panel orqali boshqariladi — seed fayl uni qayta yozmaydi.",
        });
      }
      this.load();
    };
    const fail = (err: any) => {
      this.saving = false;
      showBackendError(err);
    };

    if (this.editing.id) {
      this.http
        .patch(`${GlobalVars.baseUrl}/telegram/faq/${this.editing.id}`, body, {
          headers: this.headers(),
        })
        .subscribe({ next: done, error: fail });
    } else {
      this.http
        .post(`${GlobalVars.baseUrl}/telegram/faq`, body, { headers: this.headers() })
        .subscribe({ next: done, error: fail });
    }
  }

  /**
   * Retire rather than delete. An entry that answered clients for months is
   * part of the record of what they were told.
   */
  toggleActive(entry: any): void {
    this.http
      .patch(
        `${GlobalVars.baseUrl}/telegram/faq/${entry.id}`,
        { is_active: !entry.is_active },
        { headers: this.headers() },
      )
      .subscribe({ next: () => this.load(), error: (e) => showBackendError(e) });
  }

  toggleLock(entry: any): void {
    this.http
      .patch(
        `${GlobalVars.baseUrl}/telegram/faq/${entry.id}`,
        { never_auto_send: !entry.never_auto_send },
        { headers: this.headers() },
      )
      .subscribe({ next: () => this.load(), error: (e) => showBackendError(e) });
  }

  variantCount(entry: any): number {
    return (entry.variants || []).length;
  }

  trackEntry(_: number, e: any): number {
    return e.id;
  }
}
