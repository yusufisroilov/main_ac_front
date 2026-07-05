import { AfterViewInit, Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import swal from "sweetalert2";
import { GlobalVars } from "src/app/global-vars";
import { Router } from "@angular/router";
import { AuthService } from "src/app/pages/login/auth.service";

interface ScanRow {
  id: number;
  customer_id: number | null;
  tracking_number: string;
  service_name: string;
  service_name_uz: string;
  scan_time: string | null; // ISO UTC string from backend
  scan_date: Date | null; // parsed local Date for formatting/grouping
  matched: boolean;
}

interface Group {
  key: string;
  label: string;      // Today / Yesterday / weekday / short date
  dateLabel: string;  // · MMM d, yyyy
  rows: ScanRow[];
}

type FilterKind = "all" | "matched" | "unknown";

@Component({
  selector: "app-express-scan",
  templateUrl: "./express-scan.component.html",
  styleUrls: ["./express-scan.component.css"],
})
export class ExpressScanComponent implements OnInit, AfterViewInit {
  allData: ScanRow[] = [];
  filteredGroups: Group[] = [];
  totalCount = 0;
  currentPage = 0;
  totalPages = 1;
  pageSize = 100;

  searchQuery = "";
  activeFilter: FilterKind = "all";

  private searchDebounce: any = null;

  hideForManager = true;

  constructor(
    public authService: AuthService,
    private httpClient: HttpClient,
    private router: Router,
  ) {
    if (localStorage.getItem("role") == "MANAGER" || localStorage.getItem("role") == "OWNER") {
      this.hideForManager = false;
    }
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.loadScans();
  }

  private authHeaders() {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  // ─── Data loading ───────────────────────────────────────────

  loadScans() {
    let url =
      GlobalVars.baseUrl +
      `/express-scan/scans?page=${this.currentPage}&size=${this.pageSize}`;
    const q = this.searchQuery.trim();
    if (q.length >= 3) {
      url += "&tracking_number=" + encodeURIComponent(q);
    }

    this.httpClient
      .get<any>(url, { headers: this.authHeaders() })
      .subscribe(
        (response) => {
          const rows: ScanRow[] = (response.scans || []).map((r: any) => {
            const scanDate = r.scan_time ? new Date(r.scan_time) : null;
            return {
              id: r.id,
              customer_id: r.customer_id,
              tracking_number: r.tracking_number,
              service_name: r.serviceType?.name_en || r.serviceType?.name_uz || "—",
              service_name_uz: r.serviceType?.name_uz || "",
              scan_time: r.scan_time,
              scan_date: scanDate,
              matched: r.customer_id != null,
            };
          });
          this.allData = rows;
          this.totalCount = response.totalItems ?? rows.length;
          this.totalPages = Math.max(1, response.totalPages ?? 1);
          this.currentPage = response.currentPage ?? this.currentPage;
          this.rebuildGroups();
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  // ─── Pagination ────────────────────────────────────────────

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadScans();
    // Scroll to top of list for context.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }
  nextPage() {
    this.goToPage(this.currentPage + 1);
  }
  get canPrev(): boolean {
    return this.currentPage > 0;
  }
  get canNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }
  get pageRangeStart(): number {
    return this.totalCount === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }
  get pageRangeEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalCount);
  }

  // ─── Search + filter ────────────────────────────────────────

  onSearchInput(value: string) {
    this.searchQuery = value || "";
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage = 0;
      this.loadScans();
    }, 350);
  }

  clearSearch() {
    this.searchQuery = "";
    this.currentPage = 0;
    this.loadScans();
  }

  setFilter(kind: FilterKind) {
    this.activeFilter = kind;
    this.rebuildGroups();
  }

  private rebuildGroups() {
    const filtered = this.allData.filter((r) => {
      if (this.activeFilter === "matched") return r.matched;
      if (this.activeFilter === "unknown") return !r.matched;
      return true;
    });

    // Group by local date bucket, preserve server ordering (newest first)
    const buckets: { [k: string]: Group } = {};
    const order: string[] = [];
    for (const r of filtered) {
      const key = this.dateBucket(r.scan_date);
      if (!buckets[key]) {
        buckets[key] = {
          key,
          label: this.headerLabel(r.scan_date),
          dateLabel: this.headerDate(r.scan_date),
          rows: [],
        };
        order.push(key);
      }
      buckets[key].rows.push(r);
    }

    this.filteredGroups = order.map((k) => buckets[k]);
  }

  get visibleCount(): number {
    return this.filteredGroups.reduce((sum, g) => sum + g.rows.length, 0);
  }

  // ─── Time / date formatting (timezone-aware) ────────────────
  // All input Date objects are already local (JS Date parses ISO/UTC to local automatically).

  private dateBucket(d: Date | null): string {
    if (!d) return "unknown";
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  private headerLabel(d: Date | null): string {
    if (!d) return "Unknown date";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scanDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today.getTime() - scanDay.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
    }
    return this.headerDate(d).replace(/^· /, "");
  }

  private headerDate(d: Date | null): string {
    if (!d) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `· ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  relativeTime(d: Date | null): string {
    if (!d) return "—";
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  clockTime(d: Date | null): string {
    if (!d) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // Compact "Jul 4, 15:49" — date + wall-clock time on one line.
  fullDateTime(d: Date | null): string {
    if (!d) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
  }

  // ─── Scan flow ──────────────────────────────────────────────

  private playBing() {
    const audio = new Audio();
    audio.src = "../../../assets/audio/incorrect2.mp3";
    audio.load();
    audio.play().catch(() => {});
  }

  recordParcel() {
    swal
      .fire({
        title: "Scan tracking number",
        text: "Use the barcode scanner or type it in manually",
        allowEnterKey: true,
        input: "text",
        showConfirmButton: false,
        position: "top",
        customClass: { cancelButton: "btn btn-danger" },
        buttonsStyling: false,
        preConfirm: async (value) => {
          const tracking = String(value || "").trim();
          if (!tracking) return { tracking: null };
          const scanResult = await this.doScan(tracking);
          return { tracking, scanResult };
        },
      })
      .then((result) => {
        if (result.isDismissed) {
          swal.fire({
            icon: "warning",
            html: "FINISHED",
            customClass: { confirmButton: "btn btn-success" },
            buttonsStyling: false,
          });
          return;
        }

        const { tracking, scanResult } = result.value || {};

        // Matched → show the pre-declared popup, then reopen input for the next scan.
        // Un-matched or empty → reopen input immediately.
        if (scanResult && scanResult.matched && scanResult.service) {
          this.showMatchedPopup(tracking, scanResult).then(() => {
            setTimeout(() => this.recordParcel(), 50);
          });
        } else if (scanResult && scanResult.error) {
          swal
            .fire("Error", scanResult.error, "error")
            .then(() => setTimeout(() => this.recordParcel(), 50));
        } else {
          setTimeout(() => this.recordParcel(), 50);
        }
      });
  }

  /**
   * Scan the tracking against the backend. Does NOT open any popup — it just
   * returns the result (or an error object). The caller decides what to show
   * AFTER the input popup has closed, so nested-swal replacement can't drop us
   * on the floor.
   */
  private doScan(tracking: string): Promise<any> {
    return new Promise((resolve) => {
      this.httpClient
        .post<any>(
          GlobalVars.baseUrl + "/express-scan/scan",
          { tracking_number: tracking },
          { headers: this.authHeaders() },
        )
        .subscribe(
          (res) => {
            this.loadScans();
            if (res.matched && res.service) this.playBing();
            resolve(res);
          },
          (error) => {
            if (error.status === 403) {
              this.authService.logout();
              resolve(null);
              return;
            }
            this.playBing();
            resolve({ error: error.error?.error || "Scan failed" });
          },
        );
    });
  }

  private showMatchedPopup(tracking: string, res: any): Promise<any> {
    const already = res.already_scanned
      ? `<br><small style="color:#e67e22;">⚠️ This tracking was already scanned</small>`
      : "";
    return swal.fire({
      icon: "info",
      title: "Customer pre-declared this parcel!",
      html: `
        <div style="text-align:center; padding: 8px;">
          <div style="font-size:13px;color:#888;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Tracking Number</div>
          <div style="font-size:20px;font-weight:800;color:#344767;margin:4px 0 14px;">${tracking}</div>
          <div style="font-size:13px;color:#888;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Service Type</div>
          <div style="font-size:22px;font-weight:800;color:#7c3aed;margin:4px 0 8px;">${res.service.name_en || res.service.name_uz}</div>
          <div style="font-size:12px;color:#666;">${res.service.name_uz}</div>
          ${already}
        </div>
      `,
      confirmButtonText: "Continue",
      customClass: { confirmButton: "btn btn-success" },
      buttonsStyling: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }

  refresh() {
    this.loadScans();
  }
}
