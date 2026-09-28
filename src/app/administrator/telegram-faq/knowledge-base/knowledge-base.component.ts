import { Component, OnInit } from "@angular/core";
import swal from "sweetalert2";
import { showBackendError } from "../../../shared/backend-error";
import {
  TelegramChatService,
  TgKnowledgeFact,
  TgKnowledgeFactSource,
  TgKnowledgeHandbookStats,
  TgKnowledgeHistoryEntry,
  TgKnowledgeSection,
  TgKnowledgeTestResult,
} from "../../../services/telegram-chat.service";

/** Facts grouped under one section heading, in the order the owner sees them. */
interface KbGroup {
  id: string;
  title: string;
  facts: TgKnowledgeFact[];
}

/** Shared shape for both the "new fact" form and the inline editor: a chosen
 * section (from the list, or freely typed) plus the fact text. */
interface KbSectionPick {
  section: string;
  customSection: boolean;
}

interface KbNewFact extends KbSectionPick {
  text: string;
}

interface KbEditDraft extends KbSectionPick {
  text: string;
}

const SOURCE_LABEL: Record<TgKnowledgeFactSource, string> = {
  seed: "Boshlang'ich",
  owner: "Egasi",
  learned: "O'rganilgan",
};

const ACTION_LABEL: Record<string, string> = {
  create: "Yaratildi",
  edit: "Tahrirlandi",
  activate: "Yoqildi",
  deactivate: "O'chirildi",
  restore: "Qaytarildi",
};

const TEST_ACTION_LABEL: Record<string, string> = {
  reply: "Javob",
  ask: "Savol",
  handover: "Adminga",
  no_reply: "Javob shart emas",
};

/** The marker option value that means "let me type a new section id" in a select. */
const CUSTOM_SECTION = "__custom__";

/**
 * "Bilimlar bazasi" -- the facts assistant B is allowed to read when it
 * drafts a reply. Every fact here is a short, standalone statement; prices
 * are deliberately excluded (they come from the tariff table instead), and
 * every change is kept in an audit trail an owner can read and undo.
 */
@Component({
  selector: "app-knowledge-base",
  templateUrl: "./knowledge-base.component.html",
  styleUrls: ["./knowledge-base.component.css"],
})
export class KnowledgeBaseComponent implements OnInit {
  loading = false;

  facts: TgKnowledgeFact[] = [];
  sections: TgKnowledgeSection[] = [];
  groups: KbGroup[] = [];
  visibleGroups: KbGroup[] = [];
  handbookStats: TgKnowledgeHandbookStats | null = null;

  showActiveOnly = true;

  /** "Faktlar" (the list above) or "O'rganish" (proposals + tone examples). */
  kbTab: "facts" | "inbox" = "facts";
  /** Kept live by the inbox child so the sub-tab badge shows without opening it. */
  pendingProposalsCount = 0;

  sourceLabel = SOURCE_LABEL;
  actionLabel = ACTION_LABEL;
  testActionLabel = TEST_ACTION_LABEL;
  custom = CUSTOM_SECTION;

  // ---- new fact form ----
  newFact: KbNewFact = { section: "", customSection: false, text: "" };
  creating = false;

  // ---- inline edit ----
  editingId: number | null = null;
  editDraft: KbEditDraft = { section: "", customSection: false, text: "" };
  saving = false;

  togglingId: number | null = null;

  // ---- history ----
  historyFact: TgKnowledgeFact | null = null;
  historyLoading = false;
  history: TgKnowledgeHistoryEntry[] = [];
  restoringEntryId: number | null = null;

  // ---- handbook preview ----
  handbookOpen = false;
  handbookLoading = false;
  handbookText = "";

  // ---- test box ----
  testText = "";
  testRunning = false;
  testResult: TgKnowledgeTestResult | null = null;
  private testConfirmedOnce = false;

  constructor(private telegramChat: TelegramChatService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.telegramChat.getKnowledgeFacts().subscribe({
      next: (res) => {
        this.facts = res.facts || [];
        this.sections = res.sections || [];
        this.handbookStats = res.handbook || null;
        this.groups = this.buildGroups(this.facts, this.sections);
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        showBackendError(err);
      },
    });
  }

