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

  // ═══════════════════════════════════════════════════
  // TAB SWITCHING
  // ═══════════════════════════════════════════════════

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === "referrals" && this.referrals.length === 0) {
      this.loadReferrals();
    }
    if (tab === "bonuses" && this.bonuses.length === 0) {
      this.loadBonuses();
    }
  }

  // ═══════════════════════════════════════════════════
  // REFERRALS
  // ═══════════════════════════════════════════════════

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
    swal
      .fire({
        title: "Yangi Referal Yaratish",
        html:
          '<div style="text-align: left;">' +
          '<label style="font-size: 13px; font-weight: 500; margin-bottom: 4px; display: block;">Taklif qiluvchi (Referrer) ID</label>' +
          '<input id="referrer-id" type="number" class="form-control" placeholder="Masalan: 55" style="margin-bottom: 12px;">' +
          '<label style="font-size: 13px; font-weight: 500; margin-bottom: 4px; display: block;">Taklif qilingan (Invited) ID</label>' +
          '<input id="invited-id" type="number" class="form-control" placeholder="Masalan: 120">' +
          "</div>",
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

  // ═══════════════════════════════════════════════════
  // BONUSES / REFUNDS (Ledger BONUS entries)
  // ═══════════════════════════════════════════════════

  loadBonuses() {
    this.bonusesLoading = true;
    let url =
      `${GlobalVars.baseUrl}/finance-v2/ledger-list?page=${this.bonusesCurrentPage}&size=${this.bonusesPageSize}&type=BONUS`;

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
    this.bonusesCurrentPage = 0;
    this.loadBonuses();
  }

  onBonusPageChanged(pageIndex: number) {
    this.bonusesCurrentPage = pageIndex;
    this.loadBonuses();
  }

  addBonus() {
    swal
      .fire({
        title: "Bonus / Qaytarish (Refund)",
        html:
          '<div style="text-align: left;">' +
          '<label style="font-size: 13px; font-weight: 500; margin-bottom: 4px; display: block;">Mijoz ID</label>' +
          '<input id="bonus-customer-id" type="number" class="form-control" placeholder="Masalan: 55" style="margin-bottom: 12px;">' +
          '<label style="font-size: 13px; font-weight: 500; margin-bottom: 4px; display: block;">Summa (USD)</label>' +
          '<input id="bonus-amount" type="number" step="0.01" class="form-control" placeholder="Masalan: 5.00" style="margin-bottom: 12px;">' +
          '<label style="font-size: 13px; font-weight: 500; margin-bottom: 4px; display: block;">Izoh</label>' +
          '<input id="bonus-comment" type="text" class="form-control" placeholder="Sabab...">' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "Qo'shish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const customerId = (
            document.getElementById("bonus-customer-id") as HTMLInputElement
          ).value;
          const amount = (
            document.getElementById("bonus-amount") as HTMLInputElement
          ).value;
          const comment = (
            document.getElementById("bonus-comment") as HTMLInputElement
          ).value;

          if (!customerId || !amount) {
            swal.showValidationMessage("Mijoz ID va Summa majburiy");
            return false;
          }

          if (parseFloat(amount) <= 0) {
            swal.showValidationMessage("Summa 0 dan katta bo'lishi kerak");
            return false;
          }

          return this.http
            .post(
              GlobalVars.baseUrl + "/finance-v2/bonus",
              JSON.stringify({
                customer_id: parseInt(customerId),
                amount_usd: parseFloat(amount),
                comment: comment || "Bonus / Refund",
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
                error.json()?.error || "Bonus qo'shishda xatolik yuz berdi";
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
            text: "Bonus muvaffaqiyatli qo'shildi",
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

  formatCurrency(value: number): string {
    if (value == null) return "0";
    const intPart = Math.floor(Math.abs(value));
    const formatted = intPart
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return value < 0 ? "-" + formatted : formatted;
  }

  getReferralStatusClass(status: string): string {
    return status === "ACTIVE" ? "status-active" : "status-banned";
  }
}
