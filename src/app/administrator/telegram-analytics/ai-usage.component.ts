import { Component, OnInit } from "@angular/core";
import { extractBackendError, showBackendError } from "../../shared/backend-error";
import {
  TelegramChatService,
  TgAiUsageByDay,
  TgAiUsageByFeature,
  TgAiUsageResponse,
  TgAiUsageTotals,
} from "../../services/telegram-chat.service";

/** Sonnet 5 list prices per token, used only to split the API's total cost
 * into reading / writing / thinking shares -- the dollar total shown at the
 * top always comes from the server, never from this split. */
const PRICE_PER_TOKEN = {
  input: 2 / 1_000_000,
  cacheRead: 0.2 / 1_000_000,
  cacheWrite: 4 / 1_000_000,
  output: 10 / 1_000_000,
};

const FEATURE_LABELS: Record<string, string> = {
  matcher: "Javob tanlash (A)",
  composer: "Javob yozish (B)",
  closing: "Xayrlashuv",
  ask_back: "Qayta so'rash",
  price_extract: "Narx hisoblash",
  photo_read: "Rasm o'qish",
  photo_judge: "Rasmni ko'rish kerakmi",
  address_read: "Manzil skrinshoti",
  prohibited: "Taqiqlangan buyum",
  reply_judge: "Javob kerakmidi (tahlil)",
  topics: "Mavzular tahlili",
  learning: "O'rganish (kunlik)",
  quality: "Sifat nazorati",
};

/** Below this cache-hit share, with real traffic, caching isn't paying off. */
const LOW_CACHE_HIT_PCT = 50;

interface UsageSplitRow {
  label: string;
  tokens: number;
  costUsd: number;
  /** Width of its bar, as a share of reading+writing cost (sums to ~100). */
  pct: number;
}

/**
 * "AI xarajatlari" -- what the Telegram assistants cost the owner: reading,
 * writing and (estimated) thinking tokens and dollars, per day and per
 * feature, plus today's calls against the daily automatic-call limit.
 * Always mounted hidden by the parent tab switch, same as "AI taqqoslash"
 * next door, so switching tabs never loses the loaded report.
 */
@Component({
  selector: "app-ai-usage",
  templateUrl: "./ai-usage.component.html",
  styleUrls: ["./ai-usage.component.css"],
})
export class AiUsageComponent implements OnInit {
  loading = false;
  loadError = false;
  /** Set instead of `loadError` when the usage migration hasn't run yet --
   * the server's own readable message, shown plainly, not as an error. */
  notReady: string | null = null;
  data: TgAiUsageResponse | null = null;
  days = 30;

  readonly ranges = [
    { label: "7 kun", days: 7 },
    { label: "30 kun", days: 30 },
    { label: "90 kun", days: 90 },
  ];

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
    this.notReady = null;
    this.telegramChat.getAiUsage(this.days).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 503) {
          this.notReady = extractBackendError(err, "AI xarajatlari hisobi hali tayyor emas.");
        } else {
          this.loadError = true;
          showBackendError(err);
        }
      },
    });
  }

  featureLabel(feature: string): string {
    return FEATURE_LABELS[feature] || feature;
  }

  /** "2026-09-29" -> "29.09.2026", without going through a timezone-aware
   * date pipe -- this is a calendar day, not an instant. */
  dayLabel(day: string): string {
    const [y, m, d] = day.split("-");
    return y && m && d ? `${d}.${m}.${y}` : day;
  }

  /** $, 2-4 decimals -- fewer digits once the number is big enough to read
   * fine with two. */
  cost(v: number | null | undefined): string {
    const n = Number(v);
    if (v === null || v === undefined || !Number.isFinite(n)) return "—";
    return `$${n.toFixed(n > 0 && n < 1 ? 4 : 2)}`;
  }

  percent(v: number | null | undefined, digits = 0): string {
    return v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v.toFixed(digits)}%`;
  }

  readingTokens(row: TgAiUsageTotals): number {
    return row.input_tokens + row.cache_read_tokens + row.cache_write_tokens;
  }

  private readingCost(row: TgAiUsageTotals): number {
    return (
      row.input_tokens * PRICE_PER_TOKEN.input +
      row.cache_read_tokens * PRICE_PER_TOKEN.cacheRead +
      row.cache_write_tokens * PRICE_PER_TOKEN.cacheWrite
    );
  }

  private writingCost(row: TgAiUsageTotals): number {
    return row.output_tokens * PRICE_PER_TOKEN.output;
  }

  /** Reading vs writing for the period, as bars scaled to their combined
   * (locally-computed) cost -- the two together are the whole of that cost. */
  get readWrite(): { reading: UsageSplitRow; writing: UsageSplitRow } | null {
    const t = this.data?.total;
    if (!t) return null;
    const readingCostUsd = this.readingCost(t);
    const writingCostUsd = this.writingCost(t);
    const sum = readingCostUsd + writingCostUsd;
    return {
      reading: {
        label: "O'qish",
        tokens: this.readingTokens(t),
        costUsd: readingCostUsd,
        pct: sum > 0 ? (readingCostUsd / sum) * 100 : 0,
      },
      writing: {
        label: "Yozish",
        tokens: t.output_tokens,
        costUsd: writingCostUsd,
        pct: sum > 0 ? (writingCostUsd / sum) * 100 : 0,
      },
    };
  }

  /** Thinking sits inside writing, not beside it -- shown as its estimated
   * share of the writing cost, never added on top of the reading/writing
   * split above. */
  get thinking(): { tokens: number; costUsd: number; pctOfWriting: number } | null {
    const t = this.data?.total;
    if (!t) return null;
    const writingCostUsd = this.writingCost(t);
    const thinkingCostUsd = t.thinking_tokens_est * PRICE_PER_TOKEN.output;
    return {
      tokens: t.thinking_tokens_est,
      costUsd: thinkingCostUsd,
      pctOfWriting: writingCostUsd > 0 ? (thinkingCostUsd / writingCostUsd) * 100 : 0,
    };
  }

  lowCacheHit(d: TgAiUsageResponse): boolean {
    return d.total.calls > 0 && d.cache_hit_pct !== null && d.cache_hit_pct < LOW_CACHE_HIT_PCT;
  }

  featureShare(f: TgAiUsageByFeature): number {
    const total = this.data?.total.cost_usd || 0;
    return total > 0 ? (f.cost_usd / total) * 100 : 0;
  }

  todayPct(): number {
    const t = this.data?.today;
    if (!t || !t.limit) return 0;
    return Math.min(100, (t.calls / t.limit) * 100);
  }

  todayState(): "ok" | "warn" | "bad" {
    const t = this.data?.today;
    if (t && t.limit && t.calls >= t.limit) return "bad";
    return this.todayPct() >= 80 ? "warn" : "ok";
  }

  /** Bar width relative to the costliest day in the period, so one heavy day
   * doesn't flatten the rest to invisible slivers. */
  dayBarPct(day: TgAiUsageByDay): number {
    const peak = Math.max(...(this.data?.by_day || []).map((d) => d.cost_usd), 0.0001);
    return (day.cost_usd / peak) * 100;
  }

  trackDay(_: number, row: TgAiUsageByDay): string {
    return row.day;
  }

  trackFeature(_: number, row: TgAiUsageByFeature): string {
    return row.feature;
  }
}
