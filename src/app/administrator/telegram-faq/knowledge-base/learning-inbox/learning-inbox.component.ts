import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import swal from "sweetalert2";
import { showBackendError } from "../../../../shared/backend-error";
import {
  TelegramChatService,
  TgKnowledgeProposal,
  TgKnowledgeProposalEvidence,
  TgKnowledgeProposalStatus,
  TgKnowledgeSection,
  TgKnowledgeStyle,
} from "../../../../services/telegram-chat.service";

const KIND_LABEL: Record<string, string> = {
  fact: "Yangi fakt",
  style: "Uslub namunasi",
};

/** The marker option value that means "let me type a new section id" in a select. */
const CUSTOM_SECTION = "__custom__";

/** One proposal's inline edit draft: the owner's own wording, plus a section
 * for fact/correction kinds -- a style example carries no section. */
interface LiEditDraft {
  text: string;
  section: string;
  customSection: boolean;
}

/**
 * "O'rganish" -- what the daily review of real admin replies proposes to add
 * to the knowledge base, waiting on the owner's decision, plus the approved
 * tone examples the owner curates. Nothing here reaches assistant B until
 * approved on this screen; a rejection just discards the suggestion.
 */
@Component({
  selector: "app-learning-inbox",
  templateUrl: "./learning-inbox.component.html",
  styleUrls: ["./learning-inbox.component.css"],
})
export class LearningInboxComponent implements OnInit {
  /** The fixed, Uzbek-titled sections from the facts screen, for the section select. */
  @Input() sections: TgKnowledgeSection[] = [];
  /** Emitted after a decision so the parent can reload facts when they may have changed. */
  @Output() decided = new EventEmitter<{ factsChanged: boolean }>();
  /** Emitted whenever the pending list is (re)loaded, for the sub-tab badge. */
  @Output() pendingCountChange = new EventEmitter<number>();

  statusFilter: TgKnowledgeProposalStatus = "pending";
  proposals: TgKnowledgeProposal[] = [];
  loading = false;

  styles: TgKnowledgeStyle[] = [];
  stylesLoading = false;
  togglingStyleId: number | null = null;

  busyId: number | null = null;
  editingId: number | null = null;
  editDraft: LiEditDraft = { text: "", section: "", customSection: false };
  custom = CUSTOM_SECTION;

  private openEvidenceIds = new Set<number>();
  private expandedEvidence = new Set<string>();

  constructor(private telegramChat: TelegramChatService) {}

  ngOnInit(): void {
    this.load();
    this.loadStyles();
  }

  load(status: TgKnowledgeProposalStatus = this.statusFilter): void {
    this.statusFilter = status;
    this.loading = true;
    this.telegramChat.getKnowledgeProposals(status).subscribe({
      next: (res) => {
        this.proposals = res.proposals || [];
        this.loading = false;
        if (status === "pending") this.pendingCountChange.emit(this.proposals.length);
      },
      error: (err) => {
        this.loading = false;
        showBackendError(err);
      },
    });
  }

  setFilter(status: TgKnowledgeProposalStatus): void {
    if (status === this.statusFilter) return;
    this.editingId = null;
    this.load(status);
  }

  private loadStyles(): void {
    this.stylesLoading = true;
    this.telegramChat.getKnowledgeStyles().subscribe({
      next: (res) => {
        this.styles = res.styles || [];
        this.stylesLoading = false;
      },
      error: (err) => {
        this.stylesLoading = false;
        showBackendError(err);
      },
    });
  }

  // ------------------------------------------------------------ display helpers

  kindLabel(p: TgKnowledgeProposal): string {
    if (p.kind === "correction") return `Tuzatish F${p.fact_id}`;
    return KIND_LABEL[p.kind] || p.kind;
  }

  /** The fact's text to show as "Hozir" -- today's text when we have it, else
   * the text the proposal was made against. */
  factNow(p: TgKnowledgeProposal): string {
    return p.fact_text_now ?? p.current_text ?? "";
  }

  factChangedSince(p: TgKnowledgeProposal): boolean {
    return (
      p.fact_text_now != null &&
      p.current_text != null &&
      p.fact_text_now !== p.current_text
    );
  }

  changedBy(name: string | null): string {
    return name && name.trim() ? name : "Tizim";
  }

  statusLabel(p: TgKnowledgeProposal): string {
    return p.status === "approved" ? "Tasdiqlangan" : "Rad etilgan";
  }

  // ------------------------------------------------------------ evidence

  isEvidenceOpen(id: number): boolean {
    return this.openEvidenceIds.has(id);
  }

  toggleEvidence(id: number): void {
    if (this.openEvidenceIds.has(id)) this.openEvidenceIds.delete(id);
    else this.openEvidenceIds.add(id);
  }

