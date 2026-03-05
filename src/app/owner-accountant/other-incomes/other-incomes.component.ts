import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

@Component({
  selector: "app-oa-other-incomes",
  templateUrl: "./other-incomes.component.html",
  styleUrls: ["./other-incomes.component.css"],
})
export class OaOtherIncomesComponent implements OnInit {
  incomes: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;

  filterScopeType = "";
  filterCashAccountId = "";
  filterStartDate = "";
  filterEndDate = "";

  cashAccounts: any[] = [];
  incomeCategories: any[] = [];

  constructor(private http: HttpClient, public authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.http
      .get<any>(GlobalVars.baseUrl + "/cash-accounts?active=true", { headers: this.getHeaders() })
      .subscribe((data) => (this.cashAccounts = data.accounts || []));
    this.http
      .get<any>(GlobalVars.baseUrl + "/income-categories?active=true", { headers: this.getHeaders() })
      .subscribe((data) => (this.incomeCategories = data.categories || []));
    this.loadIncomes();
  }

  loadIncomes() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/other-incomes?page=${this.currentPage}&size=${this.pageSize}`;
    if (this.filterScopeType) url += `&scope_type=${this.filterScopeType}`;
    if (this.filterCashAccountId) url += `&cash_account_id=${this.filterCashAccountId}`;
    if (this.filterStartDate) url += `&start_date=${this.filterStartDate}`;
    if (this.filterEndDate) url += `&end_date=${this.filterEndDate}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.incomes = data.incomes || [];
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

  applyFilters() { this.currentPage = 0; this.loadIncomes(); }
  clearFilters() {
    this.filterScopeType = "";
    this.filterCashAccountId = "";
    this.filterStartDate = "";
    this.filterEndDate = "";
    this.currentPage = 0;
    this.loadIncomes();
  }
  onPageChanged(page: number) { this.currentPage = page; this.loadIncomes(); }

  addIncome() {
    let html = '<div style="text-align: left;">';
    html += '<label class="swal-label">Turi</label>';
    html += '<select id="inc-scope" class="form-control mb-2"><option value="OFFICE">Ofis</option><option value="CONSIGNMENT">Partiya</option><option value="PROJECT">Loyiha</option></select>';
    html += '<label class="swal-label">Hisob</label>';
    html += `<select id="inc-account" class="form-control mb-2">${this.cashAccounts.map((a) => `<option value="${a.id}">${a.name} (${a.currency})</option>`).join("")}</select>`;
    html += '<label class="swal-label">Summa</label>';
    html += '<input id="inc-amount" type="number" step="0.01" class="form-control mb-2" placeholder="Summa">';
    html += '<label class="swal-label">Kurs (UZS uchun)</label>';
    html += '<input id="inc-fx" type="number" step="0.01" class="form-control mb-2" placeholder="Masalan: 12800">';
    html += '<label class="swal-label">Sana</label>';
    html += `<input id="inc-date" type="date" class="form-control mb-2" value="${new Date().toISOString().split("T")[0]}">`;
    html += '<label class="swal-label">Kategoriya (ixtiyoriy)</label>';
    html += `<select id="inc-category" class="form-control mb-2"><option value="">-- Tanlang --</option>${this.incomeCategories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select>`;
    html += '<label class="swal-label">Izoh</label>';
    html += '<input id="inc-comment" type="text" class="form-control mb-2" placeholder="Izoh...">';
    html += "</div>";

    swal.fire({
      title: "Yangi Daromad",
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
              const fxInput = document.getElementById("inc-fx") as HTMLInputElement;
              if (fxInput && !fxInput.value) fxInput.value = String(data.rate);
            }
          },
        );
      },
      preConfirm: () => {
        const amount = (document.getElementById("inc-amount") as HTMLInputElement).value;
        const date = (document.getElementById("inc-date") as HTMLInputElement).value;
        const accountId = (document.getElementById("inc-account") as HTMLSelectElement).value;
        if (!amount || !date || !accountId) {
          swal.showValidationMessage("Barcha majburiy maydonlarni to'ldiring");
          return false;
        }
        if (parseFloat(amount) <= 0) { swal.showValidationMessage("Summa musbat bo'lishi kerak"); return false; }
        return {
          scope_type: (document.getElementById("inc-scope") as HTMLSelectElement).value,
          cash_account_id: parseInt(accountId),
          amount_original: parseFloat(amount),
          fx_rate_used: parseFloat((document.getElementById("inc-fx") as HTMLInputElement).value) || null,
          income_at: date,
          category_id: parseInt((document.getElementById("inc-category") as HTMLSelectElement).value) || null,
          comment: (document.getElementById("inc-comment") as HTMLInputElement).value || null,
        };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.post<any>(GlobalVars.baseUrl + "/other-incomes", result.value, { headers: this.getHeaders() }).subscribe(
          (data) => {
            if (data.status === "ok") {
              this.loadIncomes();
              swal.fire({ icon: "success", title: "Qo'shildi!", timer: 1500, showConfirmButton: false });
            } else { swal.fire("Xatolik", data.error, "error"); }
          },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  deleteIncome(id: number) {
    swal.fire({
      title: "O'chirishni tasdiqlang",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "O'chirish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete<any>(GlobalVars.baseUrl + "/other-incomes/" + id, { headers: this.getHeaders() }).subscribe(
          () => this.loadIncomes(),
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  formatAmount(value: number): string {
    if (value == null) return "0";
    return Math.floor(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
}
