import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

@Component({
  selector: "app-oa-internal-transfers",
  templateUrl: "./internal-transfers.component.html",
  styleUrls: ["./internal-transfers.component.css"],
})
export class OaInternalTransfersComponent implements OnInit {
  transfers: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;

  filterCashAccountId = "";
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
    this.loadTransfers();
  }

  loadTransfers() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/internal-transfers?page=${this.currentPage}&size=${this.pageSize}`;
    if (this.filterCashAccountId) url += `&cash_account_id=${this.filterCashAccountId}`;
    if (this.filterStartDate) url += `&start_date=${this.filterStartDate}`;
    if (this.filterEndDate) url += `&end_date=${this.filterEndDate}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.transfers = data.transfers || [];
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

  applyFilters() { this.currentPage = 0; this.loadTransfers(); }
  clearFilters() { this.filterCashAccountId = ""; this.filterStartDate = ""; this.filterEndDate = ""; this.currentPage = 0; this.loadTransfers(); }
  onPageChanged(page: number) { this.currentPage = page; this.loadTransfers(); }

  addTransfer() {
    const today = new Date().toISOString().split("T")[0];
    const accountOpts = this.cashAccounts.map((a) => `<option value="${a.id}">${a.name} (${a.currency})</option>`).join("");

    const html = `
      <style>
        .tr-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; text-align: left; }
        .tr-form .tr-field { display: flex; flex-direction: column; }
        .tr-form .tr-field.full { grid-column: 1 / -1; }
        .tr-form .tr-lbl { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
        .tr-form .tr-lbl .req { color: #e53935; margin-left: 2px; }
        .tr-form .form-control { border-radius: 6px; border: 1.5px solid #ddd; padding: 8px 10px; font-size: 14px; transition: border-color 0.2s; }
        .tr-form .form-control:focus { border-color: #0288d1; box-shadow: 0 0 0 2px rgba(2,136,209,0.15); outline: none; }
        @media (max-width: 576px) {
          .tr-form { grid-template-columns: 1fr; gap: 10px; }
          .tr-form .form-control { font-size: 16px; padding: 10px 12px; }
        }
      </style>
      <div class="tr-form">
        <div class="tr-field">
          <span class="tr-lbl">Chiqish hisobi (dan)<span class="req">*</span></span>
          <select id="tr-from" class="form-control">${accountOpts}</select>
        </div>
        <div class="tr-field">
          <span class="tr-lbl">Kirish hisobi (ga)<span class="req">*</span></span>
          <select id="tr-to" class="form-control">${accountOpts}</select>
        </div>
        <div class="tr-field">
          <span class="tr-lbl">Summa<span class="req">*</span></span>
          <input id="tr-amount" type="number" step="0.01" class="form-control" placeholder="0.00">
        </div>
        <div class="tr-field">
          <span class="tr-lbl">Kurs (valyuta ayirboshlash)</span>
          <input id="tr-fx" type="number" step="0.01" class="form-control" placeholder="Masalan: 12800">
        </div>
        <div class="tr-field">
          <span class="tr-lbl">Sana<span class="req">*</span></span>
          <input id="tr-date" type="date" class="form-control" value="${today}">
        </div>
        <div class="tr-field">
          <span class="tr-lbl">Izoh</span>
          <input id="tr-comment" type="text" class="form-control" placeholder="Izoh...">
        </div>
      </div>`;

    swal.fire({
      title: "Yangi Transfer",
      html,
      width: "min(540px, 95vw)",
      showCancelButton: true,
      confirmButtonText: "Qo'shish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      didOpen: () => {
        this.http.get<any>(GlobalVars.baseUrl + "/fx-rate").subscribe((data) => {
          if (data.rate) {
            const fxInput = document.getElementById("tr-fx") as HTMLInputElement;
            if (fxInput && !fxInput.value) fxInput.value = String(data.rate);
          }
        });
      },
      preConfirm: () => {
        const fromId = (document.getElementById("tr-from") as HTMLSelectElement).value;
        const toId = (document.getElementById("tr-to") as HTMLSelectElement).value;
        const amount = (document.getElementById("tr-amount") as HTMLInputElement).value;
        const date = (document.getElementById("tr-date") as HTMLInputElement).value;
        if (!fromId || !toId || !amount || !date) { swal.showValidationMessage("Barcha maydonlarni to'ldiring"); return false; }
        if (fromId === toId) { swal.showValidationMessage("Bir xil hisobga transfer qilib bo'lmaydi"); return false; }
        if (parseFloat(amount) <= 0) { swal.showValidationMessage("Summa musbat bo'lishi kerak"); return false; }
        return {
          from_cash_account_id: parseInt(fromId),
          to_cash_account_id: parseInt(toId),
          amount_original: parseFloat(amount),
          fx_rate_used: parseFloat((document.getElementById("tr-fx") as HTMLInputElement).value) || null,
          transfer_at: date,
          comment: (document.getElementById("tr-comment") as HTMLInputElement).value || null,
        };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.post<any>(GlobalVars.baseUrl + "/internal-transfers", result.value, { headers: this.getHeaders() }).subscribe(
          (data) => {
            if (data.status === "ok") { this.loadTransfers(); swal.fire({ icon: "success", title: "Qo'shildi!", timer: 1500, showConfirmButton: false }); }
            else { swal.fire("Xatolik", data.error, "error"); }
          },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  deleteTransfer(id: number) {
    swal.fire({
      title: "O'chirishni tasdiqlang", icon: "warning", showCancelButton: true,
      confirmButtonText: "O'chirish", cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" }, buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete<any>(GlobalVars.baseUrl + "/internal-transfers/" + id, { headers: this.getHeaders() }).subscribe(
          () => this.loadTransfers(),
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
