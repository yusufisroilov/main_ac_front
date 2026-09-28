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
 * Two halves. Above: the answers that exist. Below: questions clients asked
 * that nothing covered — which is the list of answers worth writing next,
 * collected automatically rather than guessed at.
 */
@Component({
  selector: "app-telegram-faq",
  templateUrl: "./telegram-faq.component.html",
  styleUrls: ["./telegram-faq.component.css"],
})
export class TelegramFaqComponent implements OnInit {
  entries: any[] = [];
  gaps: any[] = [];
  loading = false;
  saving = false;

  /** The entry open in the editor, or null. */
  editing: any = null;
  /** Set when the editor was opened from a gap, so answering closes the gap. */
  fromGapId: number | null = null;

  showRetired = false;

  constructor(private http: HttpClient) {}

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

    this.http
      .get<any>(`${GlobalVars.baseUrl}/telegram/gaps`, { headers: this.headers() })
      .subscribe({
        next: (res) => (this.gaps = res.gaps || []),
        error: () => (this.gaps = []),
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
    this.fromGapId = null;
    this.fromAdminReply = false;
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
    this.fromGapId = null;
    this.fromAdminReply = false;
    this.editing = {
      ...entry,
      // One phrasing per line is far easier to scan and edit than a JSON array.
      variantText: (entry.variants || []).join("\n"),
    };
  }

  /** Set while the editor holds a reply taken from a chat, to show the warning. */
  fromAdminReply = false;

  /**
   * Open the editor prefilled from a question nobody could answer. With
   * `useReply`, the answer staff actually gave in the chat is the starting
   * text -- to be read and cleaned before it is saved for everyone.
   */
  answerGap(gap: any, useReply = false): void {
    const reply = useReply ? gap.admin_reply : null;
    this.fromGapId = gap.id;
    this.fromAdminReply = !!reply;
    // The client's own wording is kept: it is better matching material than
    // anything invented afterwards -- and with a reply, what they literally wrote.
    const variants = [gap.question_text, reply?.client_text]
      .filter((v: string | null) => v && v.trim())
      .filter((v: string, i: number, all: string[]) => all.indexOf(v) === i);
    this.editing = {
      id: null,
      category: reply ? this.suggestCategory(gap.question_text) : "",
      answer: reply ? reply.text : "",
      variantText: variants.join("\n"),
      never_auto_send: false,
      is_active: true,
    };
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** "Yuk ko'p bo'lsa chegirma bormi" -> "yuk_kop_bolsa_chegirma": a starting name, editable. */
  private suggestCategory(text: string): string {
    return (text || "")
      .toLowerCase()
      .replace(/[ʻʼ'`‘’]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .split("_")
      .slice(0, 4)
      .join("_")
      .slice(0, 40);
  }

  cancel(): void {
    this.editing = null;
    this.fromGapId = null;
    this.fromAdminReply = false;
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
    if (!variants.length) {
      showBackendError(
        "Kamida bitta savol varianti kerak — ularsiz bu javob hech qachon topilmaydi",
        { title: "To'ldiring" },
      );
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
      this.fromGapId = null;
      this.fromAdminReply = false;
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

    if (this.fromGapId) {
      this.http
        .post(`${GlobalVars.baseUrl}/telegram/gaps/${this.fromGapId}/answer`, body, {
          headers: this.headers(),
        })
        .subscribe({ next: done, error: fail });
    } else if (this.editing.id) {
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

  dismissGap(gap: any): void {
    this.http
      .post(
        `${GlobalVars.baseUrl}/telegram/gaps/${gap.id}/dismiss`,
        {},
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

  trackGap(_: number, g: any): number {
    return g.id;
  }
}
