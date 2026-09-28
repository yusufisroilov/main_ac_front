import { Component, OnInit } from "@angular/core";
import { showBackendError } from "../../shared/backend-error";
import {
  TelegramChatService,
  TgAssistantComparisonResponse,
  TgAssistantExample,
  TgAssistantSummary,
} from "../../services/telegram-chat.service";

/** The plan's target: B's drafts should go out unchanged or lightly edited
 * at least this many points more often than A's. */
const TARGET_POINTS = 15;
/** Below this many decided drafts on either side, a verdict is a guess. */
const MIN_DECIDED = 20;
/** Above this many characters a text block starts collapsed. */
const CLAMP_CHARS = 140;

type VerdictState = "good" | "neutral" | "bad" | "unknown";

/**
 * "AI taqqoslash" -- the owner's side-by-side read on assistant B vs the
 * live assistant A (plan B, phase 7), so a week of running both decides
 * whether B is good enough to take over. Always mounted hidden by the
 * parent tab switch, so switching tabs never loses the loaded report.
 */
@Component({
  selector: "app-assistant-compare",
  templateUrl: "./assistant-compare.component.html",
  styleUrls: ["./assistant-compare.component.css"],
})
export class AssistantCompareComponent implements OnInit {
  loading = false;
  loadError = false;
  data: TgAssistantComparisonResponse | null = null;
  days = 7;

  readonly ranges = [
    { label: "7 kun", days: 7 },
    { label: "14 kun", days: 14 },
    { label: "30 kun", days: 30 },
  ];

  /** Which text blocks the owner expanded, keyed "<example index>:<field>". */
  private expanded = new Set<string>();

  constructor(private telegramChat: TelegramChatService) {}

  ngOnInit(): void {
    this.load();
  }

  setDays(days: number): void {
    if (this.days === days || this.loading) return;
    this.days = days;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.telegramChat.getAssistantComparison(this.days).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = true;
        showBackendError(err);
      },
    });
  }

  // ------------------------------------------------------------ verdict

  /** B's headline figure -- the real measure once staff have seen drafts,
   * else the same measure taken silently against what staff wrote back. */
  bFigure(b: TgAssistantSummary): { value: number | null; shadow: boolean } {
    if (b.unchanged_or_light_pct !== null) return { value: b.unchanged_or_light_pct, shadow: false };
    return { value: b.shadow_light_pct, shadow: true };
  }

  verdict(diff: number | null): { state: VerdictState; label: string } {
    if (diff === null) return { state: "unknown", label: "Ma'lumot yetarli emas" };
    if (diff >= TARGET_POINTS) return { state: "good", label: "Maqsadga yetdi" };
    if (diff < 0) return { state: "bad", label: "B yomonroq" };
    return { state: "neutral", label: "Hali yetmadi" };
  }

  lowSample(summary: TgAssistantComparisonResponse["summary"]): boolean {
    return summary.A.decided < MIN_DECIDED || summary.B.decided < MIN_DECIDED;
  }

  // ------------------------------------------------------------ formatting

  percent(v: number | null | undefined): string {
    return v === null || v === undefined ? "—" : `${v}%`;
  }

  points(v: number | null | undefined): string {
    if (v === null || v === undefined) return "—";
    return `${v > 0 ? "+" : ""}${v} punkt`;
  }

  /** Median durations read better in the largest unit that still says something. */
  duration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return "—";
    if (seconds < 60) return `${Math.round(seconds)} s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} daq`;
    const hours = seconds / 3600;
    return hours < 24 ? `${hours.toFixed(1)} soat` : `${(hours / 24).toFixed(1)} kun`;
  }

  cost(v: number | string | null | undefined): string {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    return Number.isFinite(n) ? `$${n}` : "—";
  }

  similarity(v: number | null | undefined): string {
    return v === null || v === undefined ? "—" : `${Math.round(v * 100)}% o'xshash`;
  }

  bKindLabel(kind: string): string {
    const labels: Record<string, string> = {
      b_reply: "Javob",
      b_ask: "Savol so'radi",
      b_handover: "Adminga xabar",
      b_blocked: "To'xtatildi",
      b_no_reply: "Javob shart emas",
    };
    return labels[kind] || kind;
  }

  statusLabel(status: string | null | undefined): string {
    const labels: Record<string, string> = {
      pending: "Kutmoqda",
      sent: "Yuborildi",
      edited: "Tahrirlandi",
      dismissed: "Rad etildi",
      not_chosen: "Tanlanmadi",
      expired: "Muddati o'tdi",
      shadow: "Yashirin",
    };
    return (status && labels[status]) || status || "—";
  }

  statusClass(status: string | null | undefined): string {
    if (status === "sent") return "ok";
    if (status === "edited") return "warn";
    if (status === "dismissed" || status === "not_chosen" || status === "expired") return "bad";
    if (status === "shadow") return "quiet";
    return "";
  }

  /** Handover/blocked drafts are a notice for staff, not text meant for the client. */
  isNotice(kind: string): boolean {
    return kind === "b_handover" || kind === "b_blocked";
  }

  // ------------------------------------------------------------ clamp / expand

  isLong(text: string | null | undefined): boolean {
    return !!text && text.length > CLAMP_CHARS;
  }

  isExpanded(key: string): boolean {
    return this.expanded.has(key);
  }

  toggleExpanded(key: string): void {
    if (this.expanded.has(key)) this.expanded.delete(key);
    else this.expanded.add(key);
  }

  trackExample(i: number, ex: TgAssistantExample): string {
    return `${ex.at}:${i}`;
  }
}