  /** Runs once per load -- never in the template, so grouping never runs per change-detection cycle. */
  private buildGroups(facts: TgKnowledgeFact[], sections: TgKnowledgeSection[]): KbGroup[] {
    const bySection = new Map<string, TgKnowledgeFact[]>();
    for (const f of facts) {
      const list = bySection.get(f.section) || [];
      list.push(f);
      bySection.set(f.section, list);
    }
    const groups: KbGroup[] = [];
    for (const s of sections) {
      const list = bySection.get(s.id);
      if (list?.length) groups.push({ id: s.id, title: s.title, facts: list });
      bySection.delete(s.id);
    }
    // Facts under a section id nobody named: shown last, under the raw id.
    for (const [id, list] of bySection) {
      groups.push({ id, title: id, facts: list });
    }
    return groups;
  }

  /** Rebuilds the filtered view once, on demand -- not a template getter. */
  private applyFilter(): void {
    if (!this.showActiveOnly) {
      this.visibleGroups = this.groups;
      return;
    }
    this.visibleGroups = this.groups
      .map((g) => ({ ...g, facts: g.facts.filter((f) => f.is_active) }))
      .filter((g) => g.facts.length > 0);
  }

  setActiveOnly(value: boolean): void {
    this.showActiveOnly = value;
    this.applyFilter();
  }

  switchKbTab(tab: "facts" | "inbox"): void {
    this.kbTab = tab;
  }

  /** An approval that created or edited a fact -- reload the list and handbook stats. */
  onProposalDecided(event: { factsChanged: boolean }): void {
    if (event.factsChanged) this.load();
  }

  /** Shared by the "new fact" section select and the inline editor's. */
  onSectionPick(target: KbSectionPick, value: string): void {
    if (value === CUSTOM_SECTION) {
      target.customSection = true;
      target.section = "";
    } else {
      target.customSection = false;
      target.section = value;
    }
  }

  private validPick(pick: KbSectionPick, text: string): string | null {
    if (!pick.section.trim()) return "Bo'limni tanlang yoki yozing";
    if (text.trim().length < 5 || text.trim().length > 1000) {
      return "Fakt matni 5 dan 1000 belgigacha bo'lishi kerak";
    }
    return null;
  }

  // ------------------------------------------------------------ new fact

  createFact(): void {
    if (this.creating) return;
    const error = this.validPick(this.newFact, this.newFact.text);
    if (error) {
      showBackendError(error, { title: "To'ldiring" });
      return;
    }
    this.creating = true;
    const section = this.newFact.section.trim().toUpperCase();
    const text = this.newFact.text.trim();
    this.telegramChat.createKnowledgeFact(section, text).subscribe({
      next: () => {
        this.creating = false;
        this.newFact = { section: "", customSection: false, text: "" };
        this.load();
      },
      error: (err) => {
        this.creating = false;
        showBackendError(err);
      },
    });
  }

  // ------------------------------------------------------------ edit

