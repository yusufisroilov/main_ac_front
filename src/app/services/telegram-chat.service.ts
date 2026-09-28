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

  /** The pending suggestion for a chat, if one was already produced. Free. */
  getDraft(chatId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/telegram/chats/${chatId}/draft`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Ask for a suggestion for the newest unanswered message. Costs a model call,
   * so it is only ever triggered by a person pressing something.
   */
  makeDraft(chatId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/telegram/chats/${chatId}/draft`,
      {},
      { headers: this.getHeaders() },
    );
  }

  /**
   * Record what the human did. Sending edited text stores the edit, which is
   * the clearest signal of where the assistant is wrong.
   */
  decideDraft(draftId: string, action: "sent" | "dismissed", text?: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/telegram/drafts/${draftId}/decide`,
      { action, text },
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
