// pickup-deliveries.component.ts
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
  selector: "app-pickup-deliveries",
  templateUrl: "./pickup-deliveries.component.html",
  styleUrls: ["./pickup-deliveries.component.css"],
})
export class PickupDeliveriesComponent implements OnInit {
  headers12: any;
  options: any;

  // Fixed delivery type - Pick-up only
  readonly deliveryType: string = "Pick-up";

  // Filter states
  selectedDateFilter: string = "today"; // Default to today
  selectedStatusFilter: string = "";

  // Deliveries data
  deliveries: Delivery[] = [];
  totalDeliveries: number = 0;
  loadingDeliveries: boolean = false;

  // Modal states
  selectedDelivery: Delivery | null = null;

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
    // Load today's Pick-up deliveries on init
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

  // Process Pick-up delivery
  processDelivery(delivery: Delivery) {
    swal
      .fire({
        title: "Tasdiqlash",
        text: `${delivery.barcode} qutini mijoz oldi qildingizmi?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ha, mijoz oldi",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.updateDeliveryStatus(delivery, "sent");
        }
      });
  }

  // Update delivery status
  updateDeliveryStatus(delivery: Delivery, newStatus: string) {
    this.processingDelivery = true;

    const updateData = {
      new_status: newStatus,
      processed_by_employee: this.currentEmployee,
      sent_date: new Date().toISOString(),
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
              text: `Quti mijoz tomonidan olindi`,
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
      sent: "Mijoz oldi",
      delivered: "Tugatildi",
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
      sent: "badge-success",
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
}
