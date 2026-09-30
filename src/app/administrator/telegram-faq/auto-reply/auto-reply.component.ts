import { Component, OnInit } from "@angular/core";
import swal from "sweetalert2";
import { showBackendError } from "../../../shared/backend-error";
import {
  TelegramChatService,
  TgAutoReplyHistoryEntry,
  TgAutoReplyMode,
  TgAutoReplySettings,
} from "../../../services/telegram-chat.service";

const MODE_LABEL: Record<TgAutoReplyMode, string> = {
  off: "O'chiq",
  night: "Faqat tunda",
  always: "Doim",
};

/** Order of strictness -- used only to decide which option cards a lower
 * `max_mode` disables, never to sort or filter a list. */
const MODE_RANK: Record<TgAutoReplyMode, number> = { off: 0, night: 1, always: 2 };

const STATUS_TEXT: Record<TgAutoReplyMode, string> = {
  off: "O'chiq — bot o'zi javob bermaydi, adminlar 🤖 tugmasidan foydalanadi",
  night: "Faqat tunda — ish vaqtidan tashqari bot o'zi javob beradi",
  always: "Doim — bot kun-u tun o'zi javob beradi",
};

interface AutoReplyOption {
  mode: TgAutoReplyMode;
  label: string;
  desc: string;
}

const OPTIONS: AutoReplyOption[] = [
  {
    mode: "off",
    label: MODE_LABEL.off,
    desc: "Bot javob yozmaydi -- har doim odam javob beradi yoki 🤖 tugmasi bosiladi.",
  },
  {
    mode: "night",
    label: MODE_LABEL.night,
    desc: "Ish vaqtida odam javob beradi; ish vaqtidan tashqari bot o'zi javob beradi.",
  },
  {
    mode: "always",
    label: MODE_LABEL.always,
    desc: "Bot kun-u tun mijozlarga o'zi javob beradi -- admin tasdig'i shart emas.",
  },
];

const HISTORY_KEY_LABEL: Record<string, string> = {
  auto_reply_mode: "Avtomatik javob rejimi",
  daily_limit: "Kunlik AI limiti",
};

/**
 * "Avtomatik javob" -- switches the Telegram bot between answering nobody,
 * answering only outside working hours, or answering around the clock, plus
 * the daily cap on automatic AI calls. Once a mode above "off" is on, the bot
 * replies to real customers with no person checking first, so this screen
 * exists to make the current state impossible to miss and turning it on a
 * deliberate act (a confirm) while turning it off is a single, instant click.
 */
@Component({
  selector: "app-auto-reply",
  templateUrl: "./auto-reply.component.html",
  styleUrls: ["./auto-reply.component.css"],
})
export class AutoReplyComponent implements OnInit {
  loading = false;
  loadError = false;
  saving = false;

  data: TgAutoReplySettings | null = null;
  /** Sliced to 10 once per load/save, never in the template. */
  recentHistory: TgAutoReplyHistoryEntry[] = [];

  dailyLimitInput: number | null = null;

  readonly options = OPTIONS;
  readonly statusText = STATUS_TEXT;

  constructor(private telegramChat: TelegramChatService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.telegramChat.getAutoReplySettings().subscribe({
      next: (res) => {
        this.applyData(res);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = true;
        showBackendError(err);
      },
    });
  }

  private applyData(res: TgAutoReplySettings): void {
    this.data = res;
    this.dailyLimitInput = res.daily_limit;
    this.recentHistory = (res.history || []).slice(0, 10);
  }

  modeLabel(mode: TgAutoReplyMode | string | null | undefined): string {
    if (mode === "off" || mode === "night" || mode === "always") return MODE_LABEL[mode];
    return mode == null ? "—" : String(mode);
  }

  /** Whether an option card is above what the server currently allows. */
  isDisabledOption(mode: TgAutoReplyMode): boolean {
    if (!this.data) return true;
    return MODE_RANK[mode] > MODE_RANK[this.data.max_mode];
  }

  selectMode(mode: TgAutoReplyMode): void {
    if (!this.data || !this.data.can_edit || this.saving) return;
    if (mode === this.data.mode || this.isDisabledOption(mode)) return;

    if (mode === "off") {
      this.applyMode(mode);
      return;
    }

    swal
      .fire({
        icon: "warning",
        title: "Yoqasizmi?",
        text: "Bot mijozlarga admin tasdig'isiz javob beradi. Yoqasizmi?",
        showCancelButton: true,
        confirmButtonText: "Ha, yoqish",
        cancelButtonText: "Bekor qilish",
      })
      .then((result) => {
        if (result.isConfirmed) this.applyMode(mode);
      });
  }

  /** The prominent "turn off now" button -- no confirm, since off is the
   * safe direction. */
  turnOffNow(): void {
    if (!this.data || !this.data.can_edit || this.saving) return;
    this.applyMode("off");
  }

  private applyMode(mode: TgAutoReplyMode): void {
    this.saving = true;
    this.telegramChat.updateAutoReplySettings({ mode }).subscribe({
      next: (res) => {
        this.applyData(res);
        this.saving = false;
      },
      error: (err) => {
        this.saving = false;
        showBackendError(err);
      },
    });
  }

  saveDailyLimit(): void {
    if (!this.data || !this.data.can_edit || this.saving) return;
    const value = this.dailyLimitInput;
    if (value == null || !Number.isFinite(value) || value < 0 || value > 2000) {
      showBackendError("Limit 0 dan 2000 gacha butun son bo'lishi kerak", {
        title: "Noto'g'ri qiymat",
      });
      return;
    }
    this.saving = true;
    this.telegramChat.updateAutoReplySettings({ daily_limit: Math.round(value) }).subscribe({
      next: (res) => {
        this.applyData(res);
        this.saving = false;
      },
      error: (err) => {
        this.saving = false;
        showBackendError(err);
      },
    });
  }

  changedByLabel(name: string | null): string {
    return name && name.trim() ? name : "Tizim";
  }

  historyKeyLabel(key: string): string {
    return HISTORY_KEY_LABEL[key] || key;
  }

  /** "Faqat tunda → Doim" for the mode setting, "50 → 200" for the limit,
   * and a plain before/after for anything else the server ever adds. */
  historyLine(h: TgAutoReplyHistoryEntry): string {
    if (h.key === "auto_reply_mode") {
      return `${this.modeLabel(h.before as string)} → ${this.modeLabel(h.after as string)}`;
    }
    const before = h.before == null ? "—" : String(h.before);
    const after = h.after == null ? "—" : String(h.after);
    return `${before} → ${after}`;
  }

  /** $, 2-4 decimals -- same rule as "AI xarajatlari" next door. */
  cost(v: number | null | undefined): string {
    const n = Number(v);
    if (v === null || v === undefined || !Number.isFinite(n)) return "—";
    return `$${n.toFixed(n > 0 && n < 1 ? 4 : 2)}`;
  }

  trackOption(_: number, o: AutoReplyOption): string {
    return o.mode;
  }

  trackHistory(_: number, h: TgAutoReplyHistoryEntry): string {
    return `${h.key}_${h.created_at}`;
  }
}
