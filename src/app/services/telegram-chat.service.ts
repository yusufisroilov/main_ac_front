import { Injectable, NgZone } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { GlobalVars } from "../global-vars";

export interface TgChatCustomer {
  id: number;
  first_name: string;
  last_name: string;
  /** The client's phone number — this system uses it as the username. */
  username: string;
  balance_usd?: string | number | null;
  balance_uzs?: string | number | null;
}

export interface TgChatAccount {
  id: number;
  username: string | null;
  name: string | null;
  can_reply: boolean;
}

export interface TgChat {
  id: number;
  tg_chat_id: string;
  type: string;
  name: string;
  username: string | null;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_type: string | null;
  is_archived: boolean;
  customer: TgChatCustomer | null;
  account: TgChatAccount | null;
  /** A name staff typed themselves; null when none has been set. */
  display_name: string | null;
  /** What Telegram calls them, kept so it can be shown under a saved name. */
  telegram_name: string | null;
  /** Staff switched the assistant off for this chat -- it neither reads
   * messages here nor drafts automatic replies. The 🤖 button still works. */
  ai_disabled: boolean;
}

export interface TgMedia {
  id: string;
  kind: string;
  mime_type: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  file_name: string | null;
  /** done | pending | skipped | failed */
  status: string;
  /** video_excluded (a decision) vs over_20mb (a limit) — worded differently */
  skip_reason: string | null;
  url: string | null;
  thumb_url: string | null;
  /** Speech-to-text of a voice/audio message; null for every other kind. */
  transcript: string | null;
  /** done | failed | skipped | too_long | null -- only set for voice/audio. */
  transcript_status: "done" | "failed" | "skipped" | "too_long" | null;
  /** UI-only: the "to'liq" expand was pressed for this message's transcript. */
  transcriptExpanded?: boolean;
}

export interface TgEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

/**
 * One run of message text with its formatting. Built in the component from
 * Telegram's entity offsets and rendered as ordinary DOM, so Angular escapes
 * the text and sanitises the href itself.
 */
export interface TgSegment {
  text: string;
  /** text | bold | italic | underline | strike | code | pre | spoiler | link */
  kind: string;
  href?: string | null;
}

export interface TgMessage {
  id: string;
  tg_message_id: string;
  direction: "in" | "out";
  type: string;
  text: string | null;
  entities: TgEntity[] | null;
  reply_to_tg_message_id: string | null;
  forward_from: string | null;
  tg_date: string;
  edited_at: string | null;
  deleted_at: string | null;
  send_status: string | null;
  send_error: string | null;
  media: TgMedia | null;
  /** Filled in by the component once, rather than on every change detection. */
  segments?: TgSegment[];
}

export interface TgMessagesResponse {
  status: string;
  chat: TgChat;
  media_token: string;
  has_more: boolean;
  messages: TgMessage[];
}

/**
 * One step of how assistant B produced its draft, shown to staff so a wrong
 * or blocked answer can be understood rather than just distrusted. Which
 * fields are set depends on `step`; the rest are absent.
 */
export interface TgDraftTraceStep {
  step: "route" | "inputs" | "model" | "tool" | "fact_check" | "decision";
  at?: string;
  ms?: number;
  /** route */
  to?: string;
  why?: string;
  /** inputs */
  handbook?: boolean;
  context?: boolean;
  linked?: boolean;
  /** model */
  turn?: number;
  stop?: string;
  cache_read?: boolean;
  /** tool */
  name?: string;
  ok?: boolean;
  error?: string;
  /** fact_check */
  failures?: string[];
  /** decision */
  action?: string;
  attempts?: number;
  cost_usd?: string | number | null;
  blocked_text?: string | null;
}

/**
 * The pending suggestion for the open chat's newest unanswered message. B is
 * the only assistant, so a suggestion is always its own draft. Never sent on
 * its own -- a person decides. `variant`, `message_id`, `created_at` and
 * `never_auto_send` come from the GET endpoint; the button's POST returns a
 * narrower shape without them.
 */
