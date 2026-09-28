import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import {
  TelegramChatService,
  TgChat,
  TgMessage,
  TgEntity,
  TgSegment,
} from "../../services/telegram-chat.service";
import { showBackendError } from "../../shared/backend-error";
import swal from "sweetalert2";

@Component({
  selector: "app-telegram-chats",
  templateUrl: "./telegram-chats.component.html",
  styleUrls: ["./telegram-chats.component.css"],
})
export class TelegramChatsComponent implements OnInit, OnDestroy {
  @ViewChild("thread") threadRef!: ElementRef<HTMLDivElement>;
  @ViewChild("composer") composerRef?: ElementRef<HTMLTextAreaElement>;

  chats: TgChat[] = [];
  chatsLoading = false;
  search = "";
  private searchChanged = new Subject<string>();

  openChat: TgChat | null = null;
  messages: TgMessage[] = [];
  messagesLoading = false;
  loadingOlder = false;
  hasMore = false;
  mediaToken = "";

  draft = "";
  sending = false;

  lightboxUrl: string | null = null;

  private stream: EventSource | null = null;
  // Set while older messages are being prepended, so the scroll handler does
  // not fire again for the same top edge and request the same page twice.
  private anchorScroll = false;

  /** A chat another page asked to open, via ?chat=<id>. */
  private linkedChatId: number | null = null;

  constructor(
    private chatService: TelegramChatService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const linked = Number(this.route.snapshot.queryParamMap.get("chat"));
    this.linkedChatId = Number.isInteger(linked) && linked > 0 ? linked : null;
    this.loadChats();

    this.searchChanged
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadChats());

