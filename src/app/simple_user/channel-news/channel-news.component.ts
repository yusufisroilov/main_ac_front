import { Component, OnInit, OnDestroy } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-customer-news",
  templateUrl: "./channel-news.component.html",
  styleUrls: ["./channel-news.component.css"],
})
export class CustomerChannelNewsComponent implements OnInit, OnDestroy {
  posts: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  unreadCount = 0;

  private observer: IntersectionObserver | null = null;
  private pollInterval: any = null;
  private lastTotalItems = 0;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.loadPosts();
    this.setupIntersectionObserver();
    this.startPolling();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private startPolling() {
    this.pollInterval = setInterval(() => {
      this.checkForNewPosts();
    }, 30000); // every 30 seconds
  }

  private checkForNewPosts() {
    this.http.get<any>(
      `${GlobalVars.baseUrl}/channel-posts?page=0&size=1`,
      { headers: this.getHeaders() },
    ).subscribe((data) => {
      const newTotal = data.totalItems || 0;
      if (newTotal > this.lastTotalItems && this.lastTotalItems > 0) {
        this.loadPosts(); // reload if new posts appeared
      }
      this.lastTotalItems = newTotal;
    });
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = (entry.target as HTMLElement).dataset["postId"];
            const post = this.posts.find((p) => String(p.id) === postId);
            if (post && !post.is_read) {
              this.markAsRead(post);
            }
          }
        });
      },
      { threshold: 0.5 },
    );
  }

  private observePosts() {
    setTimeout(() => {
      document.querySelectorAll(".cn-post[data-post-id]").forEach((el) => {
        this.observer?.observe(el);
      });
    }, 100);
  }

  loadPosts() {
    this.loading = true;
    const url = `${GlobalVars.baseUrl}/channel-posts?page=${this.currentPage}&size=${this.pageSize}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.posts = data.posts || [];
        this.totalItems = data.totalItems || 0;
        this.lastTotalItems = this.totalItems;
        this.totalPages = data.totalPages || 0;
        this.currentPage = data.currentPage || 0;
        this.loading = false;
        this.unreadCount = this.posts.filter((p) => !p.is_read).length;
        this.observePosts();
      },
      (error) => {
        this.loading = false;
        if (error.status === 403) this.authService.logout();
      },
    );
  }

  markAsRead(post: any) {
    if (post.is_read) return;
    post.is_read = true;
    this.unreadCount = this.posts.filter((p) => !p.is_read).length;

    this.http
      .post<any>(`${GlobalVars.baseUrl}/channel-posts/${post.id}/read`, {}, { headers: this.getHeaders() })
      .subscribe();
  }

  markAllRead() {
    this.http
      .post<any>(`${GlobalVars.baseUrl}/channel-posts/read-all`, {}, { headers: this.getHeaders() })
      .subscribe(() => {
        this.posts.forEach((p) => (p.is_read = true));
        this.unreadCount = 0;
      });
  }

  onPageChanged(page: number) {
    this.currentPage = page;
    this.loadPosts();
  }

  getMediaUrl(path: string): string {
    if (!path) return "";
    return GlobalVars.baseUrl + path;
  }

  linkify(text: string): string {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(
      /(\S[^(\n]*?)\s*\(((https?:\/\/[^\s\)]+))\)/g,
      '<a href="$2" target="_blank" class="cn-link">$1</a>',
    );
    html = html.replace(
      /(?<!href="|">)(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" class="cn-link">$1</a>',
    );
    html = html.replace(
      /(?<![\w\/])@(\w{5,})/g,
      '<a href="https://t.me/$1" target="_blank" class="cn-link">@$1</a>',
    );
    html = html.replace(/(\+998[\d\s]{9,12})/g, '<a href="tel:$1" class="cn-link">$1</a>');
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year}  ${hours}:${mins}`;
  }
}
