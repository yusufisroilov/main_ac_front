import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import Swal from "sweetalert2";

interface CashAccount {
  id: number;
  name: string;
  type: string;
  currency: string;
  owner_kind: string;
  is_active: boolean;
  total_received: number;
}

@Component({
  selector: "app-cash-accounts",
  templateUrl: "./cash-accounts.component.html",
  styleUrls: ["./cash-accounts.component.css"],
})
export class CashAccountsComponent implements OnInit {
  accounts: CashAccount[] = [];
  isLoading: boolean = false;
  errorMessage: string = "";
  showInactive: boolean = false;

  private baseUrl = GlobalVars.baseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem("token") || "";
    return new HttpHeaders({ Authorization: token });
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = "";

    const activeParam = this.showInactive ? "" : "?active=true";
    this.http
      .get<any>(`${this.baseUrl}/cash-accounts${activeParam}`, {
        headers: this.getHeaders(),
      })
      .subscribe(
        (res) => {
          this.accounts = res.accounts || [];
          this.isLoading = false;
        },
        (err) => {
          this.isLoading = false;
          this.errorMessage =
            err.error?.error || "Hisoblarni yuklashda xatolik";
        }
      );
  }

  toggleShowInactive(): void {
    this.showInactive = !this.showInactive;
    this.loadAccounts();
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case "CASH":
        return "Naqd";
      case "CARD":
        return "Karta";
      case "BANK":
        return "Bank";
      default:
        return type;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case "CASH":
        return "payments";
      case "CARD":
        return "credit_card";
      case "BANK":
        return "account_balance";
      default:
        return "account_balance_wallet";
    }
  }

  getOwnerKindLabel(kind: string): string {
    return kind === "COMPANY" ? "Kompaniya" : "Xodim";
  }

  getCountByCurrency(currency: string): number {
    return this.accounts.filter(
      (a) => a.currency === currency && a.is_active
    ).length;
  }

  getActiveCount(): number {
    return this.accounts.filter((a) => a.is_active).length;
  }

  getTotalByCurrency(currency: string): number {
    return this.accounts
      .filter((a) => a.currency === currency && a.is_active)
      .reduce((sum, a) => sum + (Number(a.total_received) || 0), 0);
  }

  formatAmount(amount: number, currency: string): string {
    const val = Number(amount) || 0;
    const formatted = Math.abs(val).toLocaleString("uz-UZ");
    return currency === "USD" ? `$${formatted}` : `${formatted} so'm`;
  }

  async createAccount(): Promise<void> {
    const result = await Swal.fire({
      title: "Yangi Hisob Yaratish",
      html: `
        <div style="text-align: left;">
          <div class="form-group mb-3">
            <label class="form-label">Hisob nomi *</label>
            <input id="input-name" type="text" class="form-control" placeholder="Masalan: Ofis naqd" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Turi *</label>
            <select id="input-type" class="form-control">
              <option value="" disabled selected>Tanlang</option>
              <option value="CASH">Naqd</option>
              <option value="CARD">Karta</option>
              <option value="BANK">Bank</option>
            </select>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Valyuta *</label>
            <select id="input-currency" class="form-control">
              <option value="" disabled selected>Tanlang</option>
              <option value="UZS">UZS (So'm)</option>
              <option value="USD">USD (Dollar)</option>
            </select>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Egasi *</label>
            <select id="input-owner" class="form-control">
              <option value="" disabled selected>Tanlang</option>
              <option value="COMPANY">Kompaniya</option>
              <option value="EMPLOYEE">Xodim</option>
            </select>
          </div>
        </div>
      `,
      width: "550px",
      showCancelButton: true,
      confirmButtonText: "Yaratish",
      cancelButtonText: "Bekor Qilish",
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger",
      },
      buttonsStyling: false,
      preConfirm: () => {
        const name = (
          document.getElementById("input-name") as HTMLInputElement
        ).value.trim();
        const type = (
          document.getElementById("input-type") as HTMLSelectElement
        ).value;
        const currency = (
          document.getElementById("input-currency") as HTMLSelectElement
        ).value;
        const owner_kind = (
          document.getElementById("input-owner") as HTMLSelectElement
        ).value;

        if (!name) {
          Swal.showValidationMessage("Hisob nomi kiritilishi kerak!");
          return false;
        }
        if (!type) {
          Swal.showValidationMessage("Turi tanlanishi kerak!");
          return false;
        }
        if (!currency) {
          Swal.showValidationMessage("Valyuta tanlanishi kerak!");
          return false;
        }
        if (!owner_kind) {
          Swal.showValidationMessage("Egasi tanlanishi kerak!");
          return false;
        }

        return { name, type, currency, owner_kind };
      },
    });

    if (result.isConfirmed && result.value) {
      Swal.fire({
        title: "Yaratilmoqda...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.http
        .post<any>(`${this.baseUrl}/cash-accounts`, result.value, {
          headers: this.getHeaders(),
        })
        .subscribe(
          () => {
            this.loadAccounts();
            Swal.fire("Muvaffaqiyat!", "Yangi hisob yaratildi!", "success");
          },
          (err) => {
            Swal.fire(
              "Xatolik",
              err.error?.error || err.message,
              "error"
            );
          }
        );
    }
  }

  async editAccount(account: CashAccount): Promise<void> {
    const result = await Swal.fire({
      title: "Hisobni Tahrirlash",
      html: `
        <div style="text-align: left;">
          <div class="form-group mb-3">
            <label class="form-label">Hisob nomi *</label>
            <input id="input-name" type="text" class="form-control" value="${account.name}" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Turi *</label>
            <select id="input-type" class="form-control">
              <option value="CASH" ${account.type === "CASH" ? "selected" : ""}>Naqd</option>
              <option value="CARD" ${account.type === "CARD" ? "selected" : ""}>Karta</option>
              <option value="BANK" ${account.type === "BANK" ? "selected" : ""}>Bank</option>
            </select>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Valyuta</label>
            <input type="text" class="form-control" value="${account.currency}" disabled />
            <small class="text-muted">Valyutani o'zgartirib bo'lmaydi</small>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Egasi *</label>
            <select id="input-owner" class="form-control">
              <option value="COMPANY" ${account.owner_kind === "COMPANY" ? "selected" : ""}>Kompaniya</option>
              <option value="EMPLOYEE" ${account.owner_kind === "EMPLOYEE" ? "selected" : ""}>Xodim</option>
            </select>
          </div>
        </div>
      `,
      width: "550px",
      showCancelButton: true,
      confirmButtonText: "Saqlash",
      cancelButtonText: "Bekor Qilish",
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger",
      },
      buttonsStyling: false,
      preConfirm: () => {
        const name = (
          document.getElementById("input-name") as HTMLInputElement
        ).value.trim();
        const type = (
          document.getElementById("input-type") as HTMLSelectElement
        ).value;
        const owner_kind = (
          document.getElementById("input-owner") as HTMLSelectElement
        ).value;
        if (!name) {
          Swal.showValidationMessage("Hisob nomi kiritilishi kerak!");
          return false;
        }
        return { name, type, owner_kind };
      },
    });

    if (result.isConfirmed && result.value) {
      Swal.fire({
        title: "Saqlanmoqda...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.http
        .put<any>(
          `${this.baseUrl}/cash-accounts/${account.id}`,
          result.value,
          { headers: this.getHeaders() }
        )
        .subscribe(
          () => {
            this.loadAccounts();
            Swal.fire("Muvaffaqiyat!", "Hisob tahrirlandi!", "success");
          },
          (err) => {
            Swal.fire(
              "Xatolik",
              err.error?.error || err.message,
              "error"
            );
          }
        );
    }
  }

  async deactivateAccount(account: CashAccount): Promise<void> {
    const confirmResult = await Swal.fire({
      title: "Hisobni o'chirmoqchimisiz?",
      text: `"${account.name}" hisobi faolsizlantiriladi.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ha, o'chirish",
      cancelButtonText: "Bekor qilish",
      customClass: {
        confirmButton: "btn btn-danger",
        cancelButton: "btn btn-secondary",
      },
      buttonsStyling: false,
    });

    if (confirmResult.isConfirmed) {
      this.http
        .patch<any>(
          `${this.baseUrl}/cash-accounts/${account.id}/deactivate`,
          {},
          { headers: this.getHeaders() }
        )
        .subscribe(
          () => {
            this.loadAccounts();
            Swal.fire("O'chirildi!", "Hisob faolsizlantirildi!", "success");
          },
          (err) => {
            Swal.fire(
              "Xatolik",
              err.error?.error || err.message,
              "error"
            );
          }
        );
    }
  }
}