  startEdit(fact: TgKnowledgeFact): void {
    const known = this.sections.some((s) => s.id === fact.section);
    this.editingId = fact.id;
    this.editDraft = { section: fact.section, customSection: !known, text: fact.text };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(fact: TgKnowledgeFact): void {
    if (this.saving) return;
    const error = this.validPick(this.editDraft, this.editDraft.text);
    if (error) {
      showBackendError(error, { title: "To'ldiring" });
      return;
    }
    this.saving = true;
    const section = this.editDraft.section.trim().toUpperCase();
    const text = this.editDraft.text.trim();
    this.telegramChat.updateKnowledgeFact(fact.id, { section, text }).subscribe({
      next: () => {
        this.saving = false;
        this.editingId = null;
        this.load();
      },
      error: (err) => {
        this.saving = false;
        showBackendError(err);
      },
    });
  }

  // ------------------------------------------------------------ on/off

  toggleActive(fact: TgKnowledgeFact): void {
    if (this.togglingId) return;
    this.togglingId = fact.id;
    this.telegramChat
      .updateKnowledgeFact(fact.id, { is_active: !fact.is_active })
      .subscribe({
        next: () => {
          this.togglingId = null;
          this.load();
        },
        error: (err) => {
          this.togglingId = null;
          showBackendError(err);
        },
      });
  }

  // ------------------------------------------------------------ history

  openHistory(fact: TgKnowledgeFact): void {
    this.historyFact = fact;
    this.history = [];
    this.historyLoading = true;
    this.telegramChat.getKnowledgeFactHistory(fact.id).subscribe({
      next: (res) => {
        this.history = res.history || [];
        this.historyLoading = false;
      },
      error: (err) => {
        this.historyLoading = false;
        this.historyFact = null;
        showBackendError(err);
      },
    });
  }

  closeHistory(): void {
    this.historyFact = null;
    this.history = [];
  }

  restore(entry: TgKnowledgeHistoryEntry): void {
    const fact = this.historyFact;
    if (!fact || this.restoringEntryId) return;
    swal
      .fire({
        icon: "warning",
        title: "Shu holatga qaytarilsinmi?",
        text: "Faktning joriy matni ushbu yozuvdagi holat bilan almashtiriladi.",
        showCancelButton: true,
        confirmButtonText: "Ha, qaytarish",
        cancelButtonText: "Bekor qilish",
      })
      .then((result) => {
        if (!result.isConfirmed) return;
        this.restoringEntryId = entry.id;
        this.telegramChat.restoreKnowledgeFact(fact.id, entry.id).subscribe({
          next: () => {
            this.restoringEntryId = null;
            this.closeHistory();
            this.load();
          },
          error: (err) => {
            this.restoringEntryId = null;
            showBackendError(err);
          },
        });
      });
  }

  // ------------------------------------------------------------ handbook preview

  openHandbook(): void {
    this.handbookOpen = true;
    this.handbookLoading = true;
    this.handbookText = "";
    this.telegramChat.getKnowledgeHandbook().subscribe({
      next: (res) => {
        this.handbookText = res.text || "";
        this.handbookLoading = false;
      },
      error: (err) => {
        this.handbookLoading = false;
        this.handbookOpen = false;
        showBackendError(err);
      },
    });
  }

  closeHandbook(): void {
    this.handbookOpen = false;
  }

  // ------------------------------------------------------------ test box

  runTest(): void {
    if (this.testRunning) return;
    const text = this.testText.trim();
    if (!text) {
      showBackendError("Savol matnini yozing", { title: "To'ldiring" });
      return;
    }
    if (this.testConfirmedOnce) {
      this.doRunTest(text);
      return;
    }
    swal
      .fire({
        icon: "warning",
        title: "Bu chaqiruv pullik",
        text: "Sinov AI'ga so'rov yuboradi va ~1 sentga tushadi. Davom etilsinmi?",
        showCancelButton: true,
        confirmButtonText: "Ha, sinab ko'rish",
        cancelButtonText: "Bekor qilish",
      })
      .then((result) => {
        if (!result.isConfirmed) return;
        this.testConfirmedOnce = true;
        this.doRunTest(text);
      });
  }

  private doRunTest(text: string): void {
    this.testRunning = true;
    this.testResult = null;
    this.telegramChat.testKnowledge(text).subscribe({
      next: (res) => {
        this.testRunning = false;
        this.testResult = res.result;
      },
      error: (err) => {
        this.testRunning = false;
        showBackendError(err, {
          fallback: "AI xizmati hozir ishlamayapti. Keyinroq urinib ko'ring.",
        });
      },
    });
  }

  // ------------------------------------------------------------ template helpers

  changedByLabel(name: string | null): string {
    return name && name.trim() ? name : "Tizim";
  }

  activeLabel(value: boolean): string {
    return value ? "yoqilgan" : "o'chirilgan";
  }

  toggleTitle(fact: TgKnowledgeFact): string {
    return fact.is_active ? "O'chirish" : "Yoqish";
  }

  trackGroup(_: number, g: KbGroup): string {
    return g.id;
  }

  trackFact(_: number, f: TgKnowledgeFact): number {
    return f.id;
  }

  trackHistory(_: number, h: TgKnowledgeHistoryEntry): number {
    return h.id;
  }

  trackSection(_: number, s: TgKnowledgeSection): string {
    return s.id;
  }
}
