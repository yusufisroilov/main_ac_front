import { Component, OnInit } from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

interface TimelineStep {
  status: number;
  statusName: any;
  date: string | null;
  reached: boolean;
}

interface ConsignmentItem {
  id: number;
  name: string;
  isHongKong: boolean;
  currentStatus: number;
  currentStatusName: any;
  hasOrders: boolean;
  orderCount: number;
  timeline: TimelineStep[];
}

@Component({
  selector: "app-consignment-tracking",
  templateUrl: "./consignment-tracking.component.html",
  styleUrls: ["./consignment-tracking.component.css"],
})
export class ConsignmentTrackingComponent implements OnInit {
  headers12: any;
  options: any;

  loading = false;
  allConsignments: ConsignmentItem[] = [];
  filteredConsignments: ConsignmentItem[] = [];

  showMyOnly = false;
  activeStatusFilter: number | null = null;

  calendarStatusOrder: number[] = [2, 4, 5, 7];

  statusFilters = [
    { status: 2, label: "Xitoy Omborida", icon: "inventory_2" },
    { status: 4, label: "Xitoy Aeroportida", icon: "flight_takeoff" },
    { status: 5, label: "O'zbekiston Aeroportida", icon: "flight_land" },
    { status: 7, label: "Toshkent Omborida", icon: "warehouse" },
  ];

  customerId = localStorage.getItem("id") || "";

  constructor(
    public authService: AuthService,
    private http: Http,
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const url = `${GlobalVars.baseUrl}/consignments/calendar?customer_id=${this.customerId}`;
    this.http.get(url, this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "ok") {
          this.allConsignments = result.consignments || [];
          this.applyFilters();
        }
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        if (error.status === 403) {
          this.authService.logout();
        }
      },
    );
  }

  toggleMyOnly() {
    this.showMyOnly = !this.showMyOnly;
    if (!this.showMyOnly) {
      this.activeStatusFilter = null;
    }
    this.applyFilters();
  }

  setStatusFilter(status: number) {
    if (this.activeStatusFilter === status) {
      this.activeStatusFilter = null;
    } else {
      this.activeStatusFilter = status;
    }
    this.applyFilters();
  }

  applyFilters() {
    let list = this.allConsignments;

    if (this.showMyOnly) {
      list = list.filter((c) => c.hasOrders);
    }

    if (this.activeStatusFilter !== null) {
      list = list.filter((c) => this.getCurrentStatus(c) === this.activeStatusFilter);
    }

    this.filteredConsignments = list;
  }

  getCurrentStatus(item: ConsignmentItem): number {
    if (item.currentStatus) return item.currentStatus;
    // Derive from timeline
    for (let i = this.calendarStatusOrder.length - 1; i >= 0; i--) {
      const step = item.timeline?.find((t) => t.status === this.calendarStatusOrder[i]);
      if (step?.reached) return this.calendarStatusOrder[i];
    }
    return 1;
  }

  // ── Calendar card helpers (same as CustomerDashboard) ──

  getCalendarProgress(item: ConsignmentItem): number {
    const completed = this.calendarStatusOrder.filter((s) =>
      this.isCalendarStepCompleted(item, s),
    ).length;
    return completed / this.calendarStatusOrder.length;
  }

  getCalendarProgressPercent(item: ConsignmentItem): number {
    return Math.round(this.getCalendarProgress(item) * 100);
  }

  isCalendarStepCompleted(item: ConsignmentItem, stepStatus: number): boolean {
    if (!item.timeline) return false;
    const timelineItem = item.timeline.find((t) => t.status === stepStatus);
    if (timelineItem && timelineItem.reached !== undefined) {
      return timelineItem.reached;
    }
    return false;
  }

  isCalendarCurrentStep(item: ConsignmentItem, stepStatus: number): boolean {
    return this.getCurrentStatus(item) === stepStatus;
  }

  getCalendarStepDate(item: ConsignmentItem, stepStatus: number): string | null {
    if (item.timeline) {
      const t = item.timeline.find((t) => t.status === stepStatus);
      if (t && t.date) return t.date;
    }
    return null;
  }

  getCalendarStepIcon(stepStatus: number, item: ConsignmentItem): string {
    if (item.isHongKong) {
      return { 2: "inventory_2", 4: "local_shipping", 5: "location_on", 7: "warehouse" }[stepStatus] || "local_shipping";
    }
    return { 2: "inventory_2", 4: "flight_takeoff", 5: "flight_land", 7: "warehouse" }[stepStatus] || "local_shipping";
  }

  getCalendarStatusLabel(item: ConsignmentItem): string {
    if (item.currentStatusName && item.currentStatusName.uz) {
      return item.currentStatusName.uz;
    }
    return "";
  }

  getStatusFilterCount(status: number): number {
    const base = this.showMyOnly
      ? this.allConsignments.filter((c) => c.hasOrders)
      : this.allConsignments;
    return base.filter((c) => this.getCurrentStatus(c) === status).length;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }
}
