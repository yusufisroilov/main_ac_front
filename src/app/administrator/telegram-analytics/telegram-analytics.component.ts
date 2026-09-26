import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { GlobalVars } from "../../global-vars";
import { showBackendError } from "../../shared/backend-error";

/**
 * How quickly clients get answered on Telegram.
 *
 * Two numbers are shown for every wait. Wall-clock is what the client
 * experienced; working time excludes nights and closed days, because a message
 * at 23:00 answered at 09:10 is a ten-minute reply and judging a team on the
 * raw figure judges them on when clients happen to write.
 *
 * Unanswered waits are never folded into an average. They are the number that
 * matters most and the one every average hides.
 */
@Component({
  selector: "app-telegram-analytics",
  templateUrl: "./telegram-analytics.component.html",
  styleUrls: ["./telegram-analytics.component.css"],
})
export class TelegramAnalyticsComponent implements OnInit {
  loading = false;
  report: any = null;
  days = 30;

  /** "speed" = response times (free, SQL). "topics" = what clients ask (paid). */
  tab: "speed" | "topics" = "speed";

  topicReport: any = null;
  topicsLoading = false;
  preview: any = null;
  generating = false;

  readonly ranges = [
    { label: "7 kun", days: 7 },
    { label: "30 kun", days: 30 },
    { label: "90 kun", days: 90 },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  setRange(days: number): void {
    this.days = days;
    if (this.tab === "speed") this.load();
    else this.loadPreview();
  }

  setTab(tab: "speed" | "topics"): void {
    this.tab = tab;
    if (tab === "topics" && !this.topicReport) this.loadTopics();
    if (tab === "topics") this.loadPreview();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `${localStorage.getItem("token")}`,
    });
  }

  /** The last stored taxonomy. Free — generating a new one is not. */
  loadTopics(): void {
    this.topicsLoading = true;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/telegram/analytics/topics`, {
        headers: this.headers(),
      })
      .subscribe({
        next: (res) => {
          this.topicReport = res.report;
          this.topicsLoading = false;
        },
        error: () => (this.topicsLoading = false),
      });
  }

  /**
   * How many messages a run would see, fetched before the button is pressed.
   * Nobody should spend money to find out the sample was forty messages.
   */
  loadPreview(): void {
    const to = new Date();
    const from = new Date(to.getTime() - this.days * 86400000);
    this.http
      .get<any>(`${GlobalVars.baseUrl}/telegram/analytics/topics/preview`, {
        headers: this.headers(),
        params: new HttpParams()
          .set("from", from.toISOString())
          .set("to", to.toISOString()),
      })
      .subscribe({
        next: (res) => (this.preview = res),
        error: () => (this.preview = null),
      });
  }

  generateTopics(): void {
    if (this.generating) return;
    this.generating = true;
    const to = new Date();
    const from = new Date(to.getTime() - this.days * 86400000);

    this.http
      .post<any>(
        `${GlobalVars.baseUrl}/telegram/analytics/topics`,
        { from: from.toISOString(), to: to.toISOString() },
        { headers: this.headers() },
      )
      .subscribe({
        next: () => {
          this.generating = false;
          this.loadTopics();
        },
        error: (err) => {
          this.generating = false;
          showBackendError(err);
        },
      });
  }

  /** Topics an assistant could answer are the shortlist for the next phase. */
  get aiAnswerable(): any[] {
    return (this.topicReport?.result?.topics || []).filter(
      (t: any) => t.answerable_by_ai,
    );
  }

  load(): void {
    this.loading = true;
    const to = new Date();
    const from = new Date(to.getTime() - this.days * 86400000);

    this.http
      .get<any>(`${GlobalVars.baseUrl}/telegram/analytics/response-times`, {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("token")}`,
        }),
        params: new HttpParams()
          .set("from", from.toISOString())
          .set("to", to.toISOString()),
      })
      .subscribe({
        next: (res) => {
          this.report = res;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          showBackendError(err);
        },
      });
  }

  /** Durations read better in the largest unit that still says something. */
  duration(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return "—";
    if (seconds < 60) return `${Math.round(seconds)} s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    const hours = seconds / 3600;
    return hours < 24 ? `${hours.toFixed(1)} soat` : `${(hours / 24).toFixed(1)} kun`;
  }

  percent(rate: number | null): string {
    return rate === null || rate === undefined
      ? "—"
      : `${Math.round(rate * 100)}%`;
  }

  /** Bar height for the busiest-hour chart, relative to the busiest hour. */
  hourBar(hour: any): number {
    const peak = Math.max(...(this.report?.by_hour || []).map((h: any) => h.turns), 1);
    return Math.round((hour.turns / peak) * 100);
  }

  get busiestHours(): any[] {
    return (this.report?.by_hour || []).filter((h: any) => h.turns > 0);
  }

  /** Hours the team is meant to be open, so the chart can mark them. */
  isOpenHour(hour: number): boolean {
    const wh = this.report?.working_hours;
    if (!wh) return true;
    return hour >= wh.start && hour < wh.end;
  }

  /** "9:00–18:00", from the hours the server measured with. */
  get hoursLabel(): string {
    const wh = this.report?.working_hours;
    return wh ? `${wh.start}:00–${wh.end}:00` : "";
  }

  /**
   * The same waits split two different ways, so two tables. One table of four
   * rows read as four groups when it was two pairs, each adding up to the total.
   */
  get segmentGroups(): { title: string; rows: { key: string; data: any }[] }[] {
    const s = this.report?.segments;
    if (!s) return [];
    return [
      {
        title: "Yangi yoki takroriy mijoz",
        rows: [
          { key: "Birinchi marta yozgan", data: s.first_contact },
          { key: "Avval ham yozgan", data: s.returning },
        ],
      },
      {
        title: "Bazadagi mijozmi",
        rows: [
          { key: "Bazadagi mijoz", data: s.known_client },
          { key: "Bazada topilmagan", data: s.unknown },
        ],
      },
    ];
  }

  /** The unanswered card leads to the people still waiting. */
  showWaiting(): void {
    document.getElementById("ta-waiting")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
