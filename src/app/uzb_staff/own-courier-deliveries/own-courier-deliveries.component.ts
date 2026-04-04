// own-courier-deliveries.component.ts
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

declare var $: any;

interface Delivery {
  id: number;
  barcode: string;
  owner_id: string;
  delivery_type: string;
  total_packages: number;
  total_weight?: number;
  customer_phone: string;
  delivery_address?: string;
  weight: number;
  status: string;
  created_date: Date;
  collected_date?: Date;
  sent_date?: Date;
  delivered_date?: Date;
  delivery_fee: number;
  yandex_fee?: number;
  courier_name?: string;
  courier_phone?: string;
  notes?: string;
  weight_notes?: string;
  package_barcodes?: string[];
  processed_by_employee?: string;
  emu_branch_id?: number;
}

@Component({
  selector: "app-own-courier-deliveries",
  templateUrl: "./own-courier-deliveries.component.html",
  styleUrls: ["./own-courier-deliveries.component.css"],
})
export class OwnCourierDeliveriesComponent implements OnInit {
  headers12: any;
  options: any;

  // Fixed delivery type - Own-Courier only
  readonly deliveryType: string = "Own-Courier";

  // Filter states
  selectedDateFilter: string = "today"; // Default to today
  selectedStatusFilter: string = "";

  // Deliveries data
  deliveries: Delivery[] = [];
  totalDeliveries: number = 0;
  loadingDeliveries: boolean = false;

  // Modal states
  selectedDelivery: Delivery | null = null;
  selectedDeliveryForWeight: Delivery | null = null;

  // Weight input
  enteredWeight: number | null = null;

  // Processing states
  processingDelivery: boolean = false;

  // Current employee
  currentEmployee: string = "";

  constructor(
    public authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    this.currentEmployee = localStorage.getItem("username") || "employee";
  }

  ngOnInit() {
    // Load today's Own-Courier deliveries on init
    this.applyFilters();
  }

