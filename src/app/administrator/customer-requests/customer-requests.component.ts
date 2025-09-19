// src/app/pages/delivery-requests/customer-delivery-request.component.ts
import { TableData } from "src/app/md/md-table/md-table.component";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from "@angular/core";
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
  packages: any[];
  total_packages: number;
  total_items: number;
  consignments: string[];
  package_barcodes: string[];
  selected?: boolean;
}

interface DeliveryRequest {
  id?: number;
  customer_id: string;
  customer_phone: string;
  delivery_type: string;
  requested_packages: string[];
  delivery_address?: string;
  emu_branch_id?: number;
  notes?: string;
  is_urgent?: boolean;
  status: string;
  created_at?: Date;
}
@Component({
  selector: "app-customer-requests",
  templateUrl: "./customer-requests.component.html",
  styleUrls: ["./customer-requests.component.css"],
})
export class CustomerRequestsComponent {
  public tableData1: TableData;
  public dataTable: TableData;

  headers12: any;
  options: any;

  // Customer data
  currentID: any;
  customerPackages: PackageGroup[];
  selectedPackages: string[];

  // Delivery request data
  deliveryType: string;
  customerPhone: string;
  deliveryAddress: string;
  selectedEMUBranch: number;
  deliveryNotes: string;
  isUrgent: boolean;

  // Data properties
  regions: any[];
  branches: any[];
  selectedRegionId: number;
  selectedBranchId: number;
  // Loading states
  loadingRegions: boolean;
  loadingBranches: boolean;

  // Customer's delivery requests
  myDeliveryRequests: DeliveryRequest[];

  // UI states
  showPackageSelection: boolean;
  showCreateForm: boolean;
  showMyRequests: boolean;

  // Loading states
  loadingPackages: boolean;
  submittingRequest: boolean;

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

    // Initialize data
    this.customerPackages = [];
    this.selectedPackages = [];
    // Initialize data
    this.regions = [];
    this.branches = [];

    this.selectedRegionId = null;
    this.selectedBranchId = null;

    this.myDeliveryRequests = [];

    // Initialize UI states
    this.showPackageSelection = false;
    this.showCreateForm = false;
    this.showMyRequests = false;

    // Initialize form data
    this.deliveryType = "Pick-up";
    this.customerPhone = "";
    this.deliveryAddress = "";
    this.selectedEMUBranch = null;
    this.deliveryNotes = "";
    this.isUrgent = false;

