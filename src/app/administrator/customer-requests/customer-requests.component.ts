// Fixed customer-requests.component.ts
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
  owner_id: string;
  customer_phone: string;
  delivery_type: string;
  requested_packages: string; // This is stored as JSON string in DB
  total_packages: number;
  delivery_address?: string;
  emu_branch_id?: number;
  notes?: string;
  is_urgent?: boolean;
  status: string;
  created_at?: Date;
  payment_amount?: number;
  payment_images?: string[];
}

// Interface for image handling
interface PaymentImage {
  file: File;
  preview: string;
  name: string;
  size: number;
}

@Component({
  selector: "app-customer-requests",
  templateUrl: "./customer-requests.component.html",
  styleUrls: ["./customer-requests.component.css"],
})
export class CustomerRequestsComponent implements OnInit {
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

  // Map location feature
  addressInputType: "text" | "map" = "text"; // 'text' or 'map'
  mapLocationUrl: string;

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

  // FIXED: Payment handling
  paymentAmount: number = 0;
  selectedPaymentImages: PaymentImage[] = [];
  uploadingImages: boolean = false;
  showSendingAnimation: boolean = false;

  constructor(
    public authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    // Initialize data
    this.customerPackages = [];
    this.selectedPackages = [];
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
    this.addressInputType = "text";
    this.mapLocationUrl = "";

    // Initialize loading states
    this.loadingPackages = false;
    this.loadingRegions = false;
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
    // Show requests list by default
    this.showMyRequests = true; // ADD THIS LINE
    this.showPackageSelection = false;
    this.showCreateForm = false;
  }

