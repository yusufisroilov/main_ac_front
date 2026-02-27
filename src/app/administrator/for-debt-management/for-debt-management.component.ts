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

  // Cash accounts (dynamic from FinTrack)
  cashAccounts: any[] = [];

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
    this.loadCashAccounts();
    this.loadFinancesWithForDebt();
  }

  loadCashAccounts() {
    this.http
      .get(GlobalVars.baseUrl + "/finance-v2/cash-accounts", this.options)
      .subscribe(
        (res) => {
          const data = res.json();
          this.cashAccounts = data.accounts || [];
        },
        (error) => {
          console.error("Failed to load cash accounts:", error);
        },
      );
  }

  buildPaymentFieldsHtml(): string {
    let html = '<div class="form-group">';
    for (const acc of this.cashAccounts) {
      html +=
        `<input id="input-acc-${acc.id}" type="number" class="form-control m-2" placeholder="${acc.name} (${acc.currency})" />`;
    }
    html +=
      '<input id="input-izoh" type="text" class="form-control m-2" placeholder="IZOH" />';
    html += "</div>";
    return html;
  }

  getPaymentMethod(type: string, currency: string): string {
    if (type === "CASH" && currency === "USD") return "USD_CASH";
    if (type === "CASH" && currency === "UZS") return "UZS_CASH";
    if (type === "CARD") return "PLASTIC";
    if (type === "BANK") return "BANK";
    return "UZS_CASH";
  }

  buildPaymentsFromDialog(): any[] {
    const payments = [];
    for (const acc of this.cashAccounts) {
      const el = document.getElementById(
        `input-acc-${acc.id}`,
      ) as HTMLInputElement;
      const val = parseFloat(el?.value) || 0;
      if (val > 0) {
        payments.push({
          method: this.getPaymentMethod(acc.type, acc.currency),
          currency: acc.currency,
          amount_original: val,
          cash_account_id: acc.id,
          cash_account_name: acc.name,
        });
      }
    }
    return payments;
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

  // Add payment using SweetAlert with dynamic cash accounts + /finance-v2/pay
  addPaymentForDebt(finance: Finance) {
    swal
      .fire({
        title: `K${finance.owner_id} - ${finance.consignment}`,
        html:
          `<p style="color: #d32f2f; font-weight: 600; font-size: 16px; margin-bottom: 15px;">Nasiya: ${this.formatCurrency(
            finance.for_debt
          )} so'm</p>` +
          this.buildPaymentFieldsHtml(),
        showCancelButton: true,
        confirmButtonText: "TO'LOV QO'SHISH",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const payments = this.buildPaymentsFromDialog();
          const izoh = ($("#input-izoh").val() as string) || "";

          if (payments.length === 0) {
            swal.showValidationMessage("Kamida bitta to'lov kiriting");
            return false;
          }

          return this.http
            .post(
              GlobalVars.baseUrl + "/finance-v2/pay",
              JSON.stringify({
                finance_id: finance.id,
                payments,
                comment: izoh,
              }),
              this.options,
            )
            .toPromise()
            .then((response) => {
              const result = response.json();
              if (result.status === "error") {
                swal.showValidationMessage(result.message);
                return false;
              }
              this.loadFinancesWithForDebt();
              return true;
            })
            .catch((error) => {
              const msg = error.json
                ? error.json().message
                : "To'lovda xatolik";
              swal.showValidationMessage(msg);
              return false;
            });
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
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
    if (value == null) return "0";
    const intPart = Math.floor(Math.abs(value));
    const formatted = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return value < 0 ? "-" + formatted : formatted;
  }

  // Helper: Format date
  formatDate(dateString: string): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ");
  }
}