export interface TgDraft {
  id: string;
  variant?: "A" | "B";
  message_id?: string;
  kind: string;
  suggested_text: string;
  confidence: string;
  match_reason: string | null;
  requires_human: boolean;
  created_at?: string;
  category: string | null;
  never_auto_send?: boolean | null;
  cost_usd?: string | number | null;
  trace?: TgDraftTraceStep[] | null;
  /** Filled in by the component once, rather than on every change detection. */
  traceLines?: string[];
  /** UI-only: whether the composer holds this draft's edited text. */
  editing?: boolean;
  editText?: string;
  /** UI-only: whether the "Qanday tayyorlandi?" panel is expanded. */
  traceOpen?: boolean;
  /** UI-only: the text generated but not sent, when a decision step blocked it. */
  blockedText?: string | null;
}

export interface TgDraftResponse {
  status: string;
  /** The pending draft, or null when there is none. */
  draft: TgDraft | null;
}

// ------------------------------------------------------------ knowledge base

/** One heading in the fixed, Uzbek-titled display order for the handbook. */
export interface TgKnowledgeSection {
  id: string;
  title: string;
}

/** seed = shipped with the app; owner = the business owner wrote it by hand;
 * learned = taken from an approved chat answer. */
export type TgKnowledgeFactSource = "seed" | "owner" | "learned";

/** One statement assistant B is allowed to tell clients, word for word. */
export interface TgKnowledgeFact {
  id: number;
  section: string;
  text: string;
  is_active: boolean;
  source: TgKnowledgeFactSource;
  created_at: string;
  updated_at: string;
  changed_at: string | null;
  /** Who last changed it; null means the seed script (shown as "Tizim"). */
  changed_by: string | null;
}

export interface TgKnowledgeHandbookStats {
  version: number | string;
  approx_tokens: number;
  facts: number;
}

export interface TgKnowledgeFactsResponse {
  status: string;
  facts: TgKnowledgeFact[];
  sections: TgKnowledgeSection[];
  handbook: TgKnowledgeHandbookStats;
}

export type TgKnowledgeAction = "create" | "edit" | "activate" | "deactivate" | "restore";

/** The shape of a fact at one point in time, as kept in its audit trail. */
export interface TgKnowledgeFactState {
  section: string;
  text: string;
  is_active: boolean;
}

export interface TgKnowledgeHistoryEntry {
  id: number;
  action: TgKnowledgeAction;
  before: TgKnowledgeFactState | null;
  after: TgKnowledgeFactState | null;
  at: string;
  /** Who made the change; null means the system (shown as "Tizim"). */
  user_name: string | null;
}

/** The compiled text assistant B actually reads, for the read-only preview. */
export interface TgKnowledgeHandbook {
  text: string;
  version: number | string;
  approx_tokens: number;
  sections: number;
  skipped_answers: number;
}

export type TgKnowledgeTestAction = "reply" | "ask" | "handover" | "no_reply";

/** What a real model call decided for one tried-out customer question. */
export interface TgKnowledgeTestResult {
  action: TgKnowledgeTestAction;
  text: string;
  client_wants: string | null;
  /** Why the model chose this action -- written in English by the model itself. */
  reason: string;
  confidence: string | number;
  sections_used: string[];
  facts_used: string[];
  blocked_text: string | null;
  failures: string[];
  cost_usd: string | number | null;
  ms: number;
  trace: TgDraftTraceStep[] | null;
  handbook_version: number | string;
}

// -------------------------------------------------------- learning inbox

export type TgKnowledgeProposalKind = "fact" | "correction" | "style";
export type TgKnowledgeProposalStatus = "pending" | "approved" | "rejected";

/** One real exchange the daily review used as evidence for a proposal. */
export interface TgKnowledgeProposalEvidence {
  type: "edited" | "answered" | "unchanged";
  chat_id: number;
  chat_name: string;
  at: string;
  client_text: string;
  suggested_text: string | null;
  staff_text: string | null;
}

/**
 * A suggestion from the daily review of real admin replies, waiting on the
 * owner's decision. Nothing here reaches assistant B until approved.
 */
