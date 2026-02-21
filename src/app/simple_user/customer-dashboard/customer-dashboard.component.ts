import { GlobalVars } from "src/app/global-vars";
import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from "@angular/core";
import swal from "sweetalert2";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

declare const $: any;

// Interfaces for type safety
interface DashboardStats {
  customer_id: string;
  customer_username: string;
  total_orders: number;
  total_weight: string;
  last_consignment_weight: string;
  last_consignment_name: string;
  last_two_consignments: Consignment[];
}

interface Consignment {
  name: string;
  weight: number;
  sum_usd: number;
  sum_uzs: number;
  debt: number;
  debt_uzs: number;
  registered_date: Date;
  delivered: boolean;
  quantity: number;
  isHongKong: boolean;
  rate: number;
}

interface Order {
  id: number;
  tracking_number: string;
  name_foreign: string;
  name_ru: string;
  quantity: number;
  status: number;
  in_foreign_warehouse_date?: Date;
  on_way_to_airport_date?: Date;
  in_uzb_airport_date?: Date;
  in_uzb_warehouse_date?: Date;
  client_sent_date?: Date;
  client_receive_date?: Date;
}

@Component({
  selector: "app-customer-dashboard",
  templateUrl: "./customer-dashboard.component.html",
  styleUrls: ["./customer-dashboard.component.css"],
})
export class CustomerDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild("txtConfigFile") txtConfigFile: ElementRef;

  headers12: any;
  options: any;

  // User information
  id: string;
  username: string;
  firstname: string;
  lastname: string;

  // Dashboard statistics
  customerId: string;
  customerUsername: string;
  totalOrders: number = 0;
  totalWeight: string = "0.00";
  lastConsignmentWeight: string = "0.00";
  lastConsignmentName: string = "";
  lastTwoConsignments: Consignment[] = [];

  // Modal data
  selectedConsignmentName: string = "";
  consignmentOrders: Order[] = [];
  selectedOrder: Order | null = null;

  // Loading states
  loadingStats: boolean = false;
  loadingOrders: boolean = false;

  // Calendar preview data
  calendarPreviewItems: any[] = [];
  loadingCalendar: boolean = false;
  calendarStatusOrder: number[] = [2, 4, 5, 7];

  constructor(
    public authService: AuthService,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    // Get user info from localStorage
    this.id = localStorage.getItem("id");
    this.username = localStorage.getItem("username");
    this.firstname = localStorage.getItem("first_name");
    this.lastname = localStorage.getItem("last_name");
  }

  ngOnInit() {
    this.customerId = this.id;
    this.customerUsername = this.username;

    // Load dashboard statistics
    this.loadDashboardStats();
    this.loadCalendarPreview();
  }

  // Load customer dashboard statistics
  loadDashboardStats() {
    this.loadingStats = true;

    const url = GlobalVars.baseUrl + "/dashboard/stats";
    const params = new HttpParams().set("customer_id", this.customerId);
    const urlWithParams = `${url}?${params.toString()}`;

    this.http.get(urlWithParams, this.options).subscribe(
      (response) => {
        const result = response.json();

        if (result.status === "success") {
          const data: DashboardStats = result.data;

          this.totalOrders = data.total_orders;
          this.totalWeight = data.total_weight;
          this.lastConsignmentWeight = data.last_consignment_weight;
          this.lastConsignmentName = data.last_consignment_name || "Yo'q";
          this.lastTwoConsignments = data.last_two_consignments || [];

          this.loadingStats = false;
        } else {
          swal.fire(
            "Xatolik",
            result.message || "Dashboard ma'lumotlarini yuklashda xatolik",
            "error"
          );
          this.loadingStats = false;
        }
      },
      (error) => {
        console.error("Error loading dashboard stats:", error);

        swal.fire(
          "Xatolik",
          `Dashboard ma'lumotlarini yuklashda xatolik: ${
            error.json()?.error || error.message
          }`,
          "error"
        );

        this.loadingStats = false;

        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );
  }

  // Open consignment orders modal
  openConsignmentModal(consignmentName: string) {
    this.selectedConsignmentName = consignmentName;
    this.consignmentOrders = [];
    this.loadConsignmentOrders(consignmentName);
    $("#consignmentOrdersModal").modal("show");
  }

  // Load orders for specific consignment
  loadConsignmentOrders(consignmentName: string) {
    this.loadingOrders = true;

    const url = GlobalVars.baseUrl + "/orders/list";
    let params = new HttpParams()
      .set("page", "0")
      .set("size", "150")
      .set("ownerID", this.customerId)
      .set("consignment", consignmentName);

    const urlWithParams = `${url}?${params.toString()}`;

    this.http.get(urlWithParams, this.options).subscribe(
      (response) => {
        const result = response.json();
        this.consignmentOrders = result.orders || [];
        this.loadingOrders = false;
      },
      (error) => {
        console.error("Error loading orders:", error);
        swal.fire(
          "Xatolik",
          `Buyurtmalarni yuklashda xatolik: ${
            error.json()?.error || error.message
          }`,
          "error"
        );
        this.loadingOrders = false;

        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );
  }

  // View order details in separate modal
  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    $("#orderDetailsModal").modal("show");
  }

  // Receive order (mark as received)
  receiveOrder(trackingNumber: string, orderName: string) {
    swal
      .fire({
        title: "Qabul qildim!",
        html: `<p>${trackingNumber}, ${orderName} buyurtmani olganingizni tasdiqaysizmi?</p>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, buni oldim",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/client_received?tracking_number=" +
                trackingNumber,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                swal.fire({
                  icon: "success",
                  title: "Muvaffaqiyat!",
                  text: "Buyurtma qabul qilindi",
                  timer: 2000,
                  showConfirmButton: false,
                });

                // Reload orders in modal
                this.loadConsignmentOrders(this.selectedConsignmentName);
                // Reload dashboard stats
                this.loadDashboardStats();
              },
              (error) => {
                swal.fire(
                  "Xatolik",
                  "Buyurtmani qabul qilishda xatolik",
                  "error"
                );
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }

  // Navigate to order boxes (all consignments)
  goToAllConsignments() {
    this.router.navigate(["/orderboxes"]);
  }

  // ── Calendar Preview ──────────────────────────────────────

  loadCalendarPreview() {
    this.loadingCalendar = true;
    this.http
      .get(GlobalVars.baseUrl + "/consignments/calendar", this.options)
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "ok") {
            this.calendarPreviewItems = (result.consignments || []).slice(0, 5);
          }
          this.loadingCalendar = false;
        },
        (error) => {
          this.loadingCalendar = false;
          if (error.status === 403) {
            this.authService.logout();
          }
        }
      );
  }

  getCalendarProgress(item: any): number {
    const completed = this.calendarStatusOrder.filter((s) =>
      this.isCalendarStepCompleted(item, s)
    ).length;
    return completed / this.calendarStatusOrder.length;
  }

  getCalendarProgressPercent(item: any): number {
    return Math.round(this.getCalendarProgress(item) * 100);
  }

  isCalendarStepCompleted(item: any, stepStatus: number): boolean {
    if (!item.timeline) return false;
    const timelineItem = item.timeline.find((t) => t.status === stepStatus);
    if (timelineItem && timelineItem.reached !== undefined) {
      return timelineItem.reached;
    }
    const currentIdx = this.calendarStatusOrder.indexOf(item.currentStatus);
    const stepIdx = this.calendarStatusOrder.indexOf(stepStatus);
    return currentIdx >= stepIdx && this.getCalendarStepDate(item, stepStatus) !== null;
  }

  isCalendarCurrentStep(item: any, stepStatus: number): boolean {
    return item.currentStatus === stepStatus;
  }

  getCalendarStepDate(item: any, stepStatus: number): string | null {
    if (item.timeline) {
      const t = item.timeline.find((t) => t.status === stepStatus);
      if (t && t.date) return t.date;
    }
    const fieldMap = { 2: "in_foreign_warehouse_date", 4: "in_foreign_airport_date", 5: "in_uzb_airport_date", 7: "in_uzb_warehouse_date" };
    if (fieldMap[stepStatus] && item[fieldMap[stepStatus]]) {
      return item[fieldMap[stepStatus]];
    }
    return null;
  }

  getCalendarStepIcon(stepStatus: number, item: any): string {
    if (item.isHongKong) {
      const icons = { 2: "inventory_2", 4: "local_shipping", 5: "location_on", 7: "warehouse" };
      return icons[stepStatus] || "local_shipping";
    }
    const icons = { 2: "inventory_2", 4: "flight_takeoff", 5: "flight_land", 7: "warehouse" };
    return icons[stepStatus] || "local_shipping";
  }

  getCalendarStatusLabel(item: any): string {
    if (item.currentStatusName && item.currentStatusName.uz) {
      return item.currentStatusName.uz;
    }
    return "";
  }

  goToCalendar() {
    this.router.navigate(["/consignment-calendar"]);
  }

  // Copy Chinese address to clipboard
  copyToCB() {
    if (this.txtConfigFile) {
      this.txtConfigFile.nativeElement.select();
      document.execCommand("copy");
      this.txtConfigFile.nativeElement.setSelectionRange(0, 0);

      // Show success message
      swal.fire({
        icon: "success",
        title: "Nusxa olindi!",
        text: "Manzil nusxalandi",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  // Helper methods
  hasConsignments(): boolean {
    return this.lastTwoConsignments && this.lastTwoConsignments.length > 0;
  }

  isDebtPaid(debt: number): boolean {
    return !debt || debt === 0;
  }

  formatDate(date: Date): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("uz-UZ");
  }

  // Get order status text
  getOrderStatusText(statusId: number): string {
    return GlobalVars.getDesOrderStatusWithID(statusId, "uz");
  }

  // Get badge class based on status
  getStatusBadgeClass(statusId: number): string {
    switch (statusId) {
      case 1: // Not arrived
        return "badge-warning";
      case 2: // In foreign warehouse
        return "badge-info";
      case 3: // On way to airport
        return "badge-primary";
      case 4: // In foreign airport
        return "badge-primary";
      case 5: // In Uzbekistan airport
        return "badge-info";
      case 6: // In Uzbekistan warehouse
        return "badge-success";
      case 7: // Sent to client
        return "badge-info";
      case 8: // Sent to another address
        return "badge-warning";
      case 9: // Client received
        return "badge-success";
      default:
        return "badge-secondary";
    }
  }

  ngAfterViewInit() {
    // Card animations on hover
    const breakCards = true;
    if (breakCards === true) {
      $('[data-header-animation="true"]').each(function () {
        const $fix_button = $(this);
        const $card = $(this).parent(".card");

        $card.find(".fix-broken-card").click(function () {
          const $header = $(this)
            .parent()
            .parent()
            .siblings(".card-header, .card-image");
          $header.removeClass("hinge").addClass("fadeInDown");
          $card.attr("data-count", 0);

          setTimeout(function () {
            $header.removeClass("fadeInDown animate");
          }, 480);
        });

        $card.mouseenter(function () {
          const $this = $(this);
          const hover_count = parseInt($this.attr("data-count"), 10) + 1 || 0;
          $this.attr("data-count", hover_count);

          if (hover_count >= 20) {
            $(this)
              .children(".card-header, .card-image")
              .addClass("hinge animated");
          }
        });
      });
    }
  }
}
