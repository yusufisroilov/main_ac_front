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
 * A pending suggestion for the open chat's newest unanswered message, from
 * either assistant. `variant` tells the two apart; B additionally carries how
 * it got there. Never sent on its own -- a person decides.
 */
export interface TgDraft {
  id: string;
  variant: "A" | "B";
  message_id: string;
  kind: string;
  suggested_text: string;
  confidence: string;
  match_reason: string | null;
  requires_human: boolean;
  created_at: string;
  category: string | null;
  never_auto_send: boolean | null;
  cost_usd?: string | number | null;
  trace?: TgDraftTraceStep[] | null;
  /** Filled in by the component once, rather than on every change detection. */
  traceLines?: string[];
  /** UI-only: whether the composer holds this draft's edited text. */
  editing?: boolean;
  editText?: string;
  /** UI-only: whether B's "Qanday tayyorlandi?" panel is expanded. */
  traceOpen?: boolean;
  /** UI-only: the text B generated but did not send, when a decision step blocked it. */
  blockedText?: string | null;
}

export interface TgDraftResponse {
  status: string;
  /** Assistant A's pending draft, or null when there is none. */
  draft: TgDraft | null;
  /** Assistant B's pending draft. Present only when B is enabled at all. */
  draft_b: TgDraft | null;
  /** Whether B's card should be shown to staff at all. */
  b_mode: "off" | "shadow" | "cards";
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

// ------------------------------------------------------------ assistant comparison (plan B)

/** How many of a variant's decided drafts ended in each outcome. */
export interface TgAssistantStatusCounts {
  sent: number;
  edited: number;
  dismissed: number;
  not_chosen: number;
  expired: number;
  pending: number;
  shadow: number;
}

/**
 * One assistant's numbers over the compared window: how its drafts were
 * decided, the plan's B-vs-A measure (`unchanged_or_light_pct`, staff-seen
 * drafts only) and the same measure taken silently against what staff wrote
 * back on their own (`shadow_*`, for while B ran unseen), plus speed,
 * fact-check blocks and cost.
 */
export interface TgAssistantSummary {
  drafts: number;
  replies: number;
  notices: number;
  status: TgAssistantStatusCounts;
  unchanged_or_light_pct: number | null;
  decided: number;
  median_edit_similarity: number | null;
  shadow_compared: number;
  shadow_light_pct: number | null;
  shadow_median_similarity: number | null;
  median_draft_seconds: number | null;
  blocked: number;
  /** A blocked text sent anyway -- staff can only do this by typing it themselves. */
  sent_after_block: number;
  no_reply: number;
  no_reply_overridden: number;
  cost_usd: number | null;
  cost_per_draft_usd: number | null;
}

export interface TgAssistantComparisonSummary {
  A: TgAssistantSummary;
  B: TgAssistantSummary;
  /** B minus A, in percentage points; null when either side has nothing decided. */
  difference_points: number | null;
  /** The similarity that counts as "unchanged or lightly edited" (0.8). */
  light_threshold: number;
}

export type TgAssistantBKind = "b_reply" | "b_ask" | "b_handover" | "b_blocked" | "b_no_reply";
export type TgAssistantDraftStatus =
  | "pending"
  | "sent"
  | "edited"
  | "dismissed"
  | "not_chosen"
  | "expired"
  | "shadow";

export interface TgAssistantExampleB {
  kind: TgAssistantBKind;
  status: TgAssistantDraftStatus;
  text: string | null;
  cost_usd: number | string | null;
}

/** A's kinds/statuses are its own (faq, needs_answer, ...) -- not the fixed B set above. */
export interface TgAssistantExampleA {
  kind: string;
  status: string;
  text: string | null;
}

/** One message where B drafted, A's draft for the same message beside it (if
 * any), and what staff actually sent -- newest first, up to 40. */
export interface TgAssistantExample {
  at: string;
  chat_name: string;
  client_text: string | null;
  b: TgAssistantExampleB;
  a: TgAssistantExampleA | null;
  staff_text: string | null;
  b_similarity: number | null;
  a_similarity: number | null;
}

export interface TgAssistantComparisonResponse {
  status: string;
  days: number;
  summary: TgAssistantComparisonSummary;
  examples: TgAssistantExample[];
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
   * so it is only ever triggered by a person pressing something. Always
   * produces assistant A's draft only.
   */
  makeDraft(
    chatId: number,
  ): Observable<{ status: string; draft: TgDraft | null; message?: string }> {
    return this.http.post<{ status: string; draft: TgDraft | null; message?: string }>(
      `${this.apiUrl}/telegram/chats/${chatId}/draft`,
      {},
      { headers: this.getHeaders() },
    );
  }

  /**
   * Record what the human did. Sending edited text stores the edit, which is
   * the clearest signal of where the assistant is wrong. Sending one variant
   * closes the other's pending draft for the same message on the server.
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
   * Assistant A vs B over the last `days` (1-60, default 7): the plan's
   * success measure and the latest examples side by side, for the owner's
   * one-week side-by-side test.
   */
  getAssistantComparison(days = 7): Observable<TgAssistantComparisonResponse> {
    return this.http.get<TgAssistantComparisonResponse>(
      `${this.apiUrl}/telegram/analytics/assistants`,
      { headers: this.getHeaders(), params: new HttpParams().set("days", String(days)) },
    );
  }

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
  ): EventSource {
    const source = new EventSource(
      `${this.apiUrl}/telegram/stream?t=${encodeURIComponent(mediaToken)}`,
    );
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