    // Initialize loading states
    this.loadingPackages = false;
    this.loadingBranches = false;
    this.submittingRequest = false;
  }

  ngOnInit() {
    this.dataTable = {
      headerRow: [
        "No",
        "Quti turi",
        "Qutillar soni",
        "Umumiy og'irlik",
        "Consignmentlar",
        "Tanlash",
      ],
      dataRows: [],
    };

    this.tableData1 = {
      headerRow: [
        "NO",
        "Yetkazish turi",
        "Status",
        "Qutillar soni",
        "Yaratilgan vaqt",
        "Amallar",
      ],
      dataRows: [],
    };
    this.currentID = localStorage.getItem("id");
    this.loadCustomerPackages();
    this.loadMyDeliveryRequests();
    this.loadRegions();
  }

  // Load customer packages available for delivery
  loadCustomerPackages() {
    this.loadingPackages = true;

    this.http
      .get(
        GlobalVars.baseUrl + "/deliveries/customer?owner_id=" + this.currentID,
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.customerPackages = result.data.package_groups || [];

            this.updatePackagesTable();
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni yuklashda xatolik",
              "error"
            );
          }
          this.loadingPackages = false;
        },
        (error) => {
          this.loadingPackages = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Update packages table
  updatePackagesTable() {
    this.dataTable.dataRows = [];

    this.customerPackages.forEach((group, index) => {
      const isSelected = group.selected || false;
      const selectButton = `
        <button class="btn btn-sm ${
          isSelected ? "btn-success" : "btn-primary"
        }" 
                onclick="window.selectPackageGroup(${index})">
          ${isSelected ? "✓ Tanlangan" : "Tanlash"}
        </button>
      `;

      const typeText =
        group.type === "tied"
          ? `🔗 Bog'langan (${group.total_packages} ta)`
          : "📦 Yagona quti";

      this.dataTable.dataRows.push([
        (index + 1).toString(),
        typeText,
        group.total_packages.toString(),
        group.consignments.join(", "),
        selectButton,
      ]);
    });

    // Make selectPackageGroup available globally
    (window as any).selectPackageGroup = (index: number) => {
      this.selectPackageGroup(index);
    };
  }

  // Select/deselect package group
  selectPackageGroup(index: number) {
    this.customerPackages[index].selected =
      !this.customerPackages[index].selected;
    this.updateSelectedPackages();
    this.updatePackagesTable();
  }

  // Update selected packages list
  updateSelectedPackages() {
    this.selectedPackages = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        this.selectedPackages = this.selectedPackages.concat(
          group.package_barcodes
        );
      }
    });
  }

  // Show package selection step
  showPackageSelectionStep() {
    if (this.customerPackages.length === 0) {
      swal.fire("Ma'lumot", "Sizda yetkazish uchun quti yo'q", "info");
      return;
    }
    this.showPackageSelection = true;
    this.showCreateForm = false;
    this.showMyRequests = false;
  }

  // Show create delivery request form
  showCreateRequestForm() {
    if (this.selectedPackages.length === 0) {
      swal.fire("Diqqat", "Iltimos, yetkazish uchun quti tanlang", "warning");
      return;
    }
    this.showPackageSelection = false;
    this.showCreateForm = true;
    this.showMyRequests = false;
  }

  // Show my delivery requests
  showMyRequestsList() {
    this.showPackageSelection = false;
    this.showCreateForm = false;
    this.showMyRequests = true;
    this.loadMyDeliveryRequests();
  }

  // Load all regions
  loadRegions() {
    this.loadingRegions = true;

    this.http.get(GlobalVars.baseUrl + "/regions/emu", this.options).subscribe(
      (response) => {
        const result = response.json();

        if (result.status === "success") {
          this.regions = result.data.regions || [];
          console.log("regions ", this.regions);

          console.log("Regions loaded:", this.regions);
        } else {
          swal.fire(
            "Xatolik",
            result.message || "Viloyatlarni yuklashda xatolik",
            "error"
          );
        }
        this.loadingRegions = false;
      },
      (error) => {
        swal.fire("Xatolik", "Viloyatlarni yuklashda xatolik", "error");
        this.loadingRegions = false;
        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );
  }

  // Load branches when region is selected
  onRegionSelect(regionId: number) {
    this.selectedRegionId = regionId;
    this.selectedBranchId = null; // Reset branch selection
    this.branches = []; // Clear previous branches

    if (!regionId) {
      return; // No region selected
    }

    this.loadBranches(regionId);
  }

  // Load branches for selected region
  loadBranches(regionId: number) {
    this.loadingBranches = true;

    this.http
      .get(GlobalVars.baseUrl + "/branches?region_id=" + regionId, this.options)
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.branches = result.data.branches || [];
            console.log("Branches loaded:", this.branches);
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Filiallarni yuklashda xatolik",
              "error"
            );
          }
          this.loadingBranches = false;
        },
        (error) => {
          swal.fire("Xatolik", "Filiallarni yuklashda xatolik", "error");
          this.loadingBranches = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // When branch is selected
  onBranchSelect(branchId: number) {
    this.selectedBranchId = branchId;
    // console.log("Selected branch ID:", this.selectedBranchId);
    // console.log("Selected region ID:", this.selectedRegionId);

    // Find selected branch details if needed
    const selectedBranch = this.branches.find(
      (branch) => branch.id === branchId
    );
    if (selectedBranch) {
    }
  }

  // Get selected region name
  getSelectedRegionName(): string {
    if (!this.selectedRegionId) return "";
    const region = this.regions.find(
      (r) => r.id === Number(this.selectedRegionId)
    );
    return region ? region.name : "";
  }

  // Get selected branch name
  getSelectedBranchName(): string {
    if (!this.selectedBranchId) return "";
    const branch = this.branches.find(
      (b) => b.id === Number(this.selectedBranchId)
    );

    return branch ? branch.name : "";
  }

  // Reset selections
  resetEMUSelection() {
    this.selectedRegionId = null;
    this.selectedBranchId = null;
    this.branches = [];
  }

  // Check if EMU selection is complete
  isEMUSelectionComplete(): boolean {
    if (this.selectedRegionId && this.selectedBranchId) {
      return true;
    }
    return false;
  }

  // When delivery type changes
  onDeliveryTypeChange() {
    if (this.deliveryType === "EMU") {
      // Load regions if not already loaded
      if (this.regions.length === 0) {
        this.loadRegions();
      }
    } else {
      // Reset EMU selections if delivery type changed
      this.resetEMUSelection();
    }
  }

  // Submit delivery request
  submitDeliveryRequest() {
    // Validation
    if (this.selectedPackages.length === 0) {
      swal.fire("Xatolik", "Quti tanlanmagan", "error");
      return;
    }

    if (!this.customerPhone.trim()) {
      swal.fire("Xatolik", "Telefon raqam kiritilmagan", "error");
      return;
    }

    if (this.deliveryType === "EMU" && !this.selectedBranchId) {
      swal.fire("Xatolik", "EMU filialini tanlang", "error");
      return;
    }

    if (
      (this.deliveryType === "Yandex" || this.deliveryType === "Own-Courier") &&
      !this.deliveryAddress.trim()
    ) {
      swal.fire("Xatolik", "Yetkazish manzilini kiriting", "error");
      return;
    }

    this.submittingRequest = true;

    // Prepare request data
    const requestData = {
      owner_id: this.currentID,
      customer_phone: this.customerPhone.trim(),
      delivery_type: this.deliveryType,
      package_barcodes: this.selectedPackages,
      delivery_address: this.deliveryAddress.trim() || null,
      emu_branch_id: this.selectedBranchId || null,
      notes: this.deliveryNotes.trim() || null,
      is_urgent: this.isUrgent,
    };

    this.http
      .post(
        GlobalVars.baseUrl + "/requests/create",
        JSON.stringify(requestData),
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
                text: "Yetkazish so'rovi yuborildi",
                customClass: {
                  confirmButton: "btn btn-success",
                },
                buttonsStyling: false,
              })
              .then(() => {
                this.resetForm();
                this.loadMyDeliveryRequests();
                this.showMyRequestsList();
              });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "So'rov yuborishda xatolik",
              "error"
            );
          }
          this.submittingRequest = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `So'rov yuborishda xatolik: ${
              error.json()?.error || error.message
            }`,
            "error"
          );
          this.submittingRequest = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Load my delivery requests
  loadMyDeliveryRequests() {
    this.http
      .get(
        GlobalVars.baseUrl + "/requests/customer?owner_id" + this.currentID,
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.myDeliveryRequests = result.data.requests || [];

            this.updateRequestsTable();
          }
        },
        (error) => {
          console.error("Error loading delivery requests:", error);
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Update requests table
  updateRequestsTable() {
    this.tableData1.dataRows = [];

    this.myDeliveryRequests.forEach((request, index) => {
      const statusBadge = this.getStatusBadge(request.status);
      const actionsButton =
        request.status === "pending"
          ? `<button class="btn btn-sm btn-danger" onclick="window.cancelRequest(${request.id})">Bekor qilish</button>`
          : "-";

      this.tableData1.dataRows.push([
        (index + 1).toString(),
        this.getDeliveryTypeText(request.delivery_type),
        statusBadge,
        request.requested_packages.length.toString(),
        new Date(request.created_at).toLocaleDateString("uz-UZ"),
        actionsButton,
      ]);
    });

    // Make cancelRequest available globally
    (window as any).cancelRequest = (requestId: number) => {
      this.cancelRequest(requestId);
    };
  }

  // Get status badge HTML
  getStatusBadge(status: string): string {
    const badges = {
      pending: '<span class="badge badge-warning">Kutilmoqda</span>',
      approved: '<span class="badge badge-success">Tasdiqlangan</span>',
      rejected: '<span class="badge badge-danger">Rad etilgan</span>',
      cancelled: '<span class="badge badge-secondary">Bekor qilingan</span>',
    };
    return (
      badges[status] || '<span class="badge badge-light">' + status + "</span>"
    );
  }

  // Get delivery type text
  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU Post",
      Yandex: "Yandex Yetkazish",
      "Own-Courier": "Bizning Kuryer",
      "Pick-up": "O'zim olaman",
    };
    return types[type] || type;
  }

  getStatusText(status: string) {
    if (status === "pending") {
      return "Jarayonda";
    } else if (status === "approved") {
      return "Tasdiqlandi";
    } else if (status === "rejected") {
      return "Rad Qilindi";
    } else if (status === "cancelled") {
      return "Bekor Qilindi";
    }
  }
  // Cancel delivery request
  cancelRequest(requestId: number) {
    swal
      .fire({
        title: "Ishonchingiz komilmi?",
        text: "So'rovni bekor qilmoqchimisiz?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, bekor qilish",
        cancelButtonText: "Yo'q",
        customClass: {
          confirmButton: "btn btn-danger",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .put(
              GlobalVars.baseUrl + "/requests/cancel?request_id=" + requestId,
              JSON.stringify({ owner_id: this.currentID }),
              this.options
            )
            .subscribe(
              (response) => {
                const result = response.json();
                if (result.status === "success") {
                  swal.fire({
                    icon: "success",
                    text: "So'rov bekor qilindi",
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });
                  this.loadMyDeliveryRequests();
                } else if (result.status === "error") {
                  swal.fire("Xatolik", result.message, "error");
                }
              },
              (error) => {
                const err = error.json();
                console.log(err);

                swal.fire("Xatolik", `${err.error}`, "error");
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }

  // Reset form
  resetForm() {
    this.selectedPackages = [];
    this.customerPackages.forEach((group) => (group.selected = false));
    this.deliveryType = "Pick-up";
    this.customerPhone = "";
    this.deliveryAddress = "";
    this.selectedEMUBranch = null;
    this.deliveryNotes = "";
    this.isUrgent = false;
    this.showPackageSelection = false;
    this.showCreateForm = false;
    this.updatePackagesTable();
  }

  // Go back to previous step
  goBack() {
    if (this.showCreateForm) {
      // this.showCreateRequestForm = false;
      this.showPackageSelection = true;
    } else if (this.showPackageSelection) {
      this.showPackageSelection = false;
    } else if (this.showMyRequests) {
      this.showMyRequests = false;
    }
  }
}
