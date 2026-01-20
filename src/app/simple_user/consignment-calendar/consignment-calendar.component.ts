import { Component, OnInit } from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

interface ConsignmentCalendarItem {
  id: number;
  name: string;
  currentStatus: number;
  currentStatusName: {
    id: number;
    uz: string;
    ru: string;
    en: string;
  } | null;
  timeline: {
    status: number;
    statusName: any;
    date: string | null;
    reached: boolean;
  }[];
  // Direct date fields on consignment (for approximate dates)
  in_foreign_warehouse_date?: string | null;
  in_foreign_airport_date?: string | null;
  in_uzb_airport_date?: string | null;
  in_uzb_warehouse_date?: string | null;
}

interface ProgressStep {
  status: number;
  label: string;
  icon: string;
  dateField: string;
}

@Component({
  selector: "app-consignment-calendar",
  templateUrl: "./consignment-calendar.component.html",
  styleUrls: ["./consignment-calendar.component.css"],
})
export class ConsignmentCalendarComponent implements OnInit {
  options: any;
  loading: boolean = false;

  // Calendar data
  calendarData: ConsignmentCalendarItem[] = [];
  calendarDates: Date[] = [];
  groupedByDate: { [key: string]: ConsignmentCalendarItem[] } = {};

  // Status → Date field mapping
  statusDateMap: { [key: number]: string } = {
    2: "in_foreign_warehouse_date",
    4: "in_foreign_airport_date",
    5: "in_uzb_airport_date",
    6: "in_cpt_date",
    7: "in_uzb_warehouse_date",
  };

  // Status colors
  statusColors: { [key: number]: string } = {
    2: "#4CAF50", // Green - Xitoy omborida
    4: "#2196F3", // Blue - Xitoy aeroportida
    5: "#9C27B0", // Purple - O'zbekiston aeroportida
    6: "#FF9800", // Orange - O'zbekiston bojxonasida
    7: "#E91E63", // Pink - Toshkent omborida
  };

  // Status icons
  statusIcons: { [key: number]: string } = {
    2: "warehouse",
    4: "flight_takeoff",
    5: "flight_land",
    6: "assignment",
    7: "home",
  };

  // Progress steps for the stepper
  progressSteps: ProgressStep[] = [
    {
      status: 2,
      label: "Qadoqlash jarayonida",
      icon: "warehouse",
      dateField: "in_foreign_warehouse_date",
    },
    {
      status: 4,
      label: "Xitoy aeroportiga yuborildi",
      icon: "flight_takeoff",
      dateField: "in_foreign_airport_date",
    },
    {
      status: 5,
      label: "O'zbekiston aeroportida",
      icon: "flight_land",
      dateField: "in_uzb_airport_date",
    },
    {
      status: 7,
      label: "Toshkent omborida",
      icon: "inventory_2",
      dateField: "in_uzb_warehouse_date",
    },
  ];

