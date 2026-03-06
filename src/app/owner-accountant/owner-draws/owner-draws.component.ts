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
    const accountsJson = JSON.stringify(this.cashAccounts.map((a) => ({ id: a.id, currency: a.currency })));
    let html = '<div style="text-align: left;">';
    html += '<label class="swal-label">Hisob</label>';
    html += `<select id="od-account" class="form-control mb-2" onchange="(function(el){var accs=${accountsJson};var sel=accs.find(function(a){return a.id==parseInt(el.value)});var rateEl=document.getElementById('od-rate-wrap');if(rateEl)rateEl.style.display=sel&&sel.currency==='UZS'?'block':'none';})(this)">${this.cashAccounts.map((a) => `<option value="${a.id}">${a.name} (${a.currency})</option>`).join("")}</select>`;
    const firstIsUzs = this.cashAccounts.length > 0 && this.cashAccounts[0].currency === "UZS";
    html += `<div id="od-rate-wrap" style="display:${firstIsUzs ? "block" : "none"}">`;
    html += '<label class="swal-label">Kurs (1 USD = ? UZS)</label>';
    html += '<input id="od-rate" type="number" step="0.01" class="form-control mb-2" placeholder="Masalan: 12800">';
    html += "</div>";
    html += '<label class="swal-label">Summa</label>';
    html += '<input id="od-amount" type="number" step="0.01" class="form-control mb-2" placeholder="Summa">';
    html += '<label class="swal-label">Maqsad</label>';
    html += '<select id="od-purpose" class="form-control mb-2"><option value="PERSONAL">Shaxsiy</option><option value="INVESTMENT">Investitsiya</option><option value="LOAN_TO_OWNER">Qarz</option></select>';
    html += '<label class="swal-label">Sana</label>';
    html += `<input id="od-date" type="date" class="form-control mb-2" value="${new Date().toISOString().split("T")[0]}">`;
    html += '<label class="swal-label">Izoh</label>';
    html += '<input id="od-comment" type="text" class="form-control mb-2" placeholder="Izoh...">';
    html += "</div>";

    swal.fire({
      title: "Yangi Owner Draw",
      html,
      showCancelButton: true,
      confirmButtonText: "Qo'shish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      preConfirm: () => {
        const amount = (document.getElementById("od-amount") as HTMLInputElement).value;
        const date = (document.getElementById("od-date") as HTMLInputElement).value;
        const accountId = (document.getElementById("od-account") as HTMLSelectElement).value;
        const fxRate = (document.getElementById("od-rate") as HTMLInputElement)?.value;
        if (!amount || !date || !accountId) { swal.showValidationMessage("Barcha majburiy maydonlarni to'ldiring"); return false; }
        if (parseFloat(amount) <= 0) { swal.showValidationMessage("Summa musbat bo'lishi kerak"); return false; }
        const selectedAcc = this.cashAccounts.find((a) => a.id === parseInt(accountId));
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
