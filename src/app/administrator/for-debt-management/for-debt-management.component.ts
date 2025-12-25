import { Component, OnInit } from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

declare var $: any;

interface Finance {
  id: number;
  owner_id: number;
  consignment: string;
  for_debt: number;
  created_date: string;
  owner?: {
    id: number;
    username: string;
    telegramId: string;
  };
}

@Component({
  selector: "app-for-debt-management",
  templateUrl: "./for-debt-management.component.html",
  styleUrls: ["./for-debt-management.component.css"],
})
export class ForDebtManagementComponent implements OnInit {
  // HTTP options
  headers: any;
  options: any;

  // Data
  finances: Finance[] = [];

  // Pagination
  currentPage: number = 0;
  pageSize: number = 50;
  totalItems: number = 0;
  totalPages: number = 0;

  // Totals
  totalForDebtUZS: number = 0;

  // Filters
  searchOwnerId: string = "";
  filterStartDate: string = "";
  filterEndDate: string = "";
  sortOrder: string = "DESC"; // DESC = highest first, ASC = lowest first

  // Loading states
  loadingFinances: boolean = false;

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.headers = new Headers({ "Content-Type": "application/json" });
    this.headers.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers });
  }

  ngOnInit() {
    this.loadFinancesWithForDebt();
  }

  // Load finances with for_debt > 0
  loadFinancesWithForDebt() {
    this.loadingFinances = true;

    let url = `${GlobalVars.baseUrl}/finance/list-for-debt?page=${this.currentPage}&size=${this.pageSize}&sort_order=${this.sortOrder}`;

    // Add filters if provided
    if (this.searchOwnerId) {
      url += `&ownerId=${this.searchOwnerId}`;
    }
    if (this.filterStartDate) {
      url += `&start_date=${this.filterStartDate}`;
    }
    if (this.filterEndDate) {
      url += `&end_date=${this.filterEndDate}`;
    }

    this.http.get(url, this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "ok") {
          this.finances = result.finances || [];
          // console.log("finance for debt ", this.finances);

          this.totalItems = result.totalItems || 0;
          this.totalPages = result.totalPages || 0;
          this.totalForDebtUZS = result.totalForDebtUZS || 0;
        } else {
          swal.fire(
            "Xatolik",
            result.message || "Ma'lumotlarni yuklashda xatolik",
            "error"
          );
        }
        this.loadingFinances = false;
      },
      (error) => {
        this.loadingFinances = false;
        if (error.status === 403) {
          this.authService.logout();
        } else {
          swal.fire("Xatolik", "Serverda xatolik yuz berdi", "error");
        }
      }
    );
  }

  // Apply filters
  applyFilters() {
    this.currentPage = 0;
    this.loadFinancesWithForDebt();
  }

  // Clear filters
  clearFilters() {
    this.searchOwnerId = "";
    this.filterStartDate = "";
    this.filterEndDate = "";
    this.sortOrder = "DESC";
    this.currentPage = 0;
    this.loadFinancesWithForDebt();
  }

  // Toggle sort order
  toggleSortOrder() {
    this.sortOrder = this.sortOrder === "DESC" ? "ASC" : "DESC";
    this.loadFinancesWithForDebt();
  }

  // Pagination
  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadFinancesWithForDebt();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadFinancesWithForDebt();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadFinancesWithForDebt();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPages = Math.min(5, this.totalPages);
    let startPage = Math.max(0, this.currentPage - 2);
    let endPage = Math.min(this.totalPages - 1, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Add payment using SweetAlert (like InfoeachclientComponent)
  addPaymentForDebt(finance: Finance) {
    swal
      .fire({
        title: `K${finance.owner_id} - ${finance.consignment}`,
        html:
          '<div class="form-group">' +
          `<p style="color: #d32f2f; font-weight: 600; font-size: 16px; margin-bottom: 15px;">Qarz: ${this.formatCurrency(
            finance.for_debt
          )} so'm</p>` +
          '<input id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORda berdi" />' +
          '<input id="input-cash" type="text" class="form-control m-2" placeholder="NAQD PUL BERDI" />' +
          '<input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIKDA BERDI" />' +
          '<input id="input-bank-acc" type="text" class="form-control m-2" placeholder="Terminalda (Uzum/PayMe QR) BERDI" />' +
          '<input id="input-izoh" type="text" class="form-control m-2" placeholder="IZOH" />' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "TO'LOV QO'SHISH",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: () => {
          let usd = $("#input-usd").val();
          let cash = $("#input-cash").val();
          let card = $("#input-card").val();
          let bankacc = $("#input-bank-acc").val();
          let izohh = $("#input-izoh").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/finance/pay-for-debt?id=" +
                finance.id +
                "&name=" +
                finance.consignment +
                "&plastic=" +
                card +
                "&usd=" +
                usd +
                "&cash=" +
                cash +
                "&bank_account=" +
                bankacc +
                "&comment=" +
                encodeURIComponent(izohh),
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  swal
                    .fire("Xatolik", response.json().message, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  this.loadFinancesWithForDebt();
                  return false;
                }
              },
              (error) => {
                if (error.status == 400) {
                  swal
                    .fire("Xatolik", `${error.json().message}`, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: "TO'LOV MUVAFFAQIYATLI QO'SHILDI!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  // Helper: Format currency
  formatCurrency(value: number): string {
    return value.toLocaleString("uz-UZ");
  }

  // Helper: Format date
  formatDate(dateString: string): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ");
  }
}
