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
  filterComment = "";
  filterStartDate = "";
  filterEndDate = "";

  excelLoading = false;

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
      .get<any>(GlobalVars.baseUrl + "/expense-categories?active=true", {
        headers: this.getHeaders(),
      })
      .subscribe((data) => (this.categories = data.categories || []));

    this.http
      .get<any>(GlobalVars.baseUrl + "/cash-accounts?active=true", {
        headers: this.getHeaders(),
      })
      .subscribe((data) => (this.cashAccounts = data.accounts || []));
  }

  loadExpenses() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/expenses?page=${this.currentPage}&size=${this.pageSize}`;
    if (this.filterScopeType) url += `&scope_type=${this.filterScopeType}`;
    if (this.filterCategoryId) url += `&category_id=${this.filterCategoryId}`;
    if (this.filterCashAccountId)
      url += `&cash_account_id=${this.filterCashAccountId}`;
    if (this.filterConsignment) url += `&consignment=${this.filterConsignment}`;
    if (this.filterComment)
      url += `&comment=${encodeURIComponent(this.filterComment)}`;
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
    this.filterComment = "";
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
    const today = new Date().toISOString().split("T")[0];
    const priorityNames = ["Ofis xarajatlari", "Maosh"];
    const sortedCategories = [...this.categories].sort((a, b) => {
      const aIdx = priorityNames.indexOf(a.name);
      const bIdx = priorityNames.indexOf(b.name);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
    const categoryOpts =
      `<option value="" disabled selected>-- Tanlang --</option>` +
      sortedCategories
        .map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join("");
    const accountOpts = this.cashAccounts
      .map((a) => `<option value="${a.id}">${a.name} (${a.currency})</option>`)
      .join("");

    const html = `
      <style>
        .exp-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; text-align: left; }
        .exp-form .exp-field { display: flex; flex-direction: column; }
        .exp-form .exp-field.full { grid-column: 1 / -1; }
        .exp-form .exp-lbl { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
        .exp-form .exp-lbl .req { color: #e53935; margin-left: 2px; }
        .exp-form .form-control { border-radius: 6px; border: 1.5px solid #ddd; padding: 8px 10px; font-size: 14px; transition: border-color 0.2s; }
        .exp-form .form-control:focus { border-color: #e53935; box-shadow: 0 0 0 2px rgba(229,57,53,0.15); outline: none; }
        @media (max-width: 576px) {
          .exp-form { grid-template-columns: 1fr; gap: 10px; }
          .exp-form .form-control { font-size: 16px; padding: 10px 12px; }
        }
      </style>
      <div class="exp-form">
        <div class="exp-field">
          <span class="exp-lbl">Turi<span class="req">*</span></span>
          <select id="exp-scope" class="form-control">
            <option value="OFFICE">Ofis</option>
            <option value="CONSIGNMENT">Partiya</option>
            <option value="PROJECT">Loyiha</option>
          </select>
        </div>
        <div class="exp-field" id="exp-consignment-wrap">
          <span class="exp-lbl">Partiya nomi<span class="req">*</span></span>
          <input id="exp-consignment" type="text" class="form-control" placeholder="Masalan: 25001">
        </div>
        <div class="exp-field">
          <span class="exp-lbl">Kategoriya<span class="req">*</span></span>
          <select id="exp-category" class="form-control">${categoryOpts}</select>
        </div>
        <div class="exp-field">
          <span class="exp-lbl">Hisob<span class="req">*</span></span>
          <select id="exp-account" class="form-control">${accountOpts}</select>
        </div>
        <div class="exp-field">
          <span class="exp-lbl">Summa<span class="req">*</span></span>
          <input id="exp-amount" type="text" class="form-control" placeholder="0" autocomplete="off">
        </div>
        <div class="exp-field">
          <span class="exp-lbl">Kurs (UZS uchun)</span>
          <input id="exp-fx" type="number" step="0.01" class="form-control" placeholder="Masalan: 12800">
        </div>
        <div class="exp-field">
          <span class="exp-lbl">Sana<span class="req">*</span></span>
          <input id="exp-date" type="date" class="form-control" value="${today}">
        </div>
        <div class="exp-field">
          <span class="exp-lbl">Izoh</span>
          <input id="exp-comment" type="text" class="form-control" placeholder="Izoh...">
        </div>
      </div>`;

    swal
      .fire({
        title: "Yangi Xarajat",
        html,
        width: "min(560px, 95vw)",
        showCancelButton: true,
        confirmButtonText: "Qo'shish",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        didOpen: () => {
          // Auto-fill fx rate
          this.http
            .get<any>(GlobalVars.baseUrl + "/fx-rate")
            .subscribe((data) => {
              if (data.rate) {
                const fxInput = document.getElementById(
                  "exp-fx",
                ) as HTMLInputElement;
                if (fxInput && !fxInput.value)
                  fxInput.value = String(data.rate);
              }
            });
          // Toggle consignment field visibility based on scope type
          const scopeEl = document.getElementById(
            "exp-scope",
          ) as HTMLSelectElement;
          const consWrap = document.getElementById(
            "exp-consignment-wrap",
          ) as HTMLElement;
          const toggleConsignment = () => {
            consWrap.style.display =
              scopeEl.value === "CONSIGNMENT" ? "" : "none";
          };
          scopeEl.addEventListener("change", toggleConsignment);
          toggleConsignment();
          // Live amount formatter
          const amtEl = document.getElementById(
            "exp-amount",
          ) as HTMLInputElement;
          amtEl.addEventListener("input", () => {
            const raw = amtEl.value.replace(/[^\d.]/g, "");
            const parts = raw.split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            if (parts.length > 2) parts.length = 2;
            amtEl.value = parts.join(".");
          });
        },
        preConfirm: () => {
          const scopeType = (
            document.getElementById("exp-scope") as HTMLSelectElement
          ).value;
          const consignment = (
            document.getElementById("exp-consignment") as HTMLInputElement
          ).value.trim();
          const amountRaw = (
            document.getElementById("exp-amount") as HTMLInputElement
          ).value.replace(/\s/g, "");
          const date = (document.getElementById("exp-date") as HTMLInputElement)
            .value;
          const categoryId = (
            document.getElementById("exp-category") as HTMLSelectElement
          ).value;
          const accountId = (
            document.getElementById("exp-account") as HTMLSelectElement
          ).value;
          if (!amountRaw || !date || !categoryId || !accountId) {
            swal.showValidationMessage(
              "Barcha majburiy maydonlarni to'ldiring",
            );
            return false;
          }
          if (scopeType === "CONSIGNMENT" && !consignment) {
            swal.showValidationMessage(
              "Partiya turi tanlanganda partiya nomi majburiy",
            );
            return false;
          }
          if (parseFloat(amountRaw) <= 0) {
            swal.showValidationMessage("Summa musbat bo'lishi kerak");
            return false;
          }
          return {
            scope_type: scopeType,
            consignment: consignment || null,
            category_id: parseInt(categoryId),
            cash_account_id: parseInt(accountId),
            amount_original: parseFloat(amountRaw),
            fx_rate_used:
              parseFloat(
                (document.getElementById("exp-fx") as HTMLInputElement).value,
              ) || null,
            expense_at: date,
            comment:
              (document.getElementById("exp-comment") as HTMLInputElement)
                .value || null,
          };
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          this.http
            .post<any>(GlobalVars.baseUrl + "/expenses", result.value, {
              headers: this.getHeaders(),
            })
            .subscribe(
              (data) => {
                if (data.status === "ok") {
                  this.loadExpenses();
                  swal.fire({
                    icon: "success",
                    title: "Qo'shildi!",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                } else {
                  swal.fire("Xatolik", data.error, "error");
                }
              },
              (error) =>
                swal.fire(
                  "Xatolik",
                  error.error?.error || "Xatolik yuz berdi",
                  "error",
                ),
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
        customClass: {
          confirmButton: "btn btn-danger",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .delete<any>(GlobalVars.baseUrl + "/expenses/" + id, {
              headers: this.getHeaders(),
            })
            .subscribe(
              () => this.loadExpenses(),
              (error) =>
                swal.fire(
                  "Xatolik",
                  error.error?.error || "Xatolik yuz berdi",
                  "error",
                ),
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
    const labels = {
      CONSIGNMENT: "Partiya",
      OFFICE: "Ofis",
      PROJECT: "Loyiha",
    };
    return labels[scope] || scope;
  }

  downloadExcel() {
    this.excelLoading = true;
    let url = `${GlobalVars.baseUrl}/expenses/export-excel?`;
    if (this.filterScopeType) url += `&scope_type=${this.filterScopeType}`;
    if (this.filterCategoryId) url += `&category_id=${this.filterCategoryId}`;
    if (this.filterCashAccountId)
      url += `&cash_account_id=${this.filterCashAccountId}`;
    if (this.filterConsignment) url += `&consignment=${this.filterConsignment}`;
    if (this.filterComment)
      url += `&comment=${encodeURIComponent(this.filterComment)}`;
    if (this.filterStartDate) url += `&start_date=${this.filterStartDate}`;
    if (this.filterEndDate) url += `&end_date=${this.filterEndDate}`;

    this.http
      .get(url, { headers: this.getHeaders(), responseType: "blob" })
      .subscribe(
        (blob) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `Xarajatlar_${new Date().toISOString().slice(0, 10)}.xlsx`;
          a.click();
          URL.revokeObjectURL(a.href);
          this.excelLoading = false;
        },
        (error) => {
          this.excelLoading = false;
          swal.fire(
            "Xatolik",
            "Excel yuklab olishda xatolik yuz berdi",
            "error",
          );
        },
      );
  }
}