  isEvExpanded(proposalId: number, i: number): boolean {
    return this.expandedEvidence.has(`${proposalId}:${i}`);
  }

  toggleEvExpanded(proposalId: number, i: number): void {
    const key = `${proposalId}:${i}`;
    if (this.expandedEvidence.has(key)) this.expandedEvidence.delete(key);
    else this.expandedEvidence.add(key);
  }

  // ------------------------------------------------------------ inline edit

  startEdit(p: TgKnowledgeProposal): void {
    const section = p.section || "";
    const known = !section || this.sections.some((s) => s.id === section);
    this.editingId = p.id;
    this.editDraft = {
      text: p.proposed_text,
      section,
      customSection: !!section && !known,
    };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  onSectionPick(value: string): void {
    if (value === CUSTOM_SECTION) {
      this.editDraft.customSection = true;
      this.editDraft.section = "";
    } else {
      this.editDraft.customSection = false;
      this.editDraft.section = value;
    }
  }

  saveEdit(p: TgKnowledgeProposal): void {
    if (this.busyId) return;
    const text = this.editDraft.text.trim();
    if (text.length < 5 || text.length > 1000) {
      showBackendError("Matn 5 dan 1000 belgigacha bo'lishi kerak", { title: "To'ldiring" });
      return;
    }
    if (p.kind !== "style" && !this.editDraft.section.trim()) {
      showBackendError("Bo'limni tanlang yoki yozing", { title: "To'ldiring" });
      return;
    }
    const section =
      p.kind !== "style" ? this.editDraft.section.trim().toUpperCase() : undefined;
    this.decide(p, "approve", text, section);
  }

  // ------------------------------------------------------------ decide

  approve(p: TgKnowledgeProposal): void {
    if (this.busyId) return;
    if (p.personal) {
      swal
        .fire({
          icon: "warning",
          title: "Diqqat",
          text:
            "Bu ma'lumot bitta mijozga tegishli bo'lishi mumkin. Faqat umumiy qoida " +
            "bo'lsa tasdiqlang.",
          showCancelButton: true,
          confirmButtonText: "Ha, tasdiqlash",
          cancelButtonText: "Bekor qilish",
        })
        .then((result) => {
          if (result.isConfirmed) this.decide(p, "approve");
        });
      return;
    }
    this.decide(p, "approve");
  }

  reject(p: TgKnowledgeProposal): void {
    if (this.busyId) return;
    swal
      .fire({
        icon: "warning",
        title: "Rad etilsinmi?",
        text: "Bu taklif ro'yxatdan olib tashlanadi.",
        showCancelButton: true,
        confirmButtonText: "Ha, rad etish",
        cancelButtonText: "Bekor qilish",
      })
      .then((result) => {
        if (result.isConfirmed) this.decide(p, "reject");
      });
  }

  private decide(
    p: TgKnowledgeProposal,
    action: "approve" | "reject",
    text?: string,
    section?: string,
  ): void {
    this.busyId = p.id;
    this.telegramChat.decideKnowledgeProposal(p.id, action, text, section).subscribe({
      next: () => {
        this.busyId = null;
        this.editingId = null;
        this.proposals = this.proposals.filter((x) => x.id !== p.id);
        this.pendingCountChange.emit(this.proposals.length);
        if (p.kind === "style") {
          if (action === "approve") this.loadStyles();
        } else {
          this.decided.emit({ factsChanged: action === "approve" });
        }
      },
      error: (err) => {
        this.busyId = null;
        showBackendError(err);
        // Someone else already decided it, or the fact it corrects is gone --
        // resync the list rather than leave a stale card on screen.
        if (err?.status === 409) this.load(this.statusFilter);
      },
    });
  }

  // ------------------------------------------------------------ style examples

  toggleStyle(style: TgKnowledgeStyle): void {
    if (this.togglingStyleId) return;
    this.togglingStyleId = style.id;
    this.telegramChat.updateKnowledgeStyle(style.id, !style.is_active).subscribe({
      next: (res) => {
        this.togglingStyleId = null;
        const updated = res.style;
        this.styles = this.styles.map((s) => (s.id === updated.id ? updated : s));
      },
      error: (err) => {
        this.togglingStyleId = null;
        showBackendError(err);
      },
    });
  }

  // ------------------------------------------------------------ template helpers

  trackProposal(_: number, p: TgKnowledgeProposal): number {
    return p.id;
  }

  trackStyle(_: number, s: TgKnowledgeStyle): number {
    return s.id;
  }

  trackEvidence(_: number, e: TgKnowledgeProposalEvidence): string {
    return `${e.chat_id}:${e.at}`;
  }

  trackSection(_: number, s: TgKnowledgeSection): string {
    return s.id;
  }
}