    this.clientQueryChanged
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((q) => this.searchClients(q));
  }

  ngOnDestroy(): void {
    this.closeStream();
  }

  // ------------------------------------------------------------------ chats

  loadChats(): void {
    this.chatsLoading = true;
    this.chatService.listChats({ search: this.search, limit: 100 }).subscribe({
      next: (res: any) => {
        this.chats = res.chats || [];
        this.chatsLoading = false;
        this.openLinkedChat();
      },
      error: (err) => {
        this.chatsLoading = false;
        showBackendError(err);
      },
    });
  }

  /**
   * Opens the chat named in the link, once. It may be older than the first
   * hundred in the list, so it is fetched on its own when not already there.
   */
  private openLinkedChat(): void {
    const id = this.linkedChatId;
    if (!id) return;
    this.linkedChatId = null;

    const listed = this.chats.find((c) => c.id === id);
    if (listed) {
      this.selectChat(listed);
      return;
    }
    this.chatService.listChats({ id }).subscribe({
      next: (res: any) => {
        const chat = (res.chats || [])[0];
        if (!chat) return;
        this.chats = [chat, ...this.chats];
        this.selectChat(chat);
      },
      error: (err) => showBackendError(err),
    });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.searchChanged.next(value);
  }

  selectChat(chat: TgChat): void {
    if (this.openChat?.id === chat.id) return;

    this.openChat = chat;
    this.messages = [];
    this.hasMore = false;
    this.draft = "";
    this.renaming = false;
    this.cancelLinking();
    this.client = null;
    this.parcels = [];
    this.suggestion = null;
    this.linkHint = null;
    if (this.clientPanelOpen) this.loadClient();
    this.loadSuggestion(chat.id);
    this.loadLinkHint(chat);
    this.loadMessages();

    if (chat.unread_count > 0) {
      this.chatService.markRead(chat.id).subscribe({
        next: () => (chat.unread_count = 0),
        error: () => {
          /* a stale badge is not worth interrupting the user for */
        },
      });
    }
  }

  // --------------------------------------------------------------- messages

  private loadMessages(): void {
    if (!this.openChat) return;
    this.messagesLoading = true;

    this.chatService.getMessages(this.openChat.id).subscribe({
      next: (res) => {
        // The API returns newest first; the thread reads oldest at the top.
        this.messages = this.decorate((res.messages || []).slice().reverse());
        this.hasMore = res.has_more;
        this.mediaToken = res.media_token;
        this.openChat = res.chat;
        this.messagesLoading = false;
        this.openStream();
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err) => {
        this.messagesLoading = false;
        showBackendError(err);
      },
    });
  }

  loadOlder(): void {
    if (!this.openChat || !this.hasMore || this.loadingOlder) return;
    const oldest = this.messages[0];
    if (!oldest) return;

    this.loadingOlder = true;
    const el = this.threadRef?.nativeElement;
    const previousHeight = el ? el.scrollHeight : 0;

    this.chatService.getMessages(this.openChat.id, oldest.id).subscribe({
      next: (res) => {
        const older = this.decorate((res.messages || []).slice().reverse());
        this.messages = [...older, ...this.messages];
        this.hasMore = res.has_more;
        this.loadingOlder = false;

        // Keep the reader where they were. Without this the view jumps to the
        // top every time a page is prepended and scrolling back is impossible.
        this.anchorScroll = true;
        setTimeout(() => {
          if (el) el.scrollTop = el.scrollHeight - previousHeight;
          this.anchorScroll = false;
        }, 0);
      },
      error: (err) => {
        this.loadingOlder = false;
        showBackendError(err);
      },
    });
  }

  onThreadScroll(): void {
    const el = this.threadRef?.nativeElement;
    if (!el || this.anchorScroll) return;
    if (el.scrollTop < 120) this.loadOlder();
  }

  private scrollToBottom(): void {
    const el = this.threadRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ----------------------------------------------------------------- stream

  private openStream(): void {
    this.closeStream();
    if (!this.mediaToken) return;

    this.stream = this.chatService.openStream(this.mediaToken, (payload) => {
      // The chat list reorders and re-counts on any traffic.
      this.loadChats();

      if (!this.openChat || payload.chat_id !== this.openChat.id) return;
      // A tracking number just sent may say whose chat this is.
      if (!this.openChat.customer) this.loadLinkHint(this.openChat);

      // Refetch the newest page rather than trusting the event's contents:
      // it carries only ids, and an edit or a deletion changes a message that
      // is already on screen.
      this.chatService.getMessages(this.openChat.id).subscribe({
        next: (res) => {
          const atBottom = this.isNearBottom();
          const merged = this.decorate((res.messages || []).slice().reverse());
          const known = new Set(this.messages.map((m) => m.id));
          const fresh = merged.filter((m) => !known.has(m.id));
          if (fresh.length) this.messages = [...this.messages, ...fresh];
          this.mediaToken = res.media_token;
          // Only follow the conversation when the reader is already at the
          // bottom; yanking them down while they read history is worse than
          // a missed message.
          if (atBottom) setTimeout(() => this.scrollToBottom(), 0);
        },
        error: () => {
          /* the next event will try again */
        },
      });
    }, (payload) => {
      // The automatic draft for the open chat, shown as it is made -- before,
      // it appeared only when the chat was opened again.
      if (this.openChat && payload.chat_id === this.openChat.id) {
        this.loadSuggestion(this.openChat.id);
      }
    });
  }

  private isNearBottom(): boolean {
    const el = this.threadRef?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }

  private closeStream(): void {
    if (this.stream) {
      this.stream.close();
      this.stream = null;
    }
  }

  // ------------------------------------------------------------------- send

  get canReply(): boolean {
    return !!this.openChat?.account?.can_reply;
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || !this.openChat || this.sending) return;

    this.sending = true;
    this.chatService.sendMessage(this.openChat.id, text).subscribe({
      next: () => {
        this.draft = "";
        this.sending = false;
        this.loadMessagesTail();
      },
      error: (err) => {
        this.sending = false;
        showBackendError(err);
      },
    });
  }

  private loadMessagesTail(): void {
    if (!this.openChat) return;
    this.chatService.getMessages(this.openChat.id).subscribe({
      next: (res) => {
        const merged = this.decorate((res.messages || []).slice().reverse());
        const known = new Set(this.messages.map((m) => m.id));
        const fresh = merged.filter((m) => !known.has(m.id));
        if (fresh.length) this.messages = [...this.messages, ...fresh];
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: () => {},
    });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    // Enter sends, Shift+Enter breaks the line — what Telegram does.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  // ---------------------------------------------------------------- display

  mediaUrl(url: string | null): string | null {
    return this.chatService.absoluteUrl(url);
  }

  initials(chat: TgChat): string {
    return (chat.name || "?").trim().charAt(0).toUpperCase();
  }

  /** Stable colour per chat, so avatars are distinguishable at a glance. */
  avatarColor(chat: TgChat): string {
    const palette = [
      "#e17076", "#7bc862", "#65aadd", "#a695e7",
      "#ee7aae", "#6ec9cb", "#faa774", "#8d8d8d",
    ];
    return palette[Number(chat.tg_chat_id) % palette.length] || palette[0];
  }

  /**
   * Everything is shown in Tashkent time, not the browser's.
   *
   * The business is in one country, and staff comparing the panel against their
   * own Telegram need the two to agree regardless of how a laptop is
   * configured. Uzbekistan has no daylight saving, so a fixed +0500 is exact
   * rather than an approximation.
   */
  readonly tz = "+0500";

  /** The calendar date of an instant in Tashkent, independent of the browser. */
  private tashkentDay(value: string): string {
    const shifted = new Date(new Date(value).getTime() + 5 * 3600 * 1000);
    return shifted.toISOString().slice(0, 10);
  }

  /** Date separator between days, the way Telegram breaks a thread up. */
  showDateSeparator(index: number): boolean {
    if (index === 0) return true;
    return (
      this.tashkentDay(this.messages[index - 1].tg_date) !==
      this.tashkentDay(this.messages[index].tg_date)
    );
  }

  /** "Bugun" / "Kecha" read faster than a date on the messages that matter. */
  dayLabel(value: string): string {
    const day = this.tashkentDay(value);
    const today = this.tashkentDay(new Date().toISOString());
    const yesterday = this.tashkentDay(
      new Date(Date.now() - 86400000).toISOString(),
    );
    if (day === today) return "Bugun";
    if (day === yesterday) return "Kecha";
    return "";
  }

  /**
   * Consecutive messages from the same side within a few minutes are one
   * visual block: only the last keeps a tail and a timestamp, the way Telegram
   * collapses a burst of replies instead of stacking identical bubbles.
   */
  private sameGroup(a: TgMessage | undefined, b: TgMessage | undefined): boolean {
    if (!a || !b) return false;
    if (a.direction !== b.direction) return false;
    const gap = Math.abs(
      new Date(b.tg_date).getTime() - new Date(a.tg_date).getTime(),
    );
    return gap < 5 * 60 * 1000;
  }

  isGroupStart(index: number): boolean {
    if (this.showDateSeparator(index)) return true;
    return !this.sameGroup(this.messages[index - 1], this.messages[index]);
  }

  isGroupEnd(index: number): boolean {
    if (index === this.messages.length - 1) return true;
    if (this.showDateSeparator(index + 1)) return true;
    return !this.sameGroup(this.messages[index], this.messages[index + 1]);
  }

  formatSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  /** Why a file has no bytes, in words rather than a status code. */
  mediaNote(message: TgMessage): string {
    const media = message.media;
    if (!media || media.status === "done") return "";
    if (media.skip_reason === "video_excluded") return "Video saqlanmaydi";
    if (media.skip_reason === "over_20mb")
      return "20 MB dan katta — Telegramda oching";
    if (media.status === "failed") return "Yuklab olinmadi";
    return "Yuklanmoqda…";
  }

  // --------------------------------------------------------------- renaming

  renaming = false;
  renameDraft = "";

  /**
   * Naming a conversation, like saving a contact. Telegram sends whatever the
   * other person calls themselves, which for a cargo client is often a nickname
   * or a first name shared with nine others.
   */
  startRename(): void {
    if (!this.openChat) return;
    this.renameDraft = this.openChat.display_name || this.openChat.name || "";
    this.renaming = true;
  }

  cancelRename(): void {
    this.renaming = false;
    this.renameDraft = "";
  }

  saveRename(): void {
    if (!this.openChat) return;
    const value = this.renameDraft.trim();
    const chatId = this.openChat.id;

    this.chatService.renameChat(chatId, value).subscribe({
      next: () => {
        this.renaming = false;
        // Re-read rather than patching locally: clearing the name falls back to
        // the linked client and then to Telegram, and that order lives on the
        // server. Guessing it here would drift.
        this.loadChats();
        this.refreshOpenChat(chatId);
      },
      error: (err) => showBackendError(err),
    });
  }

  onRenameKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.saveRename();
    } else if (event.key === "Escape") {
      this.cancelRename();
    }
  }

  // ----------------------------------------------------------- client link

  linking = false;
  clientQuery = "";
  clientResults: any[] = [];
  clientSearching = false;
  private clientQueryChanged = new Subject<string>();

  /**
   * Telegram identifies nobody. It sends the other person's own profile name
   * and nothing else -- no phone, and not the contact name saved on a staff
   * member's phone. So which client this is has to be stated once, by someone
   * who knows, and after that it holds.
   */
  startLinking(): void {
    this.linking = true;
    this.clientQuery = "";
    this.clientResults = [];
  }

  cancelLinking(): void {
    this.linking = false;
    this.clientQuery = "";
    this.clientResults = [];
  }

  onClientQueryChange(value: string): void {
    this.clientQuery = value;
    this.clientQueryChanged.next(value);
  }

  private searchClients(q: string): void {
    if (!q.trim()) {
      this.clientResults = [];
      return;
    }
    this.clientSearching = true;
    this.chatService.searchCustomers(q).subscribe({
      next: (res: any) => {
        this.clientResults = res.customers || [];
        this.clientSearching = false;
      },
      error: () => (this.clientSearching = false),
    });
  }

  /**
   * "Bu yuk K10550 ga tegishli — biriktirasizmi?" The server finds the one
   * client this unlinked chat's tracking numbers belong to; linking stays a
   * person's click, since a shared or mistyped number could point elsewhere.
   */
  linkHint: { customer_id: number; code: string; name: string } | null = null;

  private loadLinkHint(chat: TgChat): void {
    if ((chat as any).customer) return;
    this.chatService.getLinkSuggestion(chat.id).subscribe({
      next: (res: any) => {
        const s = res.suggestion;
        if (this.openChat?.id !== chat.id) return;
        this.linkHint = s && !this.hintDismissed(chat.id, s.customer_id) ? s : null;
      },
      error: () => (this.linkHint = null),
    });
  }

  acceptLinkHint(): void {
    if (!this.linkHint) return;
    const customerId = this.linkHint.customer_id;
    this.linkHint = null;
    this.linkClient(customerId);
  }

  /** "No" is remembered per chat and client in this browser, so it is not asked again. */
  dismissLinkHint(): void {
    if (!this.linkHint || !this.openChat) return;
    try {
      localStorage.setItem(`tg-link-hint-no:${this.openChat.id}:${this.linkHint.customer_id}`, "1");
    } catch (e) {
      /* storage unavailable: it will simply be asked again */
    }
    this.linkHint = null;
  }

  private hintDismissed(chatId: number, customerId: number): boolean {
    try {
      return localStorage.getItem(`tg-link-hint-no:${chatId}:${customerId}`) === "1";
    } catch (e) {
      return false;
    }
  }

  linkClient(customerId: number | null): void {
    if (!this.openChat) return;
    const chatId = this.openChat.id;

    this.chatService.linkCustomer(chatId, customerId).subscribe({
      next: () => {
        this.cancelLinking();
        this.refreshOpenChat(chatId);
        this.loadChats();
        this.client = null;
        this.parcels = [];
        // Open the panel on a successful link: having just said who this is,
        // their balance and parcels are what someone wants to see next.
        this.clientPanelOpen = customerId !== null;
        if (this.clientPanelOpen) this.loadClient();
      },
      error: (err) => showBackendError(err),
    });
  }

  // ------------------------------------------------------------- assistant

  suggestion: any = null;
  suggestionLoading = false;

  /**
   * A suggestion is never sent on its own. The assistant chooses which approved
   * answer fits; a person decides whether it goes out, and may rewrite it first.
   */
  private loadSuggestion(chatId: number): void {
    this.chatService.getDraft(chatId).subscribe({
      next: (res: any) => {
        if (this.openChat?.id === chatId) this.suggestion = res.draft;
      },
      error: () => (this.suggestion = null),
    });
  }

  requestSuggestion(): void {
    if (!this.openChat || this.suggestionLoading) return;
    const chatId = this.openChat.id;
    this.suggestionLoading = true;

    this.chatService.makeDraft(chatId).subscribe({
      next: (res: any) => {
        this.suggestionLoading = false;
        if (this.openChat?.id !== chatId) return;
        this.suggestion = res.draft;
        // No suggestion is a normal outcome, not a failure -- a thank-you
        // needing no reply, an answer already sent -- so it is said as
        // information. The error popup made "no reply needed" look broken.
        if (!res.draft && res.message) {
          swal.fire({ icon: "info", title: "Taklif", text: res.message });
        }
      },
      error: (err) => {
        this.suggestionLoading = false;
        showBackendError(err);
      },
    });
  }

  /** Open the suggestion for editing before it goes out. */
  editSuggestion(): void {
    if (!this.suggestion) return;
    this.suggestion.editing = true;
    this.suggestion.editText = this.suggestion.suggested_text;
  }

  sendSuggestion(): void {
    if (!this.suggestion || !this.openChat) return;
    const text = (
      this.suggestion.editText ||
      this.suggestion.suggested_text ||
      ""
    ).trim();
    if (!text) return;

    const draftId = this.suggestion.id;
    const chatId = this.openChat.id;
    this.sending = true;

    this.chatService.sendMessage(chatId, text).subscribe({
      next: () => {
        this.sending = false;
        // A suggestion without an id cannot be recorded; asking anyway sent
        // "id = NaN" to the server. The backend now always returns one.
        if (draftId) {
          this.chatService.decideDraft(draftId, "sent", text).subscribe({
            next: () => {},
            error: () => {},
          });
        }
        this.suggestion = null;
        this.loadMessagesTail();
      },
      error: (err) => {
        this.sending = false;
        showBackendError(err);
      },
    });
  }

  /** A reply is owed and no approved answer exists: staff write it. */
  get needsAnswer(): boolean {
    return this.suggestion?.kind === "needs_answer";
  }

  /** Straight to the message box, for a reply no template covers. */
  writeAnswer(): void {
    this.composerRef?.nativeElement.focus();
  }

  /**
   * Hides the "needs an answer" notice without recording a verdict: it is not
   * a suggestion staff can reject. It expires on its own once staff reply.
   */
  hideNotice(): void {
    this.suggestion = null;
  }

  dismissSuggestion(): void {
    if (!this.suggestion) return;
    const draftId = this.suggestion.id;
    this.suggestion = null;
    if (!draftId) return;
    this.chatService.decideDraft(draftId, "dismissed").subscribe({
      next: () => {},
      error: () => {},
    });
  }

  // ---------------------------------------------------------- client panel

  clientPanelOpen = false;
  client: any = null;
  parcels: any[] = [];
  clientLoading = false;

  toggleClientPanel(): void {
    this.clientPanelOpen = !this.clientPanelOpen;
    if (this.clientPanelOpen) this.loadClient();
  }

  private loadClient(): void {
    if (!this.openChat) return;
    const chatId = this.openChat.id;
    this.clientLoading = true;

    this.chatService.getChatClient(chatId).subscribe({
      next: (res: any) => {
        if (this.openChat?.id !== chatId) return; // they moved on
        this.client = res.client;
        this.parcels = res.parcels || [];
        this.clientLoading = false;
      },
      error: () => (this.clientLoading = false),
    });
  }

  /** Through to the full client page, preselected. */
  clientPageLink(): any[] {
    return ["/uzm/infoeachclientv2"];
  }

  /** Re-read the chat so the server's name resolution is what gets shown. */
  private refreshOpenChat(chatId: number): void {
    this.chatService.getMessages(chatId, undefined, 1).subscribe({
      next: (res) => {
        if (this.openChat?.id === chatId) this.openChat = res.chat;
      },
      error: () => {},
    });
  }

  clientName(c: any): string {
    return [c?.first_name, c?.last_name].filter(Boolean).join(" ") || "—";
  }

  openLightbox(url: string | null): void {
    if (url) this.lightboxUrl = url;
  }

  closeLightbox(): void {
    this.lightboxUrl = null;
  }

  /**
   * Turn a message into runs of text with their formatting.
   *
   * Deliberately NOT built as an HTML string. Doing that needs
   * bypassSecurityTrustHtml, which turns off exactly the protection that
   * matters here: the text comes from whoever messaged the staff member. As
   * plain segments the template renders text through ordinary interpolation and
   * hrefs through [href], so Angular escapes and sanitises both itself.
   *
   * Offsets are UTF-16 code units, which is how JavaScript indexes a string, so
   * they are used directly. Overlapping entities are skipped rather than
   * nested: Telegram rarely sends them and a wrong nesting renders worse than
   * no formatting.
   */
  private buildSegments(message: TgMessage): TgSegment[] {
    const text = message.text || "";
    if (!text) return [];

    const entities = (message.entities || [])
      .slice()
      .sort((a, b) => a.offset - b.offset);

    const segments: TgSegment[] = [];
    let cursor = 0;

    for (const entity of entities) {
      if (entity.offset < cursor) continue; // overlaps what was already emitted
      if (entity.offset > text.length) break;

      if (entity.offset > cursor) {
        segments.push({ text: text.slice(cursor, entity.offset), kind: "text" });
      }
      const inner = text.slice(entity.offset, entity.offset + entity.length);
      segments.push(this.segmentFor(entity, inner));
      cursor = entity.offset + entity.length;
    }

    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), kind: "text" });
    }
    return segments;
  }

  private segmentFor(entity: TgEntity, inner: string): TgSegment {
    switch (entity.type) {
      case "bold":
        return { text: inner, kind: "bold" };
      case "italic":
        return { text: inner, kind: "italic" };
      case "underline":
        return { text: inner, kind: "underline" };
      case "strikethrough":
        return { text: inner, kind: "strike" };
      case "code":
        return { text: inner, kind: "code" };
      case "pre":
        return { text: inner, kind: "pre" };
      case "spoiler":
        return { text: inner, kind: "spoiler" };
      // A url entity's href is the message text itself, and a text_link's is
      // supplied separately. Both go through the same check -- giving them
      // different rules is how one of them ends up unvalidated.
      case "url":
        return this.linkSegment(inner, inner);
      case "text_link":
        return this.linkSegment(entity.url || "", inner);
      case "email":
        return { text: inner, kind: "text" };
      default:
        return { text: inner, kind: "text" };
    }
  }

  /**
   * Only http(s) becomes a link. Anything else -- javascript:, data:, a bare
   * scheme Telegram happened to detect -- renders as plain text.
   */
  private linkSegment(url: string, inner: string): TgSegment {
    const clean = (url || "").trim();
    if (!/^https?:\/\//i.test(clean)) return { text: inner, kind: "text" };
    return { text: inner, kind: "link", href: clean };
  }

  /** Computed once per message, not on every change-detection pass. */
  private decorate(messages: TgMessage[]): TgMessage[] {
    for (const message of messages) {
      if (!message.segments) message.segments = this.buildSegments(message);
    }
    return messages;
  }

  trackChat(_: number, chat: TgChat): number {
    return chat.id;
  }

  trackMessage(_: number, message: TgMessage): string {
    return message.id;
  }
}
