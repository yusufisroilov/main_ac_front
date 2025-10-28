// src/app/pages/package-tracking/package-tracking.component.ts
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
  tie_group_id?: string;
  package_count: number;
  total_items: number;
  consignments: string[];
  packages: PackageItem[];
  created_dates: {
    oldest: Date;
    newest: Date;
  };
}

interface PackageItem {
  barcode: string;
  consignment: string;
  items_count: number;
  created_at: Date;
}

interface CustomerInventory {
  owner_id: string;
  total_packages: number;
  package_groups: PackageGroup[];
  has_tied_packages: boolean;
  oldest_package_date: Date;
}

interface InventorySummary {
  total_packages: number;
  total_customers: number;
  tied_packages: number;
  single_packages: number;
  unique_tie_groups: number;
  total_items: number;
  consignments: string[];
  oldest_package: Date;
}

interface PackageToTie {
  owner_id: string;
  new_package: {
    barcode: string;
    consignment: string;
    weight: number;
    items_count: number;
  };
  existing_packages: any[];
  total_packages: number;
  needs_tying: boolean;
  already_has_tie_group: boolean;
  selected?: boolean; // For checkbox selection
}

@Component({
  selector: "app-warehour-inventory",
  templateUrl: "./warehour-inventory.component.html",
  styleUrls: ["./warehour-inventory.component.css"],
})
export class WarehouseInventoryComponent implements OnInit {
  headers12: any;
  options: any;

  // Data properties
  warehouseInventory: CustomerInventory[] = [];
  inventorySummary: InventorySummary | null = null;
  packagesToTie: PackageToTie[] = [];
  selectedCustomer: CustomerInventory | null = null;

  // Form data
  newPackage = {
    owner_id: "",
    consignment_name: "",
  };

  // View states
  showAddForm: boolean = false;
  showTyingView: boolean = false;
  showInventory: boolean = true;
  showCustomerModal: boolean = false;

  // Filter and search
  filterCustomerId: string = "";
  selectedConsignment: string = "";

  // Selection state
  selectAllPackages: boolean = false;

