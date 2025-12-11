// emu-deliveries.component.ts
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
  selector: "app-emu-deliveries",
  templateUrl: "./emu-deliveries.component.html",
  styleUrls: ["./emu-deliveries.component.css"],
})
export class EmuDeliveriesComponent implements OnInit {
  headers12: any;
  options: any;

  // Fixed delivery type - EMU only
  readonly deliveryType: string = "EMU";

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
  weightNotes: string = "";

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
    // Load today's EMU deliveries on init
    this.applyFilters();
  }

  // Apply filters and load deliveries
  applyFilters() {
    this.loadingDeliveries = true;

    let params = new HttpParams()
      .set("delivery_type", this.deliveryType)
      .set("date_filter", this.selectedDateFilter)
      .set("limit", "800")
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

  // Check if employee can edit weight
  canEditWeight(delivery: Delivery): boolean {
    return delivery.weight && delivery.status === "collected";
  }

  // Process EMU delivery (requires weight input)
  processEmuDelivery(delivery: Delivery) {
    this.selectedDeliveryForWeight = delivery;
    this.enteredWeight = null;
    this.weightNotes = "";
    $("#weightInputModal").modal("show");
  }

  // Save weight and process EMU delivery
  saveWeightAndProcess() {
    if (!this.enteredWeight || !this.selectedDeliveryForWeight) {
      swal.fire("Xatolik", "Og'irlikni kiriting", "error");
      return;
    }

    this.processingDelivery = true;

    const updateData = {
      new_status: "collected",
      weight: this.enteredWeight,
    };

    this.http
      .put(
        GlobalVars.baseUrl +
          "/deliveries/status?delivery_id=" +
          this.selectedDeliveryForWeight.id,
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
              text: "Yetkazish qabul qilindi va og'irlik saqlandi",
              customClass: {
                confirmButton: "btn btn-success",
              },
              buttonsStyling: false,
            });

            $("#weightInputModal").modal("hide");
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

  // Edit weight for EMU deliveries
  editWeight(delivery: Delivery) {
    this.selectedDeliveryForWeight = delivery;
    this.enteredWeight = delivery.weight;
    $("#editWeightModal").modal("show");
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

            $("#editWeightModal").modal("hide");
            this.applyFilters(); // Reload deliveries
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
      collected: "OlDIM",
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

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
