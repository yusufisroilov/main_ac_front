// src/app/pages/delivery-requests/admin-delivery-requests.component.ts
// src/app/pages/delivery-requests/admin-delivery-requests.component.ts
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

interface DeliveryRequest {
  id: number;
  customer_id: string;
  customer_phone: string;
  delivery_type: string;
  requested_packages: string[];
  total_packages: number;
  total_weight: number;
  delivery_address?: string;
  emu_branch_id?: number;
  notes?: string;
  is_urgent: boolean;
  status: string;
  created_at: Date;
  processed_by?: string;
  processed_at?: Date;
  rejection_reason?: string;
  admin_notes?: string;
  payment_verified: boolean;
  payment_amount: number;
  payment_notes: string;
  payment_images?: string[];
}

interface RequestPackage {
  barcode: string;
  consignment_name: string;
  items_count: number;
}
@Component({
  selector: "app-admin-request-handler",
  templateUrl: "./admin-request-handler.component.html",
  styleUrls: ["./admin-request-handler.component.css"],
})
export class AdminRequestHandlerComponent {
  public dataTable: TableData;
  public tableData1: TableData;

  headers12: any;
  options: any;

  // Data properties
  pendingRequests: DeliveryRequest[] = [];
  archivedRequets: DeliveryRequest[] = [];
  selectedRequest: DeliveryRequest | null = null;
  requestPackages: RequestPackage[] = [];

  // View control
  showArchiveTable: boolean = false;
  showPendingTable: boolean = true;

  // Filter properties
  filterDeliveryType: string = "";
  filterUrgent: string = "";
  filterCustomerId: string = "";

  // Pagination
  currentPage: number = 0;
  requestsPerPage: number = 50;
  totalRequests: number = 0;
  totalArchiveRequests: number = 0;
  totalPages: number = 0;

  // Modal states
  showRequestDetails: boolean = false;
  showApprovalForm: boolean = false;
  showRejectionForm: boolean = false;
  showFullImageModal: boolean = false;

  // Form data for approval
  deliveryFee: number = 0;
  yandexFee: number = 0;
  courierName: string = "";
  courierPhone: string = "";
  adminNotes: string = "";
  processedBy: string = "";

  // Form data for rejection
  rejectionReason: string = "";

  // Loading states
  loadingRequests: boolean = false;
  processingRequest: boolean = false;

  // Payment image properties
  paymentImageUrls: string[] = [];
  currentFullImageUrl: string = "";
  currentImageIndex: number = 0;
  paymentNotes: string = "";
  loadingPaymentImages: boolean = false;