export interface TgKnowledgeProposal {
  id: number;
  kind: TgKnowledgeProposalKind;
  section: string | null;
  /** The fact this is a correction of; null for a new fact or a style example. */
  fact_id: number | null;
  proposed_text: string;
  /** The fact's text at the moment this proposal was made (correction only). */
  current_text: string | null;
  /** The fact's text right now -- may have moved on since the proposal was made. */
  fact_text_now: string | null;
  /** Why the model suggested this -- written in English, one sentence. */
  reason: string;
  /** True when the evidence looks specific to one client rather than a general rule. */
  personal: boolean;
  status: TgKnowledgeProposalStatus;
  created_at: string;
  decided_at: string | null;
  decided_by_name: string | null;
  result_fact_id: number | null;
  result_style_id: number | null;
  evidence: TgKnowledgeProposalEvidence[];
}

export interface TgKnowledgeProposalsResponse {
  proposals: TgKnowledgeProposal[];
}

export interface TgKnowledgeProposalDecideResult {
  fact_id: number | null;
  style_id: number | null;
}

/** An approved tone example -- style only, never facts or prices. */
export interface TgKnowledgeStyle {
  id: number;
  text: string;
  is_active: boolean;
  created_at: string;
  created_by_name: string | null;
}

export interface TgKnowledgeStylesResponse {
  styles: TgKnowledgeStyle[];
}

// ------------------------------------------------------------ AI usage / cost

/**
 * Token and dollar counts shared by the period total, each day and each
 * feature row. `thinking_tokens_est` is an estimate included inside
 * `output_tokens`, not additional to it -- the API doesn't report thinking
 * separately.
 */
export interface TgAiUsageTotals {
  calls: number;
  input_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  output_tokens: number;
  thinking_tokens_est: number;
  cost_usd: number;
}

export interface TgAiUsageByDay extends TgAiUsageTotals {
  /** "2026-09-29" */
  day: string;
}

export interface TgAiUsageByFeature extends TgAiUsageTotals {
  feature: string;
}

export interface TgAiUsageToday {
  day: string;
  calls: number;
  limit: number;
}

export interface TgAiUsageResponse {
  status: string;
  days: number;
  total: TgAiUsageTotals;
  /** Share of reading served from the cache; null with no reading yet. */
  cache_hit_pct: number | null;
  /** Newest first. */
  by_day: TgAiUsageByDay[];
  /** Most expensive first. */
  by_feature: TgAiUsageByFeature[];
  today: TgAiUsageToday;
}

// ------------------------------------------------------------ auto-reply settings

/** off = a person always answers; night = the bot answers outside working
 * hours only; always = the bot answers around the clock. */
export type TgAutoReplyMode = "off" | "night" | "always";

export interface TgAutoReplyToday {
  calls: number;
  limit: number;
  cost_usd: number;
  /** null when the split between bot and handed-over isn't tracked yet. */
  bot_replies: number | null;
  handed_over: number | null;
}

/** `key` is the setting that changed; unrecognised keys are still shown,
 * generically, rather than dropped. */
export interface TgAutoReplyHistoryEntry {
  key: "auto_reply_mode" | "daily_limit" | string;
  before: unknown;
  after: unknown;
  user_name: string | null;
  created_at: string;
}

export interface TgAutoReplySettings {
  /** What was chosen. */
  mode: TgAutoReplyMode;
  /** What is actually running -- lower than `mode` when the server caps it. */
  effective_mode: TgAutoReplyMode;
  /** The highest mode the server will run, regardless of what is chosen. */
  max_mode: TgAutoReplyMode;
  daily_limit: number;
  /** False for anyone but OWNER/MANAGER -- the UI must still render, disabled. */
  can_edit: boolean;
  updated_at: string | null;
  updated_by_name: string | null;
  today: TgAutoReplyToday;
  /** Newest first. */
  history: TgAutoReplyHistoryEntry[];
}

/**
 * Reads the Telegram conversations mirrored from staff accounts.
 *
 * Media and the event stream carry their own short-lived token in the query
 * string rather than an Authorization header, because <img>, <video>, <audio>
 * and EventSource cannot send headers. The token comes back with each message
 * page; the URLs in a response already include it.
 */
@Injectable({ providedIn: "root" })
export class TelegramChatService {
  private apiUrl = GlobalVars.baseUrl;