  // Apply filters and load deliveries
  applyFilters() {
    this.loadingDeliveries = true;

    let params = new HttpParams()
      .set("delivery_type", this.deliveryType)
      .set("date_filter", this.selectedDateFilter)
      .set("limit", "50")
      .set("offset", "0");

    if (this.selectedStatusFilter) {
      params = params.set("status", this.selectedStatusFilter);
    }

    this.http
      .get(
        GlobalVars.baseUrl + "/deliveries/filtered?" + params.toString(),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.deliveries = result.data.deliveries || [];
            this.totalDeliveries = result.data.pagination.total;
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Yetkazishlarni yuklashda xatolik",
              "error"
            );
          }
          this.loadingDeliveries = false;
        },
        (error) => {
          swal.fire("Xatolik", "Yetkazishlarni yuklashda xatolik", "error");
          this.loadingDeliveries = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Check if delivery can be processed by employee
  canProcessDelivery(delivery: Delivery): boolean {
    return delivery.status === "created";
  }

  // Process Own-Courier delivery
  processDelivery(delivery: Delivery) {
    swal
      .fire({
        title: "Tasdiqlash",
        html: `
          <p>${delivery.barcode} yetkazishni bizning kuryerimizga topshirdingizmi?</p>
          <input id="weight-input" class="swal2-input" type="number" step="0.01" min="0" placeholder="Og'irlik (kg)" />
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ha, topshirdim",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const weightEl = document.getElementById("weight-input") as HTMLInputElement;
          const weight = parseFloat(weightEl?.value);
          if (!weightEl?.value || isNaN(weight) || weight <= 0) {
            swal.showValidationMessage("Og'irlikni kiriting");
            return false;
          }
          return { weight };
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          this.updateDeliveryStatus(delivery, "sent", result.value.weight);
        }
      });
  }

  // Update delivery status
  updateDeliveryStatus(delivery: Delivery, newStatus: string, weight?: number) {
    this.processingDelivery = true;

    const updateData: any = {
      new_status: newStatus,
      processed_by_employee: this.currentEmployee,
      sent_date: new Date().toISOString(),
    };
    if (weight != null) updateData.weight = weight;

    this.http
      .put(
        GlobalVars.baseUrl + "/deliveries/status?delivery_id=" + delivery.id,
        JSON.stringify(updateData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            swal.fire({
              icon: "success",
              title: "Muvaffaqiyat!",
              text: `Yetkazish bizning kuryerimizga topshirildi`,
              customClass: {
                confirmButton: "btn btn-success",
              },
              buttonsStyling: false,
            });

            this.applyFilters(); // Reload deliveries
          } else {
            swal.fire("Xatolik", result.message, "error");
          }
          this.processingDelivery = false;
        },
        (error) => {
          swal.fire("Xatolik", "Yetkazishni qayta ishlashda xatolik", "error");
          this.processingDelivery = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Check if employee can edit weight
  canEditWeight(delivery: Delivery): boolean {
    return delivery.weight != null && delivery.weight > 0 && delivery.status === "sent";
  }

  // Edit weight
  editWeight(delivery: Delivery) {
    this.selectedDeliveryForWeight = delivery;
    this.enteredWeight = delivery.weight;
    $("#editWeightModalCourier").modal("show");
  }

  // Update weight only
  updateWeight() {
    if (!this.enteredWeight) {
      swal.fire("Xatolik", "Yangi og'irlikni kiriting", "error");
      return;
    }

    this.processingDelivery = true;

    const updateData = {
      weight: this.enteredWeight,
    };

    this.http
      .post(
        GlobalVars.baseUrl +
          "/deliveries/edit?delivery_id=" +
          this.selectedDeliveryForWeight.id,
        JSON.stringify(updateData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "ok") {
            swal.fire({
              icon: "success",
              title: "Yangilandi!",
              text: "Og'irlik muvaffaqiyatli yangilandi",
              customClass: {
                confirmButton: "btn btn-success",
              },
              buttonsStyling: false,
            });

            $("#editWeightModalCourier").modal("hide");
            this.applyFilters();
          } else {
            swal.fire("Xatolik", result.message, "error");
          }
          this.processingDelivery = false;
        },
        (error) => {
          swal.fire("Xatolik", "Og'irlikni yangilashda xatolik", "error");
          this.processingDelivery = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // View delivery details
  viewDeliveryDetails(delivery: Delivery) {
    this.loadDeliveryDetails(delivery.id).then((detailedDelivery) => {
      this.selectedDelivery = detailedDelivery;
      $("#deliveryDetailsModal").modal("show");
    });
  }

  // Load detailed delivery information
  loadDeliveryDetails(deliveryId: number): Promise<Delivery> {
    return new Promise((resolve, reject) => {
      this.http
        .get(
          GlobalVars.baseUrl + "/deliveries/detail?delivery_id=" + deliveryId,
          this.options
        )
        .subscribe(
          (response) => {
            const result = response.json();
            if (result.status === "success") {
              resolve(result.data);
            } else {
              reject(result.message);
            }
          },
          (error) => {
            reject("Ma'lumotlarni yuklashda xatolik");
            if (error.status == 403) {
              this.authService.logout();
            }
          }
        );
    });
  }

  // Get status display text
  getStatusText(status: string): string {
    const statuses = {
      created: "Yaratilgan",
      collected: "Qabul qilingan",
      sent: "Yuborilgan",
      delivered: "Yetkazilgan",
      returned: "Qaytarilgan",
      cancelled: "Bekor qilingan",
    };
    return statuses[status] || status;
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    const classes = {
      created: "badge-warning",
      collected: "badge-info",
      sent: "badge-primary",
      delivered: "badge-success",
      returned: "badge-secondary",
      cancelled: "badge-danger",
    };
    return classes[status] || "badge-light";
  }

  // Get date filter display text
  get selectedDateFilterText(): string {
    const filters = {
      today: "Bugun",
      yesterday: "Kecha",
      week: "Bu hafta",
      month: "Bu oy",
      all: "Barcha vaqtlar",
    };
    return filters[this.selectedDateFilter] || this.selectedDateFilter;
  }

  // Frontend date filtering
  filterDeliveriesByDate(deliveries: Delivery[]): Delivery[] {
    if (this.selectedDateFilter === "all") return deliveries;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;
    let endDate: Date;

    switch (this.selectedDateFilter) {
      case "today":
        startDate = today;
        endDate = new Date(today.getTime() + 86400000);
        break;
      case "yesterday":
        startDate = new Date(today.getTime() - 86400000);
        endDate = today;
        break;
      case "week":
        startDate = new Date(today.getTime() - 7 * 86400000);
        endDate = new Date(today.getTime() + 86400000);
        break;
      case "month":
        startDate = new Date(today.getTime() - 30 * 86400000);
        endDate = new Date(today.getTime() + 86400000);
        break;
      default:
        return deliveries;
    }

    return deliveries.filter((d) => {
      const created = new Date(d.created_date);
      return created >= startDate && created < endDate;
    });
  }
}
