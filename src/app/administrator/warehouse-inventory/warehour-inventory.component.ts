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
  showInventory: boolean = true; // Start with inventory view
  showCustomerModal: boolean = false;

  // Filter and search
  filterCustomerId: string = "";
  selectedConsignment: string = "";

  // Loading states
  loadingInventory: boolean = false;
  addingPackage: boolean = false;
  loadingPackagesToTie: boolean = false;

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

    // Add filters if present
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
                customClass: {
                  confirmButton: "btn btn-success",
                },
                buttonsStyling: false,
              })
              .then(() => {
                this.resetNewPackageForm();
                this.loadWarehouseInventory();
                this.showAddForm = false;
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
            this.packagesToTie = result.packages_to_tie || [];
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

  // Tie packages for specific customer
  tiePackagesForCustomer(ownerId: string) {
    swal
      .fire({
        title: "Qutillarni bog'lash",
        text: `Mijoz K${ownerId} IDli Mijoznning barcha qutilari bog'lansinmi?`,
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
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });
                  // Refresh data
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
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });
                  // Refresh data
                  this.loadWarehouseInventory();
                  if (this.selectedCustomer) {
                    // Update selected customer data
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
    this.showCustomerModal = true;
  }

  showUntieOptions(customer: CustomerInventory) {
    this.viewCustomerDetails(customer);
  }

  closeModal() {
    this.showCustomerModal = false;
    this.selectedCustomer = null;
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
}
