import { Component, OnInit } from "@angular/core";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

declare const $: any;

@Component({
  selector: "app-referrals-bonuses",
  templateUrl: "./referrals-bonuses.component.html",
  styleUrls: ["./referrals-bonuses.component.css"],
})
export class ReferralsBonusesComponent implements OnInit {
  // Tab control
  activeTab: string = "referrals";

  // HTTP
  headers12: any;
  options: any;

  // ──── Referrals state ────
  referrals: any[] = [];
  referralsLoading: boolean = false;
  referralsTotal: number = 0;

  // ──── Bonuses state ────
  bonuses: any[] = [];
  bonusesLoading: boolean = false;
  bonusesCurrentPage: number = 0;
  bonusesPageSize: number = 50;
  bonusesTotalItems: number = 0;
  bonusesTotalPages: number = 0;
  bonusesNeedPagination: boolean = false;

  // Bonuses filter
  bonusFilterCustomerId: string = "";
  bonusFilterType: string = "";

  constructor(
    private http: Http,
    public authService: AuthService,
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit(): void {
    this.loadReferrals();
  }

  // ═══════════════════════════════════════════
  // TAB SWITCHING
  // ═══════════════════════════════════════════

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === "referrals" && this.referrals.length === 0) {
      this.loadReferrals();
    }
    if (tab === "bonuses" && this.bonuses.length === 0) {
      this.loadBonuses();
    }
  }

  // ═══════════════════════════════════════════
  // REFERRALS
  // ═══════════════════════════════════════════

  loadReferrals() {
    this.referralsLoading = true;
    this.http
      .get(GlobalVars.baseUrl + "/referral/list", this.options)
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "ok") {
            this.referrals = result.referrals || [];
            this.referralsTotal = result.total || 0;
          }
          this.referralsLoading = false;
        },
        (error) => {
          this.referralsLoading = false;
          if (error.status === 403) {
            this.authService.logout();
          }
        },
      );
  }

  addReferral() {
    const formStyle = `
      <style>
        .ref-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; text-align: left; }
        .ref-form .ref-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; overflow: hidden; }
        .ref-form label { font-size: 12px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.3px; }
        .ref-form input { font-size: 14px; border-radius: 6px; border: 1px solid #ced4da; padding: 8px 12px; outline: none; transition: border-color 0.2s; width: 100%; min-width: 0; box-sizing: border-box; }
        .ref-form input:focus { border-color: #7b1fa2; box-shadow: 0 0 0 2px rgba(123, 31, 162, 0.15); }
        @media (max-width: 576px) { .ref-form { grid-template-columns: 1fr; } }
      </style>
    `;

    swal
      .fire({
        title: "Yangi Referal Yaratish",
        html:
          formStyle +
          '<div class="ref-form">' +
          '<div class="ref-field">' +
          '<label>Taklif qiluvchi ID</label>' +
          '<input id="referrer-id" type="number" placeholder="Masalan: 55">' +
          "</div>" +
          '<div class="ref-field">' +
          '<label>Taklif qilingan ID</label>' +
          '<input id="invited-id" type="number" placeholder="Masalan: 120">' +
          "</div>" +
          "</div>",
        width: "min(440px, 95vw)",
        showCancelButton: true,
        confirmButtonText: "Yaratish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const referrerId = (
            document.getElementById("referrer-id") as HTMLInputElement
          ).value;
          const invitedId = (
            document.getElementById("invited-id") as HTMLInputElement
          ).value;

          if (!referrerId || !invitedId) {
            swal.showValidationMessage("Ikkala maydonni ham to'ldiring");
            return false;
          }

          return this.http
            .post(
              GlobalVars.baseUrl + "/referral/add",
              JSON.stringify({
                referrer_customer_id: parseInt(referrerId),
                invited_customer_id: parseInt(invitedId),
              }),
              this.options,
            )
            .toPromise()
            .then((response) => {
              const result = response.json();
              if (result.status === "error") {
                swal.showValidationMessage(result.error || result.message);
                return false;
              }
              return true;
            })
            .catch((error) => {
              const msg =
                error.json()?.error || "Referal yaratishda xatolik yuz berdi";
              swal.showValidationMessage(msg);
              return false;
            });
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          swal.fire({
            icon: "success",
            title: "Muvaffaqiyat!",
            text: "Referal bog'lanish yaratildi",
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadReferrals();
        }
      });
  }

  // ═══════════════════════════════════════════
  // BONUSES / REFUNDS
  // ═══════════════════════════════════════════

  loadBonuses() {
    this.bonusesLoading = true;
    let url =
      `${GlobalVars.baseUrl}/finance-v2/ledger-list?page=${this.bonusesCurrentPage}&size=${this.bonusesPageSize}`;

    // Type filter: BONUS, REFUND, or both
    if (this.bonusFilterType) {
      url += `&type=${this.bonusFilterType}`;
    } else {
      url += `&type=BONUS,REFUND`;
    }

    if (this.bonusFilterCustomerId) {
      url += `&customer_id=${this.bonusFilterCustomerId}`;
    }

    this.http.get(url, this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "ok") {
          this.bonuses = result.entries || [];
          this.bonusesTotalItems = result.totalItems || 0;
          this.bonusesTotalPages = result.totalPages || 0;
          this.bonusesCurrentPage = result.currentPage || 0;
          this.bonusesNeedPagination = this.bonusesTotalPages > 1;
        }
        this.bonusesLoading = false;
      },
      (error) => {
        this.bonusesLoading = false;
        if (error.status === 403) {
          this.authService.logout();
        }
      },
    );
  }

  applyBonusFilter() {
    this.bonusesCurrentPage = 0;
    this.loadBonuses();
  }

  clearBonusFilter() {
    this.bonusFilterCustomerId = "";
    this.bonusFilterType = "";
    this.bonusesCurrentPage = 0;
    this.loadBonuses();
  }

  onBonusPageChanged(pageIndex: number) {
    this.bonusesCurrentPage = pageIndex;
    this.loadBonuses();
  }

  addBonus() {
    this.showBonusRefundDialog("BONUS");
  }

  addRefund() {
    this.showBonusRefundDialog("REFUND");
  }

  private showBonusRefundDialog(type: "BONUS" | "REFUND") {
    const isBonus = type === "BONUS";
    const title = isBonus ? "Bonus qo'shish" : "Qaytarish (Refund)";
    const accentColor = isBonus ? "#00796b" : "#e65100";

    const formStyle = `
      <style>
        .br-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; text-align: left; }
        .br-form .br-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; overflow: hidden; }
        .br-form .br-field-full { grid-column: 1 / -1; }
        .br-form label { font-size: 12px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.3px; }
        .br-form input { font-size: 14px; border-radius: 6px; border: 1px solid #ced4da; padding: 8px 12px; outline: none; transition: border-color 0.2s; width: 100%; min-width: 0; box-sizing: border-box; }
        .br-form input:focus { border-color: ${accentColor}; box-shadow: 0 0 0 2px ${accentColor}26; }
        @media (max-width: 576px) { .br-form { grid-template-columns: 1fr; } }
      </style>
    `;

    swal
      .fire({
        title: title,
        html:
          formStyle +
          '<div class="br-form">' +
          '<div class="br-field">' +
          '<label>Mijoz ID</label>' +
          '<input id="br-customer-id" type="number" placeholder="Masalan: 55">' +
          "</div>" +
          '<div class="br-field">' +
          '<label>Summa (USD)</label>' +
          '<input id="br-amount" type="number" step="0.01" placeholder="Masalan: 5.00">' +
          "</div>" +
          '<div class="br-field br-field-full">' +
          '<label>Izoh</label>' +
          '<input id="br-comment" type="text" placeholder="Sabab...">' +
          "</div>" +
          "</div>",
        width: "min(480px, 95vw)",
        showCancelButton: true,
        confirmButtonText: isBonus ? "Bonus qo'shish" : "Qaytarish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const customerId = (
            document.getElementById("br-customer-id") as HTMLInputElement
          ).value;
          const amount = (
            document.getElementById("br-amount") as HTMLInputElement
          ).value;
          const comment = (
            document.getElementById("br-comment") as HTMLInputElement
          ).value;

          if (!customerId || !amount) {
            swal.showValidationMessage("Mijoz ID va Summa majburiy");
            return false;
          }

          if (parseFloat(amount) <= 0) {
            swal.showValidationMessage("Summa 0 dan katta bo'lishi kerak");
            return false;
          }

          const endpoint = isBonus ? "/finance-v2/bonus" : "/finance-v2/refund";
          const defaultComment = isBonus ? "Bonus" : "Qaytarish (Refund)";

          return this.http
            .post(
              GlobalVars.baseUrl + endpoint,
              JSON.stringify({
                customer_id: parseInt(customerId),
                amount_usd: parseFloat(amount),
                comment: comment || defaultComment,
              }),
              this.options,
            )
            .toPromise()
            .then((response) => {
              const result = response.json();
              if (result.status === "error") {
                swal.showValidationMessage(result.error || result.message);
                return false;
              }
              return true;
            })
            .catch((error) => {
              const msg =
                error.json()?.error || "Xatolik yuz berdi";
              swal.showValidationMessage(msg);
              return false;
            });
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          swal.fire({
            icon: "success",
            title: "Muvaffaqiyat!",
            text: isBonus
              ? "Bonus muvaffaqiyatli qo'shildi"
              : "Qaytarish muvaffaqiyatli saqlandi",
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadBonuses();
        }
      });
  }

  absValue(value: number): number {
    return Math.abs(Number(value) || 0);
  }

  getReferralStatusClass(status: string): string {
    return status === "ACTIVE" ? "status-active" : "status-banned";
  }
}