  // EMU BRANCH BY ID
  emuBranches: any = [];
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
    this.initializeTables();
    this.loadPendingRequests();
    this.loadEmuBranches();
    this.showPendingTable = true;
    this.processedBy = localStorage.getItem("username") || "";
  }

  initializeTables() {
    this.dataTable = {
      headerRow: [
        "No",
        "Mijoz ID",
        "Telefon",
        "Yetkazish turi",
        "Qutillar",
        "Holat",
        "Vaqt",
        "Amallar",
      ],
      dataRows: [],
    };

    this.tableData1 = {
      headerRow: ["Barcode", "Consignment", "Mahsulotlar"],
      dataRows: [],
    };
  }

  // Load pending delivery requests
  loadPendingRequests() {
    this.loadingRequests = true;

    this.hideAllViews();
    let params = new HttpParams()
      .set("limit", this.requestsPerPage.toString())
      .set("offset", (this.currentPage * this.requestsPerPage).toString());

    if (this.filterDeliveryType) {
      params = params.set("delivery_type", this.filterDeliveryType);
    }
    if (this.filterUrgent) {
      params = params.set("is_urgent", this.filterUrgent);
    }
    if (this.filterCustomerId) {
      params = params.set("owner_id", this.filterCustomerId);
    }

    this.http
      .get(
        GlobalVars.baseUrl + "/requests/pending?" + params.toString(),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.pendingRequests = result.data.requests || [];
            // console.log("pending requests ", this.pendingRequests);

            this.totalRequests = result.data.pagination.total;
            this.totalPages = Math.ceil(
              this.totalRequests / this.requestsPerPage
            );
            this.updateRequestsTable();
          } else {
            swal.fire(
              "Xatolik",
              result.message || "So'rovlarni yuklashda xatolik",
              "error"
            );
          }
          this.loadingRequests = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `So'rovlarni yuklashda xatolik: ${
              error.json()?.error || error.message
            }`,
            "error"
          );
          this.loadingRequests = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }
  // Load pending delivery requests
  loadArchivedRequests() {
    this.loadingRequests = true;

    let params = new HttpParams()
      .set("limit", this.requestsPerPage.toString())
      .set("offset", (this.currentPage * this.requestsPerPage).toString());

    if (this.filterDeliveryType) {
      params = params.set("delivery_type", this.filterDeliveryType);
    }
    if (this.filterUrgent) {
      params = params.set("is_urgent", this.filterUrgent);
    }
    if (this.filterCustomerId) {
      params = params.set("owner_id", this.filterCustomerId);
    }

    this.http
      .get(
        GlobalVars.baseUrl + "/requests/archive?" + params.toString(),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.archivedRequets = result.data.requests || [];
            this.totalArchiveRequests = result.data.pagination.total;
            // console.log("Total archived requests ", this.totalArchiveRequests);

            this.totalPages = Math.ceil(
              this.totalArchiveRequests / this.requestsPerPage
            );
            this.updateRequestsTable();
          } else {
            swal.fire(
              "Xatolik",
              result.message || "So'rovlarni yuklashda xatolik",
              "error"
            );
          }
          this.loadingRequests = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `So'rovlarni yuklashda xatolik: ${
              error.json()?.error || error.message
            }`,
            "error"
          );
          this.loadingRequests = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }
  showArchiveTableView() {
    this.showArchiveTable = true;
    this.showPendingTable = false;
    this.loadArchivedRequests();
  }
  showPendingTableView() {
    this.showPendingTable = true;
    this.showArchiveTable = false;
    this.loadPendingRequests();
  }
  hideAllViews() {
    this.showArchiveTable = false;
    this.showPendingTable = false;
  }
  // Update requests table
  updateRequestsTable() {
    this.dataTable.dataRows = [];

    this.pendingRequests.forEach((request, index) => {
      const urgentBadge = request.is_urgent
        ? '<span class="badge badge-danger ml-1">Shoshilinch</span>'
        : "";

      const statusBadge = this.getStatusBadge(request.status);

      const actionsHtml = `
        <button class="btn btn-sm btn-info mr-1" onclick="window.viewRequestDetails(${
          request.id
        })">
          Ko'rish
        </button>
        ${
          request.status === "pending"
            ? `
          <button class="btn btn-sm btn-success mr-1" onclick="window.showApprovalForm(${request.id})">
            Tasdiqlash
          </button>
          <button class="btn btn-sm btn-danger" onclick="window.showRejectionForm(${request.id})">
            Rad etish
          </button>
        `
            : ""
        }
      `;

      this.dataTable.dataRows.push([
        (this.currentPage * this.requestsPerPage + index + 1).toString(),
        request.customer_id + urgentBadge,
        request.customer_phone,
        this.getDeliveryTypeText(request.delivery_type),
        request.total_packages + " ta",
        statusBadge,
        new Date(request.created_at).toLocaleDateString("uz-UZ"),
        actionsHtml,
      ]);
    });

    // Make functions available globally
    (window as any).viewRequestDetails = (requestId: number) => {
      this.viewRequestDetails(requestId);
    };
    (window as any).showApprovalForm = (requestId: number) => {
      this.showApprovalFormForRequest(requestId);
    };
    (window as any).showRejectionForm = (requestId: number) => {
      this.showRejectionFormForRequest(requestId);
    };
  }

  // View request details
  viewRequestDetails(requestId: number) {
    let request: any;
    if (this.showArchiveTable) {
      request = this.archivedRequets.find((r) => r.id === requestId);
    } else {
      request = this.pendingRequests.find((r) => r.id === requestId);
    }

    if (!request) {
      swal.fire("Xatolik", "So'rov topilmadi", "error");
      return;
    }

    this.selectedRequest = request;
    this.paymentImageUrls = [];
    this.loadRequestPackages(requestId);
    this.loadPaymentImages(requestId); // Load payment images
    this.showRequestDetails = true;
  }
  loadPaymentImages(requestId: number) {
    this.http
      .get(
        GlobalVars.baseUrl + "/requests/" + requestId + "/payment-images",
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            const images = result.data?.payment_images;
            this.paymentImageUrls = Array.isArray(images) ? images : [];
          } else {
            this.paymentImageUrls = [];
          }
          this.loadingPaymentImages = false;
        },
        (error) => {
          console.error("Error loading payment images:", error);
          this.paymentImageUrls = [];
          this.loadingPaymentImages = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  showFullImage(imageUrl: string, index: number) {
    this.currentFullImageUrl = imageUrl;
    this.currentImageIndex = index;
    this.showFullImageModal = true;
  }

  closeFullImageModal() {
    this.showFullImageModal = false;
    this.paymentImageUrls = [];
    this.currentFullImageUrl = "";
    this.currentImageIndex = 0;
  }

  nextImage() {
    if (this.currentImageIndex < this.paymentImageUrls.length - 1) {
      this.currentImageIndex++;
      this.currentFullImageUrl = this.paymentImageUrls[this.currentImageIndex];
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.currentFullImageUrl = this.paymentImageUrls[this.currentImageIndex];
    }
  }

  verifyPayment(verified: boolean) {
    if (!this.selectedRequest) return;

    swal
      .fire({
        title: verified ? "To'lovni tasdiqlash" : "To'lovni rad etish",
        text: verified
          ? "To'lov to'g'ri deb tasdiqlaysizmi?"
          : "To'lov noto'g'ri deb belgilaysizmi?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: verified ? "Ha, tasdiqlash" : "Ha, rad etish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: verified ? "btn btn-success" : "btn btn-danger",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.updatePaymentVerification(verified);
        }
      });
  }

  updatePaymentVerification(verified: boolean) {
    if (!this.selectedRequest) return;

    const updateData = {
      payment_verified: verified,
      payment_notes: this.paymentNotes.trim() || null,
    };

    // You'll need to create this endpoint in your backend
    this.http
      .put(
        GlobalVars.baseUrl +
          "/requests/" +
          this.selectedRequest.id +
          "/verify-payment",
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
              text: verified ? "To'lov tasdiqlandi" : "To'lov rad etildi",
              customClass: {
                confirmButton: "btn btn-success",
              },
              buttonsStyling: false,
            });

            // Update local request object
            this.selectedRequest.payment_verified = verified;
            if (this.paymentNotes.trim()) {
              this.selectedRequest.payment_notes = this.paymentNotes.trim();
            }

            this.paymentNotes = "";
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Xatolik yuz berdi",
              "error"
            );
          }
        },
        (error) => {
          swal.fire("Xatolik", "To'lovni tasdiqlashda xatolik", "error");
          console.error("Payment verification error:", error);
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  showPaymentNotesForm() {
    swal
      .fire({
        title: "To'lov bo'yicha izoh",
        input: "textarea",
        inputPlaceholder: "To'lov bo'yicha izohingizni kiriting...",
        inputValue: this.paymentNotes,
        showCancelButton: true,
        confirmButtonText: "Saqlash",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.paymentNotes = result.value || "";
          if (this.paymentNotes.trim()) {
            this.updatePaymentVerification(false); // Save notes without verification
          }
        }
      });
  }

  // Load packages for specific request
  loadRequestPackages(requestId: number) {
    this.http
      .get(
        GlobalVars.baseUrl + "/requests/" + requestId + "/details",
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.requestPackages = result.data.packages || [];
            // console.log("requested packages ", this.requestPackages);

            this.updatePackagesTable();
            this.loadEmuBranches();
          }
        },
        (error) => {
          console.error("Error loading request packages:", error);
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }
  loadEmuBranches() {
    this.http.get(GlobalVars.baseUrl + "/branches/all", this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "success") {
          this.emuBranches = result.data.branches || [];
        }
      },
      (error) => {
        console.error("Error loading request packages:", error);
        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );
  }

  loadBranchByid(branch_id: number) {
    const branch = this.emuBranches.find((b) => b.id === branch_id);
    return branch.name + " - " + branch.address + " - " + branch.phone;
  }

  // Update packages table for modal
  updatePackagesTable() {
    this.tableData1.dataRows = [];

    this.requestPackages.forEach((pkg) => {
      this.tableData1.dataRows.push([
        pkg.barcode,
        pkg.consignment_name,
        (pkg.items_count || 0).toString(),
      ]);
    });
  }

  // Show approval form
  showApprovalFormForRequest(requestId: number) {
    const request = this.pendingRequests.find((r) => r.id === requestId);
    if (!request) {
      swal.fire("Xatolik", "So'rov topilmadi", "error");
      return;
    }

    this.selectedRequest = request;
    this.resetApprovalForm();
    this.showApprovalForm = true;
    this.showRequestDetails = false;
  }

  // Show rejection form
  showRejectionFormForRequest(requestId: number) {
    const request = this.pendingRequests.find((r) => r.id === requestId);
    if (!request) {
      swal.fire("Xatolik", "So'rov topilmadi", "error");
      return;
    }

    this.selectedRequest = request;
    this.resetRejectionForm();
    this.showRejectionForm = true;
    this.showRequestDetails = false;
  }

  // Approve delivery request
  approveDeliveryRequest() {
    if (!this.selectedRequest) return;

    // Validation
    if (
      this.selectedRequest.delivery_type === "Own-Courier" &&
      (!this.courierName.trim() || !this.courierPhone.trim())
    ) {
      swal.fire("Xatolik", "Kuryer ma'lumotlarini to'ldiring", "error");
      return;
    }

    // Check if payment verification is required
    if (
      this.selectedRequest.payment_amount &&
      !this.selectedRequest.payment_verified
    ) {
      swal
        .fire({
          title: "To'lov tasdiqlanmagan",
          text: "To'lov hali tasdiqlanmagan. So'rovni tasdiqlashni davom ettirasizmi?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ha, davom etish",
          cancelButtonText: "Bekor qilish",
          customClass: {
            confirmButton: "btn btn-warning",
            cancelButton: "btn btn-secondary",
          },
          buttonsStyling: false,
        })
        .then((result) => {
          if (result.isConfirmed) {
            this.submitApproval();
          }
        });
    } else {
      this.submitApproval();
    }
  }

  private submitApproval() {
    if (!this.selectedRequest) return;

    this.processingRequest = true;

    const approvalData = {
      delivery_fee: this.deliveryFee || 0,
      yandex_fee: this.yandexFee || 0,
      courier_name: this.courierName.trim() || null,
      courier_phone: this.courierPhone.trim() || null,
      admin_notes: this.adminNotes.trim() || null,
      processed_by: this.processedBy.trim() || null,
      payment_verified: this.selectedRequest.payment_verified || false,
    };

    this.http
      .post(
        GlobalVars.baseUrl +
          "/requests/approve?request_id=" +
          this.selectedRequest.id,
        JSON.stringify(approvalData),
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
                text: "So'rov tasdiqlandi va yetkazish yaratildi",
                customClass: {
                  confirmButton: "btn btn-success",
                },
                buttonsStyling: false,
              })
              .then(() => {
                this.closeModal();
                this.loadPendingRequests();
              });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "So'rovni tasdiqlashda xatolik",
              "error"
            );
          }
          this.processingRequest = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `So'rovni tasdiqlashda xatolik: ${
              error.json()?.error || error.message
            }`,
            "error"
          );
          this.processingRequest = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Reject delivery request
  rejectDeliveryRequest() {
    if (!this.selectedRequest) return;

    if (!this.rejectionReason.trim()) {
      swal.fire("Xatolik", "Rad etish sababini kiriting", "error");
      return;
    }

    this.processingRequest = true;

    const rejectionData = {
      rejection_reason: this.rejectionReason.trim(),
      processed_by: this.processedBy.trim() || null,
    };

    this.http
      .post(
        GlobalVars.baseUrl +
          "/requests/reject?request_id=" +
          this.selectedRequest.id,
        JSON.stringify(rejectionData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            swal
              .fire({
                icon: "success",
                title: "Rad etildi",
                text: "So'rov rad etildi",
                customClass: {
                  confirmButton: "btn btn-success",
                },
                buttonsStyling: false,
              })
              .then(() => {
                this.closeModal();
                this.loadPendingRequests();
              });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "So'rovni rad etishda xatolik",
              "error"
            );
          }
          this.processingRequest = false;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `So'rovni rad etishda xatolik: ${
              error.json()?.error || error.message
            }`,
            "error"
          );
          this.processingRequest = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Apply filters
  applyFilters() {
    this.currentPage = 0;
    this.loadPendingRequests();
  }

  // Clear filters
  clearFilters() {
    this.filterDeliveryType = "";
    this.filterUrgent = "";
    this.filterCustomerId = "";
    this.applyFilters();
  }

  // Pagination
  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadPendingRequests();
    }
  }

  // Close all modals
  closeModal() {
    this.showRequestDetails = false;
    this.showApprovalForm = false;
    this.showRejectionForm = false;
    this.selectedRequest = null;
    this.requestPackages = [];
    this.paymentImageUrls = [];
    this.loadingPaymentImages = false;
  }

  // Reset forms
  resetApprovalForm() {
    this.deliveryFee = 0;
    this.yandexFee = 0;
    this.courierName = "";
    this.courierPhone = "";
    this.adminNotes = "";
  }

  resetRejectionForm() {
    this.rejectionReason = "";
  }

  // Helper methods
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

  getStatusText(status: string): string {
    const statuses = {
      pending: "Kutilmoqda",
      approved: "Tasdiqlangan",
      rejected: "Rad etilgan",
      cancelled: "Bekor qilingan",
    };
    return statuses[status] || status;
  }

  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU",
      Yandex: "Yandex Yetkazish",
      "Own-Courier": "Bizning Kuryer",
      "Pick-up": "O'zim olaman",
    };
    return types[type] || type;
  }
}
