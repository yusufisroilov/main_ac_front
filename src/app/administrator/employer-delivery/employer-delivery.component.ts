// employee-delivery.component.ts
// employee-delivery.component.ts
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
  selector: "app-employer-delivery",
  templateUrl: "./employer-delivery.component.html",
  styleUrls: ["./employer-delivery.component.css"],
})
export class EmployerDeliveryComponent {
  headers12: any;
  options: any;

  // Filter states
  selectedDeliveryType: string = "";
  selectedDateFilter: string = "today";
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
    // Don't load deliveries on init, wait for user to select delivery type
  }

  // Select delivery type and load deliveries
  selectDeliveryType(type: string) {
    this.selectedDeliveryType = type;
    this.applyFilters();
  }

  // Apply filters and load deliveries
  applyFilters() {
    if (!this.selectedDeliveryType) {
      return;
    }

    this.loadingDeliveries = true;

    let params = new HttpParams()
      .set("delivery_type", this.selectedDeliveryType)
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

            // console.log("Employee deliveries loaded:", this.deliveries);
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

  // Check if employee can edit weight (only for EMU deliveries they processed)
  canEditWeight(delivery: Delivery): boolean {
    return (
      delivery.delivery_type === "EMU" &&
      delivery.weight &&
      delivery.status === "collected"
    );
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

  // Process non-EMU delivery (no weight required)
  processDelivery(delivery: Delivery) {
    const statusToSet = this.getTargetStatusForDeliveryType(
      delivery.delivery_type
    );

    swal
      .fire({
        title: "Tasdiqlash",
        text: `${delivery.barcode} yetkazishni "${this.getStatusText(
          statusToSet
        )}" holatiga o'tkazishni tasdiqlaysizmi?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ha, tasdiqlash",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.updateDeliveryStatus(delivery, statusToSet);
        }
      });
  }

  // Get target status based on delivery type
  getTargetStatusForDeliveryType(deliveryType: string): string {
    switch (deliveryType) {
      case "Yandex":
      case "Own-Courier":
        return "sent";
      case "Pick-up":
        return "collected";
      default:
        return "sent";
    }
  }

  // Update delivery status
  updateDeliveryStatus(delivery: Delivery, newStatus: string) {
    this.processingDelivery = true;

    const updateData = {
      new_status: newStatus,
      processed_by_employee: this.currentEmployee,
      [newStatus === "collected" ? "collected_date" : "sent_date"]:
        new Date().toISOString(),
    };

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
              text: `Yetkazish "${this.getStatusText(
                newStatus
              )}" holatiga o'tkazildi`,
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

  // Get delivery type display text
  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU",
      Yandex: "Yandex",
      "Own-Courier": "Bizning Kuryerimiz",
      "Pick-up": "O'zim olib ketaman",
    };
    return types[type] || type;
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

  // Get action button text based on delivery type
  getActionButtonText(deliveryType: string): string {
    return deliveryType === "EMU" ? "Oldim" : "Berdim";
  }

  // Get action button class based on delivery type
  getActionButtonClass(deliveryType: string): string {
    return deliveryType === "EMU" ? "btn-success" : "btn-primary";
  }

  // Get action button icon based on delivery type
  getActionButtonIcon(deliveryType: string): string {
    return deliveryType === "EMU" ? "inventory" : "send";
  }
}