  // Loading states
  loadingInventory: boolean = false;
  addingPackage: boolean = false;
  loadingPackagesToTie: boolean = false;
  autoTyingPackages: boolean = false;

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
    this.loadWarehouseInventory();
  }

  // Load warehouse inventory
  loadWarehouseInventory() {
    this.loadingInventory = true;

    let url = GlobalVars.baseUrl + "/leftPackages/warehouse-inventory";

    let params = new HttpParams();
    if (this.filterCustomerId) {
      params = params.set("owner_id", this.filterCustomerId);
    }

    const urlWithParams = params.toString()
      ? `${url}?${params.toString()}`
      : url;

    this.http.get(urlWithParams, this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "success") {
          this.warehouseInventory = result.inventory || [];
          this.inventorySummary = result.summary || null;
        } else {
          swal.fire(
            "Xatolik",
            result.message || "Inventarni yuklashda xatolik",
            "error"
          );
        }
        this.loadingInventory = false;
      },
      (error) => {
        swal.fire(
          "Xatolik",
          `Inventarni yuklashda xatolik: ${
            error.json()?.error || error.message
          }`,
          "error"
        );
        this.loadingInventory = false;
        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );
  }

  // Add new package
  addPackage() {
    if (!this.newPackage.owner_id || !this.newPackage.consignment_name) {
      swal.fire("Xatolik", "Barcha maydonlarni to'ldiring", "error");
      return;
    }

    this.addingPackage = true;

    const packageData = {
      owner_id: this.newPackage.owner_id,
      name: this.newPackage.consignment_name,
    };

    this.http
      .post(
        GlobalVars.baseUrl + "/leftPackages/add",
        JSON.stringify(packageData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            swal
              .fire({
                icon: "success",
                title: "Muvaffaqiyat!",
                text: "Yangi quti qo'shildi",
                timer: 2000,
                showConfirmButton: false,
              })
              .then(() => {
                this.resetNewPackageForm();
                this.loadWarehouseInventory();
                this.showAddForm = false;
                this.showInventoryView();
              });
          } else {
            swal.fire(
              "Xatolik",
              result.error || "Quti qo'shishda xatolik",
              "error"
            );
          }
          this.addingPackage = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `Quti qo'shishda xatolik: ${error.json()?.error || error.message}`,
            "error"
          );
          this.addingPackage = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Find packages that need tying
  findPackagesToTie() {
    if (!this.selectedConsignment) {
      swal.fire("Xatolik", "Consignment nomini kiriting", "error");
      return;
    }

    this.loadingPackagesToTie = true;

    this.http
      .post(
        GlobalVars.baseUrl +
          "/leftPackages/list?name=" +
          this.selectedConsignment,
        {},
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.packagesToTie = (result.packages_to_tie || []).map(
              (pkg: PackageToTie) => ({
                ...pkg,
                selected: false, // Initialize selection state
              })
            );
            this.selectAllPackages = false;
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni topishda xatolik",
              "error"
            );
          }
          this.loadingPackagesToTie = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `Qutillarni topishda xatolik: ${
              error.json()?.error || error.message
            }`,
            "error"
          );
          this.loadingPackagesToTie = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Toggle select all packages
  toggleSelectAll() {
    this.packagesToTie.forEach((pkg) => {
      pkg.selected = this.selectAllPackages;
    });
  }

  // Get count of selected packages
  getSelectedPackagesCount(): number {
    return this.packagesToTie.filter((pkg) => pkg.selected).length;
  }

  // Tie selected packages
  tieSelectedPackages() {
    const selectedPackages = this.packagesToTie.filter((pkg) => pkg.selected);

    if (selectedPackages.length === 0) {
      swal.fire("Xatolik", "Hech qanday mijoz tanlanmagan", "error");
      return;
    }

    const customerIds = selectedPackages.map((pkg) => pkg.owner_id);

    swal
      .fire({
        title: "Tanlangan mijozlarni bog'lash",
        html: `
          <div class="text-left">
            <p><strong>${
              selectedPackages.length
            } ta mijoz</strong> tanlandi:</p>
            <ul style="max-height: 200px; overflow-y: auto;">
              ${customerIds.map((id) => `<li>Mijoz K${id}</li>`).join("")}
            </ul>
            <p class="mt-3">Ushbu mijozlarning barcha qutilari bog'lansinmi?</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ha, bog'lash",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.performBulkTie(customerIds);
        }
      });
  }

  // Perform bulk tie for selected customers
  performBulkTie(customerIds: string[]) {
    const requestData = {
      consignment_name: this.selectedConsignment,
      customer_ids: customerIds,
    };

    this.autoTyingPackages = true;

    this.http
      .post(
        GlobalVars.baseUrl + "/leftPackages/bulk-tie",
        JSON.stringify(requestData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();

          if (result.status === "success") {
            const data = result.data;

            let detailsHtml = `
              <div class="text-left">
                <p><strong>Muvaffaqiyatli bog'landi!</strong></p>
                <p><strong>Jami:</strong> ${data.tied_customers} ta mijoz</p>
            `;

            if (data.details && data.details.length > 0) {
              detailsHtml += `<hr><ul class="text-left" style="max-height: 300px; overflow-y: auto;">`;
              data.details.forEach((detail: any) => {
                detailsHtml += `
                  <li>
                    <strong>K${detail.customer_id}:</strong> 
                    ${detail.total_tied_count} ta quti bog'landi
                    ${
                      detail.is_existing_group
                        ? " (mavjud guruhga)"
                        : " (yangi guruh)"
                    }
                  </li>
                `;
              });
              detailsHtml += `</ul>`;
            }

            detailsHtml += `</div>`;

            swal
              .fire({
                icon: "success",
                title: "Muvaffaqiyat!",
                html: detailsHtml,
                customClass: {
                  confirmButton: "btn btn-success",
                },
                buttonsStyling: false,
              })
              .then(() => {
                this.findPackagesToTie();
                this.loadWarehouseInventory();
              });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni bog'lashda xatolik",
              "error"
            );
          }

          this.autoTyingPackages = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            error.json()?.error || "Qutillarni bog'lashda xatolik",
            "error"
          );
          this.autoTyingPackages = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Tie packages for specific customer
  tiePackagesForCustomer(ownerId: string) {
    swal
      .fire({
        title: "Qutillarni bog'lash",
        text: `Mijoz K${ownerId} ning barcha qutilari bog'lansinmi?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ha, bog'lash",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl + "/leftPackages/tie?owner_id=" + ownerId,
              {},
              this.options
            )
            .subscribe(
              (response) => {
                const result = response.json();
                if (result.status === "success") {
                  swal.fire({
                    icon: "success",
                    title: "Bog'landi!",
                    text: result.message,
                    timer: 2000,
                    showConfirmButton: false,
                  });
                  this.findPackagesToTie();
                  this.loadWarehouseInventory();
                } else {
                  swal.fire("Xatolik", result.message, "error");
                }
              },
              (error) => {
                swal.fire("Xatolik", "Qutillarni bog'lashda xatolik", "error");
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }

  // Auto-tie all packages for the consignment
  autoTieAllPackages() {
    if (!this.selectedConsignment) {
      swal.fire("Xatolik", "Consignment nomi kiritilmagan", "error");
      return;
    }

    if (this.packagesToTie.length === 0) {
      swal.fire("Xatolik", "Bog'lash uchun qutillar yo'q", "error");
      return;
    }

    swal
      .fire({
        title: "Hammasini bog'lash",
        html: `
          <div class="text-left">
            <p><strong>${this.packagesToTie.length} ta mijoz</strong>ning qutilari avtomatik bog'lanadi.</p>
            <p>Davom ettirilsinmi?</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ha, hammasini bog'lash",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.performAutoTie();
        }
      });
  }

  // Perform auto-tie API call
  performAutoTie() {
    this.autoTyingPackages = true;

    const requestData = {
      consignment_name: this.selectedConsignment,
    };

    this.http
      .post(
        GlobalVars.baseUrl + "/leftPackages/auto-tie",
        JSON.stringify(requestData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();

          if (result.status === "success") {
            const data = result.data;

            let detailsHtml = `
              <div class="text-left">
                <p><strong>Consignment:</strong> ${data.consignment_name}</p>
                <p><strong>Jami mijozlar:</strong> ${data.total_customers} ta</p>
                <p><strong>Bog'langan:</strong> ${data.tied_customers} ta</p>
                <p><strong>Bog'lanmagan:</strong> ${data.untied_customers} ta</p>
            `;

            if (data.details && data.details.length > 0) {
              detailsHtml += `<hr><p><strong>Tafsilotlar:</strong></p>
              <ul class="text-left" style="max-height: 300px; overflow-y: auto;">`;
              data.details.forEach((detail: any) => {
                detailsHtml += `
                  <li>
                    <strong>K${detail.customer_id}:</strong> 
                    ${detail.new_packages_count} ta yangi + 
                    ${detail.total_packages_in_warehouse || 0} ta eski = 
                    ${detail.total_tied_count} ta quti bog'landi
                    ${
                      detail.is_existing_group
                        ? " (mavjud guruhga)"
                        : " (yangi guruh)"
                    }
                  </li>
                `;
              });
              detailsHtml += `</ul>`;
            }

            detailsHtml += `</div>`;

            swal
              .fire({
                icon: "success",
                title: "Muvaffaqiyat!",
                html: detailsHtml,
                customClass: {
                  confirmButton: "btn btn-success",
                },
                buttonsStyling: false,
                width: "600px",
              })
              .then(() => {
                this.findPackagesToTie();
                this.loadWarehouseInventory();
              });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni bog'lashda xatolik",
              "error"
            );
          }

          this.autoTyingPackages = false;
        },
        (error) => {
          const errorMessage =
            error.json()?.error ||
            error.json()?.message ||
            error.message ||
            "Qutillarni bog'lashda xatolik";

          swal.fire("Xatolik", errorMessage, "error");
          this.autoTyingPackages = false;

          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Untie specific package
  untiePackage(ownerId: string, consignmentName: string) {
    swal
      .fire({
        title: "Qutini ajratish",
        text: `${consignmentName} qutini bog'lanishdan chiqarishni xohlaysizmi?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, ajratish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-warning",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .get(
              GlobalVars.baseUrl +
                `/leftPackages/untie?owner_id=${ownerId}&consignment_name=${consignmentName}`,
              this.options
            )
            .subscribe(
              (response) => {
                const result = response.json();
                if (result.status === "success") {
                  swal.fire({
                    icon: "success",
                    title: "Ajratildi!",
                    text: result.message,
                    timer: 2000,
                    showConfirmButton: false,
                  });
                  this.loadWarehouseInventory();
                  if (this.selectedCustomer) {
                    const updatedCustomer = this.warehouseInventory.find(
                      (c) => c.owner_id === this.selectedCustomer.owner_id
                    );
                    if (updatedCustomer) {
                      this.selectedCustomer = updatedCustomer;
                    }
                  }
                } else {
                  swal.fire("Xatolik", result.message, "error");
                }
              },
              (error) => {
                swal.fire("Xatolik", "Qutini ajratishda xatolik", "error");
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }

  // View states management
  showAddPackageForm() {
    this.hideAllViews();
    this.showAddForm = true;
  }

  showTyingInterface() {
    this.hideAllViews();
    this.showTyingView = true;
  }

  showInventoryView() {
    this.hideAllViews();
    this.showInventory = true;
  }

  hideAllViews() {
    this.showAddForm = false;
    this.showTyingView = false;
    this.showInventory = false;
  }

  // Modal management
  viewCustomerDetails(customer: CustomerInventory) {
    this.selectedCustomer = customer;
    // console.log("selected customer ", this.selectedCustomer);

    this.showCustomerModal = true;
    document.body.style.overflow = "hidden"; // Prevent background scroll
  }

  showUntieOptions(customer: CustomerInventory) {
    this.viewCustomerDetails(customer);
  }

  closeModal() {
    this.showCustomerModal = false;
    this.selectedCustomer = null;
    document.body.style.overflow = "auto"; // Restore scroll
  }

  // Form management
  cancelAddPackage() {
    this.resetNewPackageForm();
    this.showAddForm = false;
    this.showInventoryView();
  }

  resetNewPackageForm() {
    this.newPackage = {
      owner_id: "",
      consignment_name: "",
    };
  }

  // Helper methods
  getFilteredInventory(): CustomerInventory[] {
    if (!this.filterCustomerId) {
      return this.warehouseInventory;
    }
    return this.warehouseInventory.filter((customer) =>
      customer.owner_id
        .toLowerCase()
        .includes(this.filterCustomerId.toLowerCase())
    );
  }

  getTotalPackages(): number {
    return this.warehouseInventory.reduce(
      (total, customer) => total + customer.total_packages,
      0
    );
  }

  getAllConsignments(customer: CustomerInventory): string[] {
    const consignments = new Set<string>();
    customer.package_groups.forEach((group) => {
      group.consignments.forEach((consignment) => {
        consignments.add(consignment);
      });
    });
    return Array.from(consignments);
  }

  getUniqueConsignments(packages: any[]): string[] {
    const consignments = new Set<string>();
    packages.forEach((pkg) => {
      consignments.add(pkg.consignment);
    });
    return Array.from(consignments);
  }

  countTiedPacForCus(packages: any[]): number {
    return packages.filter((g) => g.type === "tied").length;
  }

  countSinglePacForCus(packages: any[]): number {
    return packages.filter((g) => g.type === "single").length;
  }

  // Clear tying section
  clearTyingSection() {
    swal
      .fire({
        title: "Bo'limni tozalash",
        text: "Hamma ma'lumotlar o'chiriladi. Davom ettirilsinmi?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, tozalash",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-danger",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          // Clear all data
          this.packagesToTie = [];
          this.selectedConsignment = "";
          this.selectAllPackages = false;

          swal.fire({
            icon: "success",
            title: "Tozalandi!",
            text: "Bo'lim tozalandi",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      });
  }
}