  constructor(
    private http: Http,
    public authService: AuthService,
  ) {
    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: headers });
  }

  ngOnInit() {
    this.loadCalendarData();
  }

  // Load calendar data from API
  loadCalendarData() {
    this.loading = true;
    this.http
      .get(GlobalVars.baseUrl + "/consignments/calendar", this.options)
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "ok") {
            this.calendarData = result.consignments;
            console.log("calendar ", this.calendarData);
            this.generateCalendarDates();
            this.groupConsignmentsByDate();
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

  // Generate dates for calendar view (last 30 days + next 7 days)
  generateCalendarDates() {
    this.calendarDates = [];
    const today = new Date();

    // Generate dates from 30 days ago to 7 days in the future
    for (let i = -30; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.calendarDates.push(date);
    }
  }

  // Group consignments by their relevant date based on current status
  groupConsignmentsByDate() {
    this.groupedByDate = {};

    this.calendarData.forEach((consignment) => {
      // Get the date field for the current status
      const currentStatus = consignment.currentStatus;

      // Find the date from timeline based on current status
      const timelineItem = consignment.timeline.find(
        (t) => t.status === currentStatus,
      );

      if (timelineItem && timelineItem.date) {
        const dateKey = this.formatDateKey(new Date(timelineItem.date));

        if (!this.groupedByDate[dateKey]) {
          this.groupedByDate[dateKey] = [];
        }
        this.groupedByDate[dateKey].push(consignment);
      }
    });
  }

  // Format date to key string (YYYY-MM-DD)
  formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Format date for display (e.g., "15 Yan")
  formatDateDisplay(date: Date): string {
    const day = date.getDate();
    const months = [
      "Yan",
      "Fev",
      "Mar",
      "Apr",
      "May",
      "Iyun",
      "Iyul",
      "Avg",
      "Sen",
      "Okt",
      "Noy",
      "Dek",
    ];
    return `${day} ${months[date.getMonth()]}`;
  }

  // Get day of week in Uzbek
  getDayOfWeek(date: Date): string {
    const days = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
    return days[date.getDay()];
  }

  // Get consignments for a specific date
  getConsignmentsForDate(date: Date): ConsignmentCalendarItem[] {
    const dateKey = this.formatDateKey(date);
    return this.groupedByDate[dateKey] || [];
  }

  // Check if date is today
  isToday(date: Date): boolean {
    const today = new Date();
    return this.formatDateKey(date) === this.formatDateKey(today);
  }

  // Check if date has consignments
  hasConsignments(date: Date): boolean {
    return this.getConsignmentsForDate(date).length > 0;
  }

  // Get status color
  getStatusColor(status: number): string {
    return this.statusColors[status] || "#757575";
  }

  // Get status icon
  getStatusIcon(status: number): string {
    return this.statusIcons[status] || "local_shipping";
  }

  // Get status name in Uzbek
  getStatusNameUz(consignment: ConsignmentCalendarItem): string {
    if (consignment.currentStatusName && consignment.currentStatusName.uz) {
      return consignment.currentStatusName.uz;
    }
    return "Noma'lum";
  }

  // Get count of consignments for a date
  getConsignmentCount(date: Date): number {
    return this.getConsignmentsForDate(date).length;
  }

  // Get the start date (first timeline entry - usually status 2: in_foreign_warehouse_date)
  getStartDate(consignment: ConsignmentCalendarItem): string | null {
    if (consignment.timeline && consignment.timeline.length > 0) {
      // Find the first timeline entry with a date
      for (const item of consignment.timeline) {
        if (item.date) {
          return item.date;
        }
      }
    }
    return null;
  }

  // Get the current status date from timeline
  getCurrentStatusDate(consignment: ConsignmentCalendarItem): string | null {
    if (consignment.timeline) {
      const timelineItem = consignment.timeline.find(
        (t) => t.status === consignment.currentStatus,
      );
      if (timelineItem && timelineItem.date) {
        return timelineItem.date;
      }
    }
    return null;
  }

  // Format date for display (e.g., "15 Yanvar")
  formatDate(dateStr: string | null): string {
    if (!dateStr) {
      return "-";
    }
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ];
    return `${day} ${months[date.getMonth()]}`;
  }

  // Refresh calendar data
  refreshCalendar() {
    this.loadCalendarData();
  }

  // Status order for comparison (lower index = earlier in journey)
  statusOrder: number[] = [2, 4, 5, 7];

  // Check if a step is actually completed (status has reached or passed this step)
  isStepCompleted(
    consignment: ConsignmentCalendarItem,
    stepStatus: number,
  ): boolean {
    if (!consignment.timeline) return false;
    const timelineItem = consignment.timeline.find(
      (t) => t.status === stepStatus,
    );
    // Check if timeline item has reached flag, or compare status order
    if (timelineItem && timelineItem.reached !== undefined) {
      return timelineItem.reached;
    }
    // Fallback: compare status order
    const currentStatusIndex = this.statusOrder.indexOf(consignment.currentStatus);
    const stepStatusIndex = this.statusOrder.indexOf(stepStatus);
    return currentStatusIndex >= stepStatusIndex && this.getStepDate(consignment, stepStatus) !== null;
  }

  // Check if this is the current step
  isCurrentStep(
    consignment: ConsignmentCalendarItem,
    stepStatus: number,
  ): boolean {
    return consignment.currentStatus === stepStatus;
  }

  // Check if a date is approximate (has date but status not yet reached)
  isDateApproximate(
    consignment: ConsignmentCalendarItem,
    stepStatus: number,
  ): boolean {
    const hasDate = this.getStepDate(consignment, stepStatus) !== null;
    if (!hasDate) return false;

    // Check timeline reached flag first
    if (consignment.timeline) {
      const timelineItem = consignment.timeline.find(
        (t) => t.status === stepStatus,
      );
      if (timelineItem && timelineItem.reached !== undefined) {
        return !timelineItem.reached;
      }
    }

    // Fallback: compare status order - if current status is before this step, date is approximate
    const currentStatusIndex = this.statusOrder.indexOf(consignment.currentStatus);
    const stepStatusIndex = this.statusOrder.indexOf(stepStatus);
    return currentStatusIndex < stepStatusIndex;
  }

  // Map status to direct date field name
  statusToDateField: { [key: number]: string } = {
    2: "in_foreign_warehouse_date",
    4: "in_foreign_airport_date",
    5: "in_uzb_airport_date",
    7: "in_uzb_warehouse_date",
  };

  // Get date for a specific step - check both timeline and direct fields
  getStepDate(
    consignment: ConsignmentCalendarItem,
    stepStatus: number,
  ): string | null {
    // First, try to get from timeline
    if (consignment.timeline) {
      const timelineItem = consignment.timeline.find(
        (t) => t.status === stepStatus,
      );
      if (timelineItem && timelineItem.date) {
        return timelineItem.date;
      }
    }

    // Fallback: check direct date fields on consignment object
    const dateField = this.statusToDateField[stepStatus];
    if (dateField && consignment[dateField]) {
      return consignment[dateField];
    }

    return null;
  }

  // Check if the line between steps should be active (completed)
  isLineActive(
    consignment: ConsignmentCalendarItem,
    fromStatus: number,
    toStatus: number,
  ): boolean {
    return (
      this.isStepCompleted(consignment, fromStatus) &&
      this.isStepCompleted(consignment, toStatus)
    );
  }
}