  // Load customer packages available for delivery
  loadCustomerPackages() {
    this.loadingPackages = true;

    this.http
      .get(
        GlobalVars.baseUrl + "/deliveries/customer?owner_id=" + this.currentID,
        this.options,
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.customerPackages = result.data.package_groups || [];
            // console.log("Loaded customer packages:", this.customerPackages);
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni yuklashda xatolik",
              "error",
            );
          }
          this.loadingPackages = false;
        },
        (error) => {
          this.loadingPackages = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  // Select/deselect package group
  selectPackageGroup(index: number) {
    this.customerPackages[index].selected =
      !this.customerPackages[index].selected;
    this.updateSelectedPackages();
  }

  // FIXED: Update selected packages list
  updateSelectedPackages() {
    this.selectedPackages = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        // Add all barcodes from this group
        this.selectedPackages = this.selectedPackages.concat(
          group.package_barcodes,
        );
      }
    });
    // "Updated selected packages:", this.selectedPackages;
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
          // console.log("Regions loaded:", this.regions);
        } else {
          swal.fire(
            "Xatolik",
            result.message || "Viloyatlarni yuklashda xatolik",
            "error",
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
      },
    );
  }

  // Load branches when region is selected
  onRegionSelect(regionId: number) {
    this.selectedRegionId = regionId;
    this.selectedBranchId = null;
    this.branches = [];

    if (!regionId) {
      return;
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
            // console.log("Branches loaded:", this.branches);
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Filiallarni yuklashda xatolik",
              "error",
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
        },
      );
  }

  // When delivery type changes
  onDeliveryTypeChange() {
    if (this.deliveryType === "EMU") {
      if (this.regions.length === 0) {
        this.loadRegions();
      }
    } else {
      this.selectedRegionId = null;
      this.selectedBranchId = null;
      this.branches = [];
    }
  }

  // FIXED: Handle payment images selection
  onPaymentImagesSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (this.selectedPaymentImages.length + files.length > 5) {
      swal.fire("Xatolik", "Maksimal 5 ta rasm yuklash mumkin", "error");
      return;
    }

    // Validate file sizes and types
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        swal.fire(
          "Xatolik",
          `${file.name} fayli noto'g'ri formatda. Faqat rasm fayllari ruxsat etilgan.`,
          "error",
        );
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        swal.fire(
          "Xatolik",
          `${file.name} fayli juda katta (maksimal 5MB)`,
          "error",
        );
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const paymentImage: PaymentImage = {
          file: file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
        };

        this.selectedPaymentImages.push(paymentImage);
        // console.log("Added payment image:", paymentImage.name);
      };
      reader.readAsDataURL(file);
    });

    // Clear the file input
    event.target.value = "";
  }

  // Remove payment image
  removePaymentImage(index: number) {
    this.selectedPaymentImages.splice(index, 1);
    // console.log("Removed payment image at index:", index);
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // FIXED: Submit delivery request
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

    // Validate address based on input type
    if (this.deliveryType === "Yandex" || this.deliveryType === "Own-Courier") {
      if (this.addressInputType === "text" && !this.deliveryAddress.trim()) {
        swal.fire("Xatolik", "Yetkazish manzilini kiriting", "error");
        return;
      }
      if (this.addressInputType === "map" && !this.mapLocationUrl.trim()) {
        swal.fire("Xatolik", "Xarita manzilini kiriting", "error");
        return;
      }
    }

    this.submittingRequest = true;
    this.uploadingImages = true;

    // Show sending animation
    this.showSendingAnimation = true;
    // Create FormData for multipart form submission
    const formData = new FormData();

    // Add regular form fields
    formData.append("owner_id", this.currentID);
    formData.append("customer_phone", this.customerPhone.trim());
    formData.append("delivery_type", this.deliveryType);

    // FIXED: Send barcodes as JSON array string (not double-encoded)
    formData.append("package_barcodes", JSON.stringify(this.selectedPackages));

    // Send address based on input type (text or map URL)
    if (this.addressInputType === "text" && this.deliveryAddress.trim()) {
      formData.append("delivery_address", this.deliveryAddress.trim());
    } else if (this.addressInputType === "map" && this.mapLocationUrl.trim()) {
      formData.append("delivery_address", this.mapLocationUrl.trim());
    }

    if (this.selectedBranchId) {
      formData.append("emu_branch_id", this.selectedBranchId.toString());
    }

    if (this.deliveryNotes.trim()) {
      formData.append("notes", this.deliveryNotes.trim());
    }

    if (this.paymentAmount > 0) {
      formData.append("payment_amount", this.paymentAmount.toString());
    }

    formData.append("is_urgent", this.isUrgent.toString());

    // FIXED: Add payment images properly
    this.selectedPaymentImages.forEach((paymentImage, index) => {
      formData.append("payment_images", paymentImage.file);
    });

    // console.log("Submitting delivery request with:", {
    //   owner_id: this.currentID,
    //   delivery_type: this.deliveryType,
    //   package_barcodes: this.selectedPackages,
    //   payment_images_count: this.selectedPaymentImages.length,
    // });

    // Create headers for file upload (don't set Content-Type, let browser handle it)
    const headers = new Headers();
    headers.append("Authorization", localStorage.getItem("token"));

    const options = new RequestOptions({
      headers: headers,
      method: "POST",
    });

    // Submit the request
    this.http
      .post(GlobalVars.baseUrl + "/requests/create", formData, options)
      .subscribe(
        (response) => {
          const result = response.json();
          // Hide sending animation after a delay for better UX
          setTimeout(() => {
            this.showSendingAnimation = false;
            if (result.status === "success") {
              swal
                .fire({
                  icon: "success",
                  title: "Muvaffaqiyat!",
                  text: `So'rov muvaffaqiyatli yuborildi!`,
                  confirmButtonText: "Yaxshi",
                  customClass: {
                    confirmButton: "btn btn-success",
                  },
                  buttonsStyling: false,
                })
                .then(() => {
                  this.resetForm();
                  this.loadMyDeliveryRequests();
                  this.showMyRequestsList();
                  this.showSendingAnimation = false;
                });
            } else {
              swal.fire(
                "Xatolik",
                result.message || "So'rov yuborishda xatolik",
                "error",
              );
              this.showSendingAnimation = false;
            }

            this.submittingRequest = false;
            this.uploadingImages = false;
          }, 2000); // Show animation for 2 seconds minimum
        },
        (error) => {
          // console.error("Upload error:", error);
          this.showSendingAnimation = false;
          swal.fire(
            "Xatolik",
            `So'rov yuborishda xatolik: ${
              error.json()?.error || error.message
            }`,
            "error",
          );
          this.submittingRequest = false;
          this.uploadingImages = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  // FIXED: Load my delivery requests
  loadMyDeliveryRequests() {
    this.http
      .get(
        GlobalVars.baseUrl + "/requests/customer?owner_id=" + this.currentID,
        this.options,
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.myDeliveryRequests = result.data.requests || [];
            // console.log("my delivery requests ", this.myDeliveryRequests);

            // console.log("Loaded delivery requests:", this.myDeliveryRequests);
          }
        },
        (error) => {
          console.error("Error loading delivery requests:", error);
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }
  // FIXED: Get requested packages barcodes from JSON string
  getRequestedPackagesBarcodes(requestedPackagesStr: string): string[] {
    try {
      const packages = JSON.parse(requestedPackagesStr);
      return Array.isArray(packages) ? packages : [requestedPackagesStr];
    } catch {
      // Fallback for malformed JSON - return as single item
      return [requestedPackagesStr];
    }
  }

  // Helper method to display barcodes as comma-separated string
  getRequestedPackagesDisplay(requestedPackagesStr: string): string {
    const barcodes = this.getRequestedPackagesBarcodes(requestedPackagesStr);
    return barcodes.join(", ");
  }

  // Get delivery type text
  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU",
      Yandex: "Yandex Yetkazish",
      "Own-Courier": "Bizning Kuryer",
      "Pick-up": "O'zim olaman",
    };
    return types[type] || type;
  }

  // Get status text
  getStatusText(status: string): string {
    const statuses = {
      pending: "Jarayonda",
      approved: "Tasdiqlandi",
      rejected: "Rad Qilindi",
      cancelled: "Bekor Qilindi",
    };
    return statuses[status] || status;
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
              this.options,
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
                } else {
                  swal.fire("Xatolik", result.message, "error");
                }
              },
              (error) => {
                const err = error.json();
                swal.fire("Xatolik", `${err.error}`, "error");
                if (error.status == 403) {
                  this.authService.logout();
                }
              },
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
    this.mapLocationUrl = "";
    this.addressInputType = "text";
    this.selectedEMUBranch = null;
    this.deliveryNotes = "";
    this.isUrgent = false;
    this.paymentAmount = 0;
    this.selectedPaymentImages = [];
    this.showPackageSelection = false;
    this.showCreateForm = false;
  }

  // Go back to previous step
  goBack() {
    if (this.showCreateForm) {
      this.showCreateForm = false;
      this.showPackageSelection = true;
    } else if (this.showPackageSelection) {
      this.showPackageSelection = false;
    } else if (this.showMyRequests) {
      this.showMyRequests = false;
    }
  }
}