  constructor(private http: HttpClient, private zone: NgZone) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem("token");
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `${token}`,
    });
  }

  listChats(options: {
    search?: string;
    archived?: boolean;
    limit?: number;
    offset?: number;
    /** One chat by id, whatever page of the list it would fall on. */
    id?: number;
  } = {}): Observable<any> {
    let params = new HttpParams();
    if (options.id) params = params.set("id", String(options.id));
    if (options.search) params = params.set("search", options.search);
    if (options.archived) params = params.set("archived", "1");
    if (options.limit) params = params.set("limit", String(options.limit));
    if (options.offset) params = params.set("offset", String(options.offset));

    return this.http.get(`${this.apiUrl}/telegram/chats`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getMessages(
    chatId: number,
    before?: string,
    limit = 50,
  ): Observable<TgMessagesResponse> {
    let params = new HttpParams().set("limit", String(limit));
    if (before) params = params.set("before", before);

    return this.http.get<TgMessagesResponse>(
      `${this.apiUrl}/telegram/chats/${chatId}/messages`,
      { headers: this.getHeaders(), params },
    );
  }

  /** Name a conversation, the way saving a contact does. "" clears it. */
  renameChat(chatId: number, displayName: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/telegram/chats/${chatId}`,
      { display_name: displayName },
      { headers: this.getHeaders() },
    );
  }

  /**
   * Attach the conversation to a client account, or null to detach.
   *
   * Telegram identifies nobody: no phone, and not the contact name saved on a
   * staff member's own phone. The link is made once by hand and then holds.
   */
  linkCustomer(chatId: number, customerId: number | null): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/telegram/chats/${chatId}`,
      { customer_id: customerId },
      { headers: this.getHeaders() },
    );
  }

  /**
   * Switches the assistant off (or back on) for one chat -- for a staff
   * member's own private conversation that the business connection mirrors
   * in here too, so nothing in it is read by a model or costs a draft.
   */
  setAiDisabled(chatId: number, disabled: boolean): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/telegram/chats/${chatId}`,
      { ai_disabled: disabled },
      { headers: this.getHeaders() },
    );
  }

  /**
   * The client behind a linked chat: who they are, what they owe, and what is
   * in transit. Fetched separately from the thread so opening a chat stays
   * cheap and an unlinked one costs nothing.
   */
  /** The client this unlinked chat's tracking numbers belong to, if exactly one. */
  getLinkSuggestion(chatId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/telegram/chats/${chatId}/link-suggestion`, {
      headers: this.getHeaders(),
    });
  }

  getChatClient(chatId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/telegram/chats/${chatId}/client`, {
      headers: this.getHeaders(),
    });
  }

  /** Search clients by id, phone (username) or name. */
  searchCustomers(q: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/telegram/customers/search`, {
      headers: this.getHeaders(),
      params: new HttpParams().set("q", q),
    });
  }

  /** The pending suggestion(s) for a chat, if any were already produced. Free. */
  getDraft(chatId: number): Observable<TgDraftResponse> {
    return this.http.get<TgDraftResponse>(
      `${this.apiUrl}/telegram/chats/${chatId}/draft`,
      { headers: this.getHeaders() },
    );
  }

  /**
   * Ask for a suggestion for the newest unanswered message. Costs a model call,
   * so it is only ever triggered by a person pressing something. `message`
   * explains a null draft to staff (already in Uzbek); `reason` is the same
   * outcome in code form.
   */
  makeDraft(
    chatId: number,
  ): Observable<{
    status: string;
    draft: TgDraft | null;
    message: string | null;
    reason: string | null;
  }> {
    return this.http.post<{
      status: string;
      draft: TgDraft | null;
      message: string | null;
      reason: string | null;
    }>(`${this.apiUrl}/telegram/chats/${chatId}/draft`, {}, { headers: this.getHeaders() });
  }

  /**
   * Record what the human did. Sending edited text stores the edit, which is
   * the clearest signal of where the assistant is wrong.
   */
  decideDraft(
    draftId: string,
    action: "sent" | "dismissed",
    text?: string,
  ): Observable<{ status: string; edited?: boolean; not_chosen?: boolean }> {
    return this.http.post<{ status: string; edited?: boolean; not_chosen?: boolean }>(
      `${this.apiUrl}/telegram/drafts/${draftId}/decide`,
      { action, text },
      { headers: this.getHeaders() },
    );
  }

  // -------------------------------------------------------- knowledge base

  /**
   * Facts assistant B reads, grouped for the "Bilimlar bazasi" screen, plus a
   * summary of the handbook they compile into. `sections` carries the fixed
   * display order and Uzbek titles; a fact whose section isn't listed there
   * still comes back, to be shown under its raw id.
   */
  getKnowledgeFacts(): Observable<TgKnowledgeFactsResponse> {
    return this.http.get<TgKnowledgeFactsResponse>(
      `${this.apiUrl}/telegram/knowledge/facts`,
      { headers: this.getHeaders() },
    );
  }

  createKnowledgeFact(
    section: string,
    text: string,
  ): Observable<{ status: string; fact: TgKnowledgeFact }> {
    return this.http.post<{ status: string; fact: TgKnowledgeFact }>(
      `${this.apiUrl}/telegram/knowledge/facts`,
      { section, text },
      { headers: this.getHeaders() },
    );
  }

  /** Used for both an edit and the on/off switch -- send only the fields that changed. */
  updateKnowledgeFact(
    id: number,
    patch: { section?: string; text?: string; is_active?: boolean },
  ): Observable<{ status: string; fact: TgKnowledgeFact; unchanged?: boolean }> {
    return this.http.patch<{ status: string; fact: TgKnowledgeFact; unchanged?: boolean }>(
      `${this.apiUrl}/telegram/knowledge/facts/${id}`,
      patch,
      { headers: this.getHeaders() },
    );
  }

  getKnowledgeFactHistory(
    id: number,
  ): Observable<{ status: string; history: TgKnowledgeHistoryEntry[] }> {
    return this.http.get<{ status: string; history: TgKnowledgeHistoryEntry[] }>(
      `${this.apiUrl}/telegram/knowledge/facts/${id}/history`,
      { headers: this.getHeaders() },
    );
  }

  /** Puts the fact back to one audit entry's `after` state. */
  restoreKnowledgeFact(
    id: number,
    auditId: number,
  ): Observable<{ status: string; fact: TgKnowledgeFact; unchanged?: boolean }> {
    return this.http.post<{ status: string; fact: TgKnowledgeFact; unchanged?: boolean }>(
      `${this.apiUrl}/telegram/knowledge/facts/${id}/restore`,
      { audit_id: auditId },
      { headers: this.getHeaders() },
    );
  }

  /** The compiled text assistant B actually reads. `all` includes switched-off facts too. */
  getKnowledgeHandbook(all = false): Observable<TgKnowledgeHandbook> {
    let params = new HttpParams();
    if (all) params = params.set("all", "1");
    return this.http.get<TgKnowledgeHandbook>(
      `${this.apiUrl}/telegram/knowledge/handbook`,
      { headers: this.getHeaders(), params },
    );
  }

  /** Runs a real model call against the current handbook for one tried-out question -- costs money. */
  testKnowledge(
    text: string,
  ): Observable<{ status: string; result: TgKnowledgeTestResult }> {
    return this.http.post<{ status: string; result: TgKnowledgeTestResult }>(
      `${this.apiUrl}/telegram/knowledge/test`,
      { text },
      { headers: this.getHeaders() },
    );
  }

  // -------------------------------------------------------- learning inbox

  /** Pending/decided suggestions from the daily review of real admin replies. */
  getKnowledgeProposals(
    status: TgKnowledgeProposalStatus,
  ): Observable<TgKnowledgeProposalsResponse> {
    return this.http.get<TgKnowledgeProposalsResponse>(
      `${this.apiUrl}/telegram/knowledge/proposals`,
      { headers: this.getHeaders(), params: new HttpParams().set("status", status) },
    );
  }

  /** Approve (optionally with the owner's edited text/section) or reject one proposal. */
  decideKnowledgeProposal(
    id: number,
    action: "approve" | "reject",
    text?: string,
    section?: string,
  ): Observable<TgKnowledgeProposalDecideResult> {
    const body: { action: string; text?: string; section?: string } = { action };
    if (text != null) body.text = text;
    if (section != null) body.section = section;
    return this.http.post<TgKnowledgeProposalDecideResult>(
      `${this.apiUrl}/telegram/knowledge/proposals/${id}/decide`,
      body,
      { headers: this.getHeaders() },
    );
  }

  /** Approved tone examples the owner curates for assistant B. */
  getKnowledgeStyles(): Observable<TgKnowledgeStylesResponse> {
    return this.http.get<TgKnowledgeStylesResponse>(
      `${this.apiUrl}/telegram/knowledge/styles`,
      { headers: this.getHeaders() },
    );
  }

  updateKnowledgeStyle(
    id: number,
    isActive: boolean,
  ): Observable<{ style: TgKnowledgeStyle }> {
    return this.http.patch<{ style: TgKnowledgeStyle }>(
      `${this.apiUrl}/telegram/knowledge/styles/${id}`,
      { is_active: isActive },
      { headers: this.getHeaders() },
    );
  }

  // ------------------------------------------------------------ analytics

  /**
   * What the Telegram AI assistants cost over the last `days` (1-90, default
   * 30): reading/writing/thinking tokens and dollars, per day and per
   * feature, plus today's calls against the daily limit. 503 before the
   * usage-logging migration has run.
   */
  getAiUsage(days = 30): Observable<TgAiUsageResponse> {
    return this.http.get<TgAiUsageResponse>(
      `${this.apiUrl}/telegram/analytics/ai-usage`,
      { headers: this.getHeaders(), params: new HttpParams().set("days", String(days)) },
    );
  }

  // -------------------------------------------------------- auto-reply settings

  /** Current automatic-reply mode/limit, today's usage against it, and the
   * audit trail of who changed what. */
  getAutoReplySettings(): Observable<TgAutoReplySettings> {
    return this.http.get<TgAutoReplySettings>(
      `${this.apiUrl}/telegram/settings/auto-reply`,
      { headers: this.getHeaders() },
    );
  }

  /** Send only the field that changed -- a mode switch and a limit save are
   * two different actions in the UI, never combined into one request. */
  updateAutoReplySettings(
    patch: { mode?: TgAutoReplyMode; daily_limit?: number },
  ): Observable<TgAutoReplySettings> {
    return this.http.patch<TgAutoReplySettings>(
      `${this.apiUrl}/telegram/settings/auto-reply`,
      patch,
      { headers: this.getHeaders() },
    );
  }

  markRead(chatId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/telegram/chats/${chatId}/read`,
      {},
      { headers: this.getHeaders() },
    );
  }

  sendMessage(chatId: number, text: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/telegram/chats/${chatId}/messages`,
      { text },
      { headers: this.getHeaders() },
    );
  }

  /** The API returns media paths already carrying their token. */
  absoluteUrl(url: string | null): string | null {
    return url ? `${this.apiUrl}${url}` : null;
  }

  /**
   * Live updates. EventSource fires outside Angular's zone, so the callback is
   * put back inside it or the view will not update until something else
   * happens to trigger change detection.
   */
  openStream(
    mediaToken: string,
    onMessage: (payload: any) => void,
    onDraft?: (payload: any) => void,
    connection?: { onReconnect?: () => void; onClosed?: () => void },
  ): EventSource {
    const source = new EventSource(
      `${this.apiUrl}/telegram/stream?t=${encodeURIComponent(mediaToken)}`,
    );
    // A dropped connection (server restart, network blip) is retried by the
    // browser itself; whatever arrived meanwhile was missed, so the page is
    // told to catch up once it is back. A refused one (expired token) is
    // never retried -- the page has to open a new stream.
    let dropped = false;
    source.addEventListener("error", () => {
      dropped = true;
      if (source.readyState === EventSource.CLOSED && connection?.onClosed) {
        this.zone.run(() => connection.onClosed!());
      }
    });
    source.addEventListener("open", () => {
      if (!dropped) return;
      dropped = false;
      if (connection?.onReconnect) this.zone.run(() => connection.onReconnect!());
    });
    source.addEventListener("message", (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        this.zone.run(() => onMessage(payload));
      } catch (e) {
        /* a malformed frame is not worth breaking the stream over */
      }
    });
    // A suggestion made while the chat is open: automatic drafts land a
    // minute after the client stops typing, when staff may be looking.
    if (onDraft) {
      source.addEventListener("draft", (event: any) => {
        try {
          const payload = JSON.parse(event.data);
          this.zone.run(() => onDraft(payload));
        } catch (e) {
          /* as above */
        }
      });
    }
    return source;
  }
}
