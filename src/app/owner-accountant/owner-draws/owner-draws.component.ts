import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

@Component({
  selector: "app-oa-owner-draws",
  templateUrl: "./owner-draws.component.html",
  styleUrls: ["./owner-draws.component.css"],
})
export class OaOwnerDrawsComponent implements OnInit {
  draws: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;

  filterPurpose = "";
  filterStartDate = "";
  filterEndDate = "";

  cashAccounts: any[] = [];

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
    this.loadDraws();
  }

  loadDraws() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/owner-draws?page=${this.currentPage}&size=${this.pageSize}`;
    if (this.filterPurpose) url += `&purpose=${this.filterPurpose}`;
    if (this.filterStartDate) url += `&start_date=${this.filterStartDate}`;
    if (this.filterEndDate) url += `&end_date=${this.filterEndDate}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.draws = data.draws || [];
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

  applyFilters() { this.currentPage = 0; this.loadDraws(); }
  clearFilters() { this.filterPurpose = ""; this.filterStartDate = ""; this.filterEndDate = ""; this.currentPage = 0; this.loadDraws(); }
  onPageChanged(page: number) { this.currentPage = page; this.loadDraws(); }

  getPurposeLabel(p: string): string {
    const labels = { PERSONAL: "Shaxsiy", INVESTMENT: "Investitsiya", LOAN_TO_OWNER: "Qarz" };
    return labels[p] || p;
  }

  addDraw() {
    const today = new Date().toISOString().split("T")[0];
    const accountOpts = this.cashAccounts.map((a) => `<option value="${a.id}">${a.name} (${a.currency})</option>`).join("");
    const accountsData = this.cashAccounts.map((a) => ({ id: a.id, currency: a.currency }));

    const html = `
      <style>
        .od-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; text-align: left; }
        .od-form .od-field { display: flex; flex-direction: column; }
        .od-form .od-field.full { grid-column: 1 / -1; }
        .od-form .od-lbl { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
        .od-form .od-lbl .req { color: #e53935; margin-left: 2px; }
        .od-form .form-control { border-radius: 6px; border: 1.5px solid #ddd; padding: 8px 10px; font-size: 14px; transition: border-color 0.2s; }
        .od-form .form-control:focus { border-color: #7b1fa2; box-shadow: 0 0 0 2px rgba(123,31,162,0.15); outline: none; }
        @media (max-width: 576px) {
          .od-form { grid-template-columns: 1fr; gap: 10px; }
          .od-form .form-control { font-size: 16px; padding: 10px 12px; }
        }
      </style>
      <div class="od-form">
        <div class="od-field full">
          <span class="od-lbl">Hisob<span class="req">*</span></span>
          <select id="od-account" class="form-control">${accountOpts}</select>
        </div>
        <div class="od-field">
          <span class="od-lbl">Summa<span class="req">*</span></span>
          <input id="od-amount" type="number" step="0.01" class="form-control" placeholder="0.00">
        </div>
        <div class="od-field" id="od-rate-wrap">
          <span class="od-lbl">Kurs (1 USD = ? UZS)</span>
          <input id="od-rate" type="number" step="0.01" class="form-control" placeholder="Masalan: 12800">
        </div>
        <div class="od-field">
          <span class="od-lbl">Maqsad<span class="req">*</span></span>
          <select id="od-purpose" class="form-control">
            <option value="PERSONAL">Shaxsiy</option>
            <option value="INVESTMENT">Investitsiya</option>
            <option value="LOAN_TO_OWNER">Qarz</option>
          </select>
        </div>
        <div class="od-field">
          <span class="od-lbl">Sana<span class="req">*</span></span>
          <input id="od-date" type="date" class="form-control" value="${today}">
        </div>
        <div class="od-field full">
          <span class="od-lbl">Izoh</span>
          <input id="od-comment" type="text" class="form-control" placeholder="Izoh...">
        </div>
      </div>`;

    swal.fire({
      title: "Yangi Owner Draw",
      html,
      width: "min(540px, 95vw)",
      showCancelButton: true,
      confirmButtonText: "Qo'shish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      didOpen: () => {
        // Auto-fill fx rate
        this.http.get<any>(GlobalVars.baseUrl + "/fx-rate").subscribe((data) => {
          if (data.rate) {
            const rateInput = document.getElementById("od-rate") as HTMLInputElement;
            if (rateInput && !rateInput.value) rateInput.value = String(data.rate);
          }
        });
        // Toggle rate field visibility based on account currency
        const accountEl = document.getElementById("od-account") as HTMLSelectElement;
        const rateWrap = document.getElementById("od-rate-wrap") as HTMLElement;
        const toggleRate = () => {
          const sel = accountsData.find((a) => a.id === parseInt(accountEl.value));
          rateWrap.style.display = sel && sel.currency === "UZS" ? "" : "none";
        };
        accountEl.addEventListener("change", toggleRate);
        toggleRate();
      },
      preConfirm: () => {
        const amount = (document.getElementById("od-amount") as HTMLInputElement).value;
        const date = (document.getElementById("od-date") as HTMLInputElement).value;
        const accountId = (document.getElementById("od-account") as HTMLSelectElement).value;
        const fxRate = (document.getElementById("od-rate") as HTMLInputElement)?.value;
        if (!amount || !date || !accountId) { swal.showValidationMessage("Barcha majburiy maydonlarni to'ldiring"); return false; }
        if (parseFloat(amount) <= 0) { swal.showValidationMessage("Summa musbat bo'lishi kerak"); return false; }
        const selectedAcc = accountsData.find((a) => a.id === parseInt(accountId));
        if (selectedAcc?.currency === "UZS" && (!fxRate || parseFloat(fxRate) <= 0)) { swal.showValidationMessage("UZS hisob uchun kursni kiriting"); return false; }
        const payload: any = {
          cash_account_id: parseInt(accountId),
          amount: parseFloat(amount),
          draw_at: date,
          purpose: (document.getElementById("od-purpose") as HTMLSelectElement).value,
          comment: (document.getElementById("od-comment") as HTMLInputElement).value || null,
        };
        if (fxRate && parseFloat(fxRate) > 0) payload.fx_rate_used = parseFloat(fxRate);
        return payload;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.post<any>(GlobalVars.baseUrl + "/owner-draws", result.value, { headers: this.getHeaders() }).subscribe(
          (data) => {
            if (data.status === "ok") { this.loadDraws(); swal.fire({ icon: "success", title: "Qo'shildi!", timer: 1500, showConfirmButton: false }); }
            else { swal.fire("Xatolik", data.error, "error"); }
          },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  deleteDraw(id: number) {
    swal.fire({
      title: "O'chirishni tasdiqlang", icon: "warning", showCancelButton: true,
      confirmButtonText: "O'chirish", cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" }, buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete<any>(GlobalVars.baseUrl + "/owner-draws/" + id, { headers: this.getHeaders() }).subscribe(
          () => this.loadDraws(),
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
