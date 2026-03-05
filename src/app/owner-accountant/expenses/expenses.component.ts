import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

@Component({
  selector: "app-oa-expenses",
  templateUrl: "./expenses.component.html",
  styleUrls: ["./expenses.component.css"],
})
export class OaExpensesComponent implements OnInit {
  expenses: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;

  // Filters
  filterScopeType = "";
  filterCategoryId = "";
  filterCashAccountId = "";
  filterConsignment = "";
  filterStartDate = "";
  filterEndDate = "";

  // Lookups
  categories: any[] = [];
  cashAccounts: any[] = [];

  constructor(
    private http: HttpClient,
    public authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.loadLookups();
    this.loadExpenses();
  }

  loadLookups() {
    this.http
      .get<any>(GlobalVars.baseUrl + "/expense-categories?active=true", { headers: this.getHeaders() })
      .subscribe((data) => (this.categories = data.categories || []));

    this.http
      .get<any>(GlobalVars.baseUrl + "/cash-accounts?active=true", { headers: this.getHeaders() })
      .subscribe((data) => (this.cashAccounts = data.accounts || []));
  }

  loadExpenses() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/expenses?page=${this.currentPage}&size=${this.pageSize}`;
    if (this.filterScopeType) url += `&scope_type=${this.filterScopeType}`;
    if (this.filterCategoryId) url += `&category_id=${this.filterCategoryId}`;
    if (this.filterCashAccountId) url += `&cash_account_id=${this.filterCashAccountId}`;
    if (this.filterConsignment) url += `&consignment=${this.filterConsignment}`;
    if (this.filterStartDate) url += `&start_date=${this.filterStartDate}`;
    if (this.filterEndDate) url += `&end_date=${this.filterEndDate}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.expenses = data.expenses || [];
        this.totalItems = data.totalItems || 0;
        this.totalPages = data.totalPages || 0;
        this.currentPage = data.currentPage || 0;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        if (error.status === 403) this.authService.logout();
      },
    );
  }

  applyFilters() {
    this.currentPage = 0;
    this.loadExpenses();
  }

  clearFilters() {
    this.filterScopeType = "";
    this.filterCategoryId = "";
    this.filterCashAccountId = "";
    this.filterConsignment = "";
    this.filterStartDate = "";
    this.filterEndDate = "";
    this.currentPage = 0;
    this.loadExpenses();
  }

  onPageChanged(page: number) {
    this.currentPage = page;
    this.loadExpenses();
  }

  addExpense() {
    let html = '<div style="text-align: left;">';
    html += '<label class="swal-label">Turi</label>';
    html += '<select id="exp-scope" class="form-control mb-2"><option value="CONSIGNMENT">Partiya</option><option value="OFFICE">Ofis</option><option value="OWNER">Egasi</option><option value="PROJECT">Loyiha</option></select>';
    html += '<label class="swal-label">Partiya (ixtiyoriy)</label>';
    html += '<input id="exp-consignment" type="text" class="form-control mb-2" placeholder="Masalan: 25001">';
    html += '<label class="swal-label">Kategoriya</label>';
    html += `<select id="exp-category" class="form-control mb-2">${this.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select>`;
    html += '<label class="swal-label">Hisob</label>';
    html += `<select id="exp-account" class="form-control mb-2">${this.cashAccounts.map((a) => `<option value="${a.id}">${a.name} (${a.currency})</option>`).join("")}</select>`;
    html += '<label class="swal-label">Summa</label>';
    html += '<input id="exp-amount" type="number" step="0.01" class="form-control mb-2" placeholder="Summa">';
    html += '<label class="swal-label">Kurs (UZS uchun)</label>';
    html += '<input id="exp-fx" type="number" step="0.01" class="form-control mb-2" placeholder="Masalan: 12800">';
    html += '<label class="swal-label">Sana</label>';
    html += `<input id="exp-date" type="date" class="form-control mb-2" value="${new Date().toISOString().split("T")[0]}">`;
    html += '<label class="swal-label">Izoh</label>';
    html += '<input id="exp-comment" type="text" class="form-control mb-2" placeholder="Izoh...">';
    html += "</div>";

    swal
      .fire({
        title: "Yangi Xarajat",
        html,
        showCancelButton: true,
        confirmButtonText: "Qo'shish",
        cancelButtonText: "Bekor",
        customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
        buttonsStyling: false,
        didOpen: () => {
          this.http.get<any>(GlobalVars.baseUrl + "/fx-rate").subscribe(
            (data) => {
              if (data.rate) {
                const fxInput = document.getElementById("exp-fx") as HTMLInputElement;
                if (fxInput && !fxInput.value) fxInput.value = String(data.rate);
              }
            },
          );
        },
        preConfirm: () => {
          const amount = (document.getElementById("exp-amount") as HTMLInputElement).value;
          const date = (document.getElementById("exp-date") as HTMLInputElement).value;
          const categoryId = (document.getElementById("exp-category") as HTMLSelectElement).value;
          const accountId = (document.getElementById("exp-account") as HTMLSelectElement).value;
          if (!amount || !date || !categoryId || !accountId) {
            swal.showValidationMessage("Barcha majburiy maydonlarni to'ldiring");
            return false;
          }
          if (parseFloat(amount) <= 0) {
            swal.showValidationMessage("Summa musbat bo'lishi kerak");
            return false;
          }
          return {
            scope_type: (document.getElementById("exp-scope") as HTMLSelectElement).value,
            consignment: (document.getElementById("exp-consignment") as HTMLInputElement).value || null,
            category_id: parseInt(categoryId),
            cash_account_id: parseInt(accountId),
            amount_original: parseFloat(amount),
            fx_rate_used: parseFloat((document.getElementById("exp-fx") as HTMLInputElement).value) || null,
            expense_at: date,
            comment: (document.getElementById("exp-comment") as HTMLInputElement).value || null,
          };
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          this.http
            .post<any>(GlobalVars.baseUrl + "/expenses", result.value, { headers: this.getHeaders() })
            .subscribe(
              (data) => {
                if (data.status === "ok") {
                  this.loadExpenses();
                  swal.fire({ icon: "success", title: "Qo'shildi!", timer: 1500, showConfirmButton: false });
                } else {
                  swal.fire("Xatolik", data.error, "error");
                }
              },
              (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
            );
        }
      });
  }

  deleteExpense(id: number) {
    swal
      .fire({
        title: "O'chirishni tasdiqlang",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "O'chirish",
        cancelButtonText: "Bekor",
        customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .delete<any>(GlobalVars.baseUrl + "/expenses/" + id, { headers: this.getHeaders() })
            .subscribe(
              () => this.loadExpenses(),
              (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
            );
        }
      });
  }

  formatAmount(value: number): string {
    if (value == null) return "0";
    return Math.floor(Math.abs(value))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  getScopeLabel(scope: string): string {
    const labels = { CONSIGNMENT: "Partiya", OFFICE: "Ofis", OWNER: "Egasi", PROJECT: "Loyiha" };
    return labels[scope] || scope;
  }
}
