// src/app/pages/delivery/admin-delivery.component.ts
import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

declare var $: any;

interface PackageGroup {
  type: "tied" | "single";
  identifier: string;
  tie_group_id?: string;
  total_packages: number;
  total_items: number;
  consignments: string[];
  package_barcodes: string[];
  packages: any[];
  selected?: boolean;
}

interface Delivery {
  id: number;
  barcode: string;
  owner_id: string;
  delivery_type: string;
  total_packages: number;
  customer_phone: string;
  delivery_address?: string;
  status: string;
  created_date: Date;
  sent_date?: Date;
  delivered_date?: Date;
  delivery_fee: number;
  yandex_fee?: number;
  courier_name?: string;
  courier_phone?: string;
  notes?: string;
  returned_reason?: string;
  emuBranch?: any;
}

@Component({
  selector: "app-deliveries-list",
  templateUrl: "./deliveries-list-2.component.html",
  styleUrls: ["./deliveries-list-2.component.css"],
})
export class DeliveriesListComponent2 {
  headers12: any;
  options: any;

  // View states
  showCreateForm: boolean = false;
  showDeliveriesView: boolean = true;
  showDetailsModal: boolean = false;
  showStatusModal: boolean = false;

  // Customer and packages data
  customerIdInput: string = "";
  selectedCustomerId: string = "";
  customerPackages: PackageGroup[] = [];
  selectedPackageIdentifiers: string[] = [];

  // Delivery form data
  deliveryType: string = "";
  customerPhone: string = "";
  deliveryAddress: string = "";
  courierName: string = "";
  courierPhone: string = "";
  deliveryFee: number = 0;
  yandexFee: number = 0;
  deliveryNotes: string = "";

  // EMU data
  regions: any[] = [];
  branches: any[] = [];
  selectedRegionId: number | null = null;
  selectedBranchId: number | null = null;

  // Deliveries data
  deliveries: Delivery[] = [];
  selectedDelivery: Delivery | null = null;
  totalDeliveries: number = 0;

  // Filters
  filterDeliveryType: string = "";
  filterStatus: string = "";
  filterDateRange: string = "";
  filterCustomerId: string = "";
  customStartDate: string = "";
  customEndDate: string = "";

  // Pagination
  currentPage: number = 0;
  deliveriesPerPage: number = 50;
  totalPages: number = 0;

  // Status update
  newStatus: string = "";
  returnReason: string = "";
  statusNotes: string = "";

