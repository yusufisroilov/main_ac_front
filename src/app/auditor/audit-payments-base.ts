import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

export abstract class AuditPaymentsBase {
  payments: any[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 50;
  totalItems = 0;
  totalPages = 0;

  filterStartDate = "";
  filterEndDate = "";
  filterCashAccountId = "";
  filterCustomerId = "";

  cashAccounts: any[] = [];

  abstract auditStatus: string;
  abstract statusLabel: string;

  constructor(protected http: HttpClient, public authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  init() {
    this.http
      .get<any>(GlobalVars.baseUrl + "/cash-accounts?active=true", { headers: this.getHeaders() })
      .subscribe((data) => (this.cashAccounts = data.accounts || []));
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    let url = `${GlobalVars.baseUrl}/audit/payments?audit_status=${this.auditStatus}&page=${this.currentPage}&size=${this.pageSize}`;
    if (this.filterStartDate) url += `&start_date=${this.filterStartDate}`;
    if (this.filterEndDate) url += `&end_date=${this.filterEndDate}`;
    if (this.filterCashAccountId) url += `&cash_account_id=${this.filterCashAccountId}`;
    if (this.filterCustomerId) url += `&customer_id=${this.filterCustomerId}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe(
      (data) => {
        this.payments = data.payments || [];
        this.totalItems = data.totalItems || 0;
        this.totalPages = data.totalPages || 0;
        this.currentPage = data.currentPage || 0;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        if (error.status === 401) this.authService.logout();
      },
    );
  }

  applyFilters() { this.currentPage = 0; this.loadPayments(); }
  clearFilters() { this.filterStartDate = ""; this.filterEndDate = ""; this.filterCashAccountId = ""; this.filterCustomerId = ""; this.currentPage = 0; this.loadPayments(); }
  onPageChanged(page: number) { this.currentPage = page; this.loadPayments(); }

  // Excel export — respects the same filters as the on-screen list. Fetched as
  // a blob (not a plain <a> download) so we can send the JWT in the header,
  // matching how every other authenticated call in the app works.
  downloadExcel() {
    let url = `${GlobalVars.baseUrl}/audit/payments/export.xlsx?audit_status=${this.auditStatus}`;
    if (this.filterStartDate) url += `&start_date=${this.filterStartDate}`;
    if (this.filterEndDate) url += `&end_date=${this.filterEndDate}`;
    if (this.filterCashAccountId) url += `&cash_account_id=${this.filterCashAccountId}`;
    if (this.filterCustomerId) url += `&customer_id=${this.filterCustomerId}`;

    this.http
      .get(url, {
        headers: new HttpHeaders({ Authorization: localStorage.getItem("token") || "" }),
        responseType: "blob",
      })
      .subscribe(
        (blob: Blob) => {
          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          const today = new Date().toISOString().slice(0, 10);
          a.href = objectUrl;
          a.download = `payments_${this.auditStatus.toLowerCase()}_${today}.xlsx`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(objectUrl);
        },
        (error) => {
          if (error.status === 401) this.authService.logout();
          else swal.fire("Xatolik", "Excel yuklab olishda xatolik", "error");
        },
      );
  }

  // For bulk payments (finance_id is null on the backend row) the API returns
  // bulk_consignments — the list of consignments the payment actually covered,
  // pulled from ledger_v2. Fall back to "BULK" if that list is empty.
  getPartiya(p: any): string {
    if (p.finance?.consignment) return p.finance.consignment;
    if (p.bulk_consignments && p.bulk_consignments.length) return p.bulk_consignments.join(", ");
    return "BULK";
  }

  changeStatus(paymentId: number, newStatus: string) {
    const labels: any = { PENDING: "PENDING", APPROVED: "APPROVED", SUSPICIOUS: "SUSPICIOUS", REJECTED: "REJECTED" };
    swal.fire({
      title: `Statusni "${labels[newStatus]}" ga o'zgartirish`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ha",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.http
          .patch<any>(`${GlobalVars.baseUrl}/audit/payments/${paymentId}/status`, { audit_status: newStatus }, { headers: this.getHeaders() })
          .subscribe(
            (data) => {
              if (data.status === "ok") {
                this.loadPayments();
                swal.fire({ icon: "success", title: "O'zgartirildi!", timer: 1200, showConfirmButton: false });
              } else {
                swal.fire("Xatolik", data.error, "error");
              }
            },
            (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
          );
      }
    });
  }

  formatAmount(value: number): string {
    if (value == null) return "0";
    return Math.floor(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  // USD keeps 2 decimals — 5.6 must display as "5.60", not "6" (audit needs
  // the exact figure that hit the ledger).
  formatUsd(value: number): string {
    if (value == null) return "0.00";
    const abs = Math.abs(value);
    const [intPart, decPart] = abs.toFixed(2).split(".");
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + decPart;
  }

  // FX rate shown as an integer (rates are always whole UZS-per-USD).
  formatFxRate(value: number): string {
    if (value == null) return "";
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  getMethodLabel(method: string): string {
    const map: any = { UZS_CASH: "Naqd UZS", USD_CASH: "Naqd USD", PLASTIC: "Plastik", BANK: "Bank" };
    return map[method] || method;
  }
}