  // Loading states
  loadingCustomerPackages: boolean = false;
  loadingDeliveries: boolean = false;
  loadingRegions: boolean = false;
  loadingBranches: boolean = false;
  creatingDelivery: boolean = false;
  updatingStatus: boolean = false;
  bulkUpdating: boolean = false;
  downloadingExcel: boolean = false;

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
  }

  ngOnInit() {
    // Set default filter for EMU deliveries only
    this.filterDeliveryType = "EMU";

    // Set default date filter to today
    this.filterDateRange = "today";
    this.loadDeliveries();
    this.loadRegions();
  }

  // View management
  showCreateDeliveryForm() {
    this.showCreateForm = true;
    this.showDeliveriesView = false;
  }

  showDeliveriesList() {
    this.showCreateForm = false;
    this.showDeliveriesView = true;
    this.loadDeliveries();
  }

  // Load customer packages
  loadCustomerPackages() {
    if (!this.customerIdInput.trim()) {
      swal.fire("Xatolik", "Mijoz ID kiriting", "error");
      return;
    }

    this.loadingCustomerPackages = true;

    this.http
      .get(
        GlobalVars.baseUrl +
          "/deliveries/admin?owner_id=" +
          this.customerIdInput,
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.selectedCustomerId = this.customerIdInput;
            this.customerPackages = result.data.package_groups || [];

            // console.log("customer packages ", this.customerPackages);

            this.customerPackages.forEach((group) => (group.selected = false));
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni yuklashda xatolik",
              "error"
            );
          }
          this.loadingCustomerPackages = false;
        },
        (error) => {
          swal.fire("Xatolik", "Qutillarni yuklashda xatolik", "error");
          this.loadingCustomerPackages = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Update selected packages
  updateSelectedPackages() {
    this.selectedPackageIdentifiers = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        this.selectedPackageIdentifiers.push(group.identifier);
      }
    });
  }

  // Get total selected packages count
  getTotalSelectedPackages(): number {
    return this.customerPackages
      .filter((group) => group.selected)
      .reduce((total, group) => total + group.total_packages, 0);
  }

  // Load regions for EMU
  loadRegions() {
    this.loadingRegions = true;

    this.http.get(GlobalVars.baseUrl + "/regions/emu", this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "success") {
          this.regions = result.data.regions || [];
        }
        this.loadingRegions = false;
      },
      (error) => {
        this.loadingRegions = false;
        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );
  }

  // Load branches when region selected
  onRegionSelect(event: any) {
    const regionId = event.target.value;
    this.selectedRegionId = regionId ? parseInt(regionId) : null;
    this.selectedBranchId = null;
    this.branches = [];

    if (regionId) {
      this.loadingBranches = true;

      this.http
        .get(
          GlobalVars.baseUrl + "/branches?region_id=" + regionId,
          this.options
        )
        .subscribe(
          (response) => {
            const result = response.json();
            if (result.status === "success") {
              this.branches = result.data.branches || [];
            }
            this.loadingBranches = false;
          },
          (error) => {
            this.loadingBranches = false;
            if (error.status == 403) {
              this.authService.logout();
            }
          }
        );
    }
  }

  // Delivery type change handler
  onDeliveryTypeChange() {
    // Reset type-specific fields
    this.selectedRegionId = null;
    this.selectedBranchId = null;
    this.branches = [];
    this.deliveryAddress = "";
    this.courierName = "";
    this.courierPhone = "";
    this.yandexFee = 0;
  }

  // Load deliveries with filters
  loadDeliveries() {
    this.loadingDeliveries = true;

    let params = new HttpParams()
      .set("limit", this.deliveriesPerPage.toString())
      .set("offset", (this.currentPage * this.deliveriesPerPage).toString());
    // Always filter by EMU delivery type
    params = params.set("delivery_type", "EMU");
    if (this.filterDeliveryType) {
      params = params.set("delivery_type", this.filterDeliveryType);
    }

    if (this.filterCustomerId) {
      params = params.set("owner_id", this.filterCustomerId);
    }
    if (this.filterDateRange) {
      params = params.set("date_filter", this.filterDateRange);
      if (this.filterDateRange === "custom") {
        if (this.customStartDate) {
          params = params.set("start_date", this.customStartDate);
        }
        if (this.customEndDate) {
          params = params.set("end_date", this.customEndDate);
        }
      }
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
            // console.log("deliveries ", this.deliveries);

            this.totalDeliveries = result.data.pagination.total;
            this.totalPages = Math.ceil(
              this.totalDeliveries / this.deliveriesPerPage
            );
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

  // Apply filters
  applyFilters() {
    this.currentPage = 0;
    this.loadDeliveries();
  }

  // Clear filters
  clearFilters() {
    this.filterDeliveryType = "EMU";
    this.filterStatus = "";
    this.filterDateRange = "";
    this.filterCustomerId = "";
    this.customStartDate = "today";
    this.customEndDate = "";
    this.applyFilters();
  }

  // Bulk update today's EMU deliveries to 'sent' status
  bulkUpdateTodayEmuDeliveries() {
    swal
      .fire({
        title: "Tasdiqlash",
        text: "Bugungi barcha EMU yetkazishlarni 'Yuborildi' holatiga o'tkazmoqchimisiz?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, yuborish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.bulkUpdating = true;

          this.http
            .post(
              GlobalVars.baseUrl + "/deliveries/emu/bulk-update-today",
              {},
              this.options
            )
            .subscribe(
              (response) => {
                const result = response.json();
                if (result.status === "success") {
                  const updatedCount = result.data.updated_count || 0;
                  const packagesCount = result.data.total_packages_updated || 0;

                  swal.fire({
                    icon: "success",
                    title: "Muvaffaqiyatli!",
                    html: `<strong>${updatedCount}</strong> ta yetkazish yuborildi<br>
                           <small class="text-muted">${packagesCount} ta quti yangilandi</small>`,
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });

                  // Reload deliveries list
                  this.loadDeliveries();
                } else {
                  swal.fire({
                    icon: "info",
                    title: "Ma'lumot",
                    text: result.message || "Yetkazishlar topilmadi",
                    customClass: {
                      confirmButton: "btn btn-info",
                    },
                    buttonsStyling: false,
                  });
                }
                this.bulkUpdating = false;
              },
              (error) => {
                swal.fire(
                  "Xatolik",
                  "Yetkazishlarni yangilashda xatolik yuz berdi",
                  "error"
                );
                this.bulkUpdating = false;
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }

  // Download today's EMU deliveries as Excel file
  downloadEmuExcelForToday() {
    this.downloadingExcel = true;

    // Use HttpClient for proper Blob handling
    const headers = new HttpHeaders({
      Authorization: localStorage.getItem("token") || "",
    });

    this.httpClient
      .get(GlobalVars.baseUrl + "/deliveries/emu/export-excel-today", {
        headers: headers,
        responseType: "blob", // Important: Handle response as Blob
      })
      .subscribe(
        (blob: Blob) => {
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          // Generate filename with timestamp
          const now = new Date();
          const timestamp = now
            .toISOString()
            .replace(/:/g, "_")
            .replace(/\..+/, "");
          link.download = `EMU_Deliveries_${timestamp}.xlsx`;

          // Trigger download
          document.body.appendChild(link);
          link.click();

          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Show success message
          swal.fire({
            icon: "success",
            title: "Yuklandi!",
            text: "Excel fayl muvaffaqiyatli yuklandi",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });

          this.downloadingExcel = false;
        },
        (error) => {
          if (error.status === 404) {
            swal.fire({
              icon: "info",
              title: "Ma'lumot",
              text: "Bugun uchun EMU yetkazishlari topilmadi",
              customClass: {
                confirmButton: "btn btn-info",
              },
              buttonsStyling: false,
            });
          } else {
            swal.fire(
              "Xatolik",
              "Excel faylni yuklashda xatolik yuz berdi",
              "error"
            );
          }
          this.downloadingExcel = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Pagination
  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadDeliveries();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewDeliveryDetails(delivery_id: any) {
    this.http
      .get(
        GlobalVars.baseUrl + "/deliveries/detail?delivery_id=" + delivery_id,
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.selectedDelivery = result.data || [];
          }
        },
        (error) => {
          console.error("Error loading request packages:", error);
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
    this.showDetailsModal = true;
  }

  showBarcodes(delivery: any) {
    if (delivery.package_barcodes) {
      return delivery.package_barcodes.join(", ");
    } else {
      return delivery.barcode;
    }
  }
  // Update delivery status
  updateDeliveryStatus(delivery: Delivery) {
    this.selectedDelivery = delivery;
    this.newStatus = "";
    this.returnReason = "";
    this.statusNotes = "";
    this.showStatusModal = true;
    this.showDetailsModal = false;
  }

  // Save status update
  saveStatusUpdate() {
    if (!this.newStatus) {
      swal.fire("Xatolik", "Yangi holatni tanlang", "error");
      return;
    }

    if (this.newStatus === "returned" && !this.returnReason) {
      swal.fire("Xatolik", "Qaytarilish sababini kiriting", "error");
      return;
    }

    this.updatingStatus = true;

    const updateData = {
      new_status: this.newStatus,
      notes: this.statusNotes || null,
      returned_reason: this.returnReason || null,
      updated_by: localStorage.getItem("username") || null,
    };

    this.http
      .put(
        GlobalVars.baseUrl +
          "/deliveries/status?delivery_id=" +
          this.selectedDelivery.id,
        JSON.stringify(updateData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            swal.fire({
              icon: "success",
              title: "Yangilandi!",
              text: result.message,
              customClass: {
                confirmButton: "btn btn-success",
              },
              buttonsStyling: false,
            });
            this.closeModal();
            this.loadDeliveries();
          } else {
            swal.fire("Xatolik", result.message, "error");
          }
          this.updatingStatus = false;
        },
        (error) => {
          swal.fire("Xatolik", "Holatni yangilashda xatolik", "error");
          this.updatingStatus = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Quick status update to "sent"
  quickUpdateToSent(delivery: Delivery, event: Event) {
    event.stopPropagation(); // Prevent opening details modal

    swal
      .fire({
        title: "Tasdiqlang",
        text: `${delivery.barcode} yetkazishni "Yuborilgan" holatiga o'zgartirmoqchimisiz?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ha, yuborish",
        cancelButtonText: "Yo'q",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          const updateData = {
            new_status: "sent",
            notes: "EMU ga yuborildi",
            returned_reason: null,
            updated_by: localStorage.getItem("username") || null,
          };

          this.http
            .put(
              GlobalVars.baseUrl +
                "/deliveries/status?delivery_id=" +
                delivery.id,
              JSON.stringify(updateData),
              this.options
            )
            .subscribe(
              (response) => {
                const result = response.json();
                if (result.status === "success") {
                  swal.fire({
                    icon: "success",
                    title: "Yuborildi!",
                    text: "Yetkazish holati yangilandi",
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: "top-end",
                  });
                  this.loadDeliveries();
                } else {
                  swal.fire("Xatolik", result.message, "error");
                }
              },
              (error) => {
                swal.fire("Xatolik", "Holatni yangilashda xatolik", "error");
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }

  // Modal management
  closeModal() {
    this.showDetailsModal = false;
    this.showStatusModal = false;
    this.selectedDelivery = null;
  }

  // Form management
  resetDeliveryForm() {
    this.selectedCustomerId = "";
    this.customerIdInput = "";
    this.customerPackages = [];
    this.selectedPackageIdentifiers = [];
    this.deliveryType = "";
    this.customerPhone = "";
    this.deliveryAddress = "";
    this.courierName = "";
    this.courierPhone = "";
    this.deliveryFee = 0;
    this.yandexFee = 0;
    this.deliveryNotes = "";
    this.selectedRegionId = null;
    this.selectedBranchId = null;
    this.branches = [];
  }

  resetCustomerSelection() {
    this.selectedCustomerId = "";
    this.customerIdInput = "";
    this.customerPackages = [];
    this.selectedPackageIdentifiers = [];
  }

  // Helper methods
  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU",
      Yandex: "Yandex",
      "Own-Courier": "Kuryer",
      "Pick-up": "Olib ketish",
    };
    return types[type] || type;
  }

  getStatusText(status: string): string {
    const statuses = {
      created: "Yaratilgan",
      sent: "Yuborilgan",
      collected: "Yig'ilgan",
      returned: "Qaytarilgan",
      cancelled: "Bekor qilingan",
    };
    return statuses[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      created: "badge-warning",
      sent: "badge-success",
      collected: "badge-info",
      returned: "badge-secondary",
      cancelled: "badge-danger",
    };
    return classes[status] || "badge-light";
  }

  ngAfterViewInit() {
    // Add data labels for mobile responsive table
    this.addDataLabelsToTable();
  }

  addDataLabelsToTable() {
    const tables = document.querySelectorAll(".table");
    tables.forEach((table) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map(
        (th) => th.textContent?.trim() || ""
      );
      const rows = table.querySelectorAll("tbody tr");

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        cells.forEach((cell, index) => {
          if (headers[index]) {
            cell.setAttribute("data-label", headers[index]);
          }
        });
      });
    });
  }

  //format Phone number of EMU branch
  // Add to deliveries-list.component.ts

  formatPhone(phone: string): string {
    if (!phone) return "";

    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Format as XX XXX XX XX
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(
        5,
        7
      )} ${cleaned.slice(7, 9)}`;
    }

    return phone;
  }
}
