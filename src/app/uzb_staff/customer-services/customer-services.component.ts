import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";

@Component({
  selector: "app-customer-services",
  templateUrl: "./customer-services.component.html",
  styleUrls: ["./customer-services.component.css"],
})
export class CustomerServicesComponent implements OnInit {
  activeTab: "services" | "types" | "all" = "services";
  role = localStorage.getItem("role") || "";
  isOwnerOrManager = ["OWNER", "MANAGER"].includes(this.role);

  // ── Customer services tab ──────────────────────────────
  customerId = "";
  customer: any = null;
  services: any[] = [];
  totalDebtUsd = 0;
  loadingServices = false;

  // ── All services tab ──────────────────────────────────
  allServices: any[] = [];
  loadingAll = false;
  allCurrentPage = 0;
  allTotalPages = 0;
  allTotalItems = 0;
  filterStatus = "";
  filterCustomerId = "";
  filterPayment = "";
  private customerIdTimeout: any;

  // ── Service types tab ──────────────────────────────────
  serviceTypes: any[] = [];
  loadingTypes = false;

  // ── Shared ────────────────────────────────────────────
  cashAccounts: any[] = [];

  categories = ["DELIVERY", "STORAGE", "CUSTOMS", "PACKAGING", "OTHER"];
  categoryLabels: Record<string, string> = {
    DELIVERY: "Yetkazish",
    STORAGE: "Saqlash",
    CUSTOMS: "Bojxona",
    PACKAGING: "Qadoqlash",
    OTHER: "Boshqa",
  };

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.loadCashAccounts();
    if (this.isOwnerOrManager) this.loadServiceTypes();
  }

  // ── Cash accounts ──────────────────────────────────────

  loadCashAccounts() {
    this.http
      .get<any>(`${GlobalVars.baseUrl}/cash-accounts?active=true`, {
        headers: this.getHeaders(),
      })
      .subscribe((data) => {
        const all: any[] = data.accounts || [];
        this.cashAccounts =
          this.role === "MANAGER" ? all.filter((a) => a.visibility === 3) : all;
      });
  }

  // ── Customer services ──────────────────────────────────

  searchCustomer() {
    const id = String(this.customerId).trim();
    if (!id) return;
    this.loadingServices = true;
    this.services = [];
    this.customer = null;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/services/customer/${id}`, {
        headers: this.getHeaders(),
      })
      .subscribe(
        (data) => {
          this.services = data.services || [];
          this.totalDebtUsd = data.total_debt_usd || 0;
          this.loadingServices = false;
          if (this.services.length > 0) {
            this.customer = this.services[0]?.customer || { id };
          } else {
            this.customer = { id };
          }
        },
        () => (this.loadingServices = false),
      );
  }

  // ── All services ──────────────────────────────────────

  loadAllServices(page = 0) {
    this.loadingAll = true;
    this.allCurrentPage = page;

    let params = `?page=${page}&size=50`;
    if (this.filterStatus) params += `&status=${this.filterStatus}`;
    if (this.filterCustomerId.trim()) params += `&customer_id=${this.filterCustomerId.trim()}`;
    if (this.filterPayment) params += `&payment=${this.filterPayment}`;

    this.http
      .get<any>(`${GlobalVars.baseUrl}/services/all${params}`, {
        headers: this.getHeaders(),
      })
      .subscribe(
        (data) => {
          this.allServices = data.services || [];
          this.allTotalPages = data.totalPages || 0;
          this.allTotalItems = data.totalItems || 0;
          this.loadingAll = false;
        },
        () => (this.loadingAll = false),
      );
  }

  onAllFilterChange() {
    this.loadAllServices(0);
  }

  onCustomerIdInput() {
    clearTimeout(this.customerIdTimeout);
    this.customerIdTimeout = setTimeout(() => {
      this.loadAllServices(0);
    }, 400);
  }

  chargeService() {
    if (!this.customerId) {
      swal.fire("", "Avval mijoz ID kiriting", "warning");
      return;
    }

    const typeOpts = this.serviceTypes
      .filter((t) => t.is_active)
      .map(
        (t) =>
          `<option value="${t.id}" data-price="${t.default_price}" data-currency="${t.currency}">${t.name} (${this.formatAmount(t.default_price)} ${t.currency})</option>`,
      )
      .join("");

    const html = `
      <style>
        .svc-form { display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; text-align:left; }
        .svc-form .full { grid-column:1/-1; }
        .svc-form label { font-size:12px; font-weight:600; color:#555; display:block; margin-bottom:4px; text-transform:uppercase; }
        .svc-form label .req { color:#e53935; margin-left:2px; }
        .svc-form .form-control { border-radius:6px; border:1.5px solid #ddd; padding:8px 10px; font-size:14px; width:100%; box-sizing:border-box; }
      </style>
      <div class="svc-form">
        <div class="full">
          <label>Xizmat turi<span class="req">*</span></label>
          <select id="svc-type" class="form-control">
            <option value="">-- Tanlang --</option>
            ${typeOpts}
          </select>
        </div>
        <div>
          <label>Summa<span class="req">*</span></label>
          <input id="svc-amount" type="text" class="form-control" placeholder="0" autocomplete="off">
        </div>
        <div>
          <label>Valyuta<span class="req">*</span></label>
          <select id="svc-currency" class="form-control">
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div class="full">
          <label>Kurs (UZS uchun)</label>
          <input id="svc-fx" type="number" class="form-control" placeholder="Masalan: 12800">
        </div>
        <div class="full">
          <label>Izoh</label>
          <input id="svc-notes" type="text" class="form-control" placeholder="Izoh...">
        </div>
      </div>`;

    swal
      .fire({
        title: "Xizmat Qo'shish",
        html,
        width: "min(520px, 95vw)",
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
            .get<any>(`${GlobalVars.baseUrl}/fx-rate`)
            .subscribe((d) => {
              if (d.rate) {
                const el = document.getElementById("svc-fx") as HTMLInputElement;
                if (el && !el.value) el.value = String(d.rate);
              }
            });

          // Auto-fill price when service type changes
          const typeEl = document.getElementById("svc-type") as HTMLSelectElement;
          const amtEl = document.getElementById("svc-amount") as HTMLInputElement;
          const curEl = document.getElementById("svc-currency") as HTMLSelectElement;

          typeEl.addEventListener("change", () => {
            const opt = typeEl.selectedOptions[0];
            const price = opt?.getAttribute("data-price");
            const currency = opt?.getAttribute("data-currency");
            if (price) amtEl.value = price;
            if (currency) curEl.value = currency;
          });

          // Amount formatter
          amtEl.addEventListener("input", () => {
            const raw = amtEl.value.replace(/[^\d.]/g, "");
            const parts = raw.split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            if (parts.length > 2) parts.length = 2;
            amtEl.value = parts.join(".");
          });
        },
        preConfirm: () => {
          const typeId = (document.getElementById("svc-type") as HTMLSelectElement).value;
          const amount = (document.getElementById("svc-amount") as HTMLInputElement).value.replace(/\s/g, "");
          const currency = (document.getElementById("svc-currency") as HTMLSelectElement).value;
          const fxRate = (document.getElementById("svc-fx") as HTMLInputElement).value;
          const notes = (document.getElementById("svc-notes") as HTMLInputElement).value;

          if (!amount || parseFloat(amount) <= 0) {
            swal.showValidationMessage("Summa musbat bo'lishi kerak");
            return false;
          }
          if (currency === "UZS" && !fxRate) {
            swal.showValidationMessage("UZS uchun kurs kiriting");
            return false;
          }
          return {
            customer_id: parseInt(this.customerId),
            service_type_id: typeId ? parseInt(typeId) : null,
            amount: parseFloat(amount),
            currency,
            fx_rate: fxRate ? parseFloat(fxRate) : null,
            notes: notes || null,
          };
        },
      })
      .then((result) => {
        if (!result.isConfirmed || !result.value) return;
        this.http
          .post<any>(`${GlobalVars.baseUrl}/services`, result.value, {
            headers: this.getHeaders(),
          })
          .subscribe(
            (data) => {
              if (data.status === "ok") {
                swal.fire({ icon: "success", title: "Qo'shildi!", timer: 1500, showConfirmButton: false });
                this.searchCustomer();
              } else {
                swal.fire("Xatolik", data.error, "error");
              }
            },
            (err) => swal.fire("Xatolik", err.error?.error || "Xatolik yuz berdi", "error"),
          );
      });
  }

  private getPaymentMethod(type: string, currency: string): string {
    if (type === "CASH" && currency === "USD") return "USD_CASH";
    if (type === "CASH" && currency === "UZS") return "UZS_CASH";
    if (type === "CARD") return "PLASTIC";
    if (type === "BANK") return "BANK";
    return "UZS_CASH";
  }

  payServices() {
    const pending = this.services.filter((s) => s.status === "PENDING");
    if (pending.length === 0) {
      swal.fire("", "To'lanadigan xizmat yo'q", "info");
      return;
    }

    const serviceCheckboxes = pending
      .map(
        (s) =>
          `<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer;">
            <input type="checkbox" class="svc-chk" value="${s.id}" data-debt="${(parseFloat(s.amount_usd) - parseFloat(s.amount_paid || 0)).toFixed(2)}" checked>
            <span>${s.serviceType?.name || "Xizmat"} — <b style="color:#e53935;font-weight:700;">${s.currency === "USD"
              ? (parseFloat(s.amount_usd) - parseFloat(s.amount_paid || 0)).toFixed(2) + "$"
              : this.formatAmount(parseFloat(s.amount) - parseFloat(s.amount_paid || 0) * parseFloat(s.fx_rate || 1)) + " " + s.currency
            }</b> <span style="color:#e53935;font-size:12px;font-weight:700;">(${(parseFloat(s.amount_usd) - parseFloat(s.amount_paid || 0)).toFixed(2)}$)</span></span>
          </label>`,
      )
      .join("");

    const buildAccountChips = (currency: string): string => {
      const filtered = this.cashAccounts.filter((a: any) => a.currency === currency);
      if (filtered.length === 0) return `<span style="color:#999;font-size:13px;">Bu valyutada hisob yo'q</span>`;
      return filtered
        .map(
          (a: any) =>
            `<button type="button" class="pd-acc-chip" data-id="${a.id}" data-type="${a.type || 'CASH'}"
              style="padding:8px 14px;border-radius:8px;border:1.5px solid #ddd;background:#f8f9fa;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s;">
              ${a.name}
            </button>`,
        )
        .join("");
    };

    const html = `
      <style>
        .pay-form { display:flex; flex-direction:column; gap:14px; text-align:left; }
        .pay-section-title { font-size:12px; font-weight:700; color:#888; text-transform:uppercase; margin-bottom:4px; }
        .pd-curr-btn { padding:8px 20px; border:1.5px solid #ddd; background:#f8f9fa; cursor:pointer; font-size:14px; font-weight:600; transition:all .15s; }
        .pd-curr-btn:first-child { border-radius:8px 0 0 8px; }
        .pd-curr-btn:last-child { border-radius:0 8px 8px 0; }
        .pd-curr-btn.active { background:#1976d2; color:#fff; border-color:#1976d2; }
        .pd-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:6px; }
        .pd-acc-chip.selected { background:#1976d2 !important; color:#fff !important; border-color:#1976d2 !important; }
        .pd-wrap { position:relative; }
        .pd-curr-tag { position:absolute; right:10px; top:50%; transform:translateY(-50%); font-weight:700; color:#888; font-size:13px; }
        .pay-field label { font-size:12px; font-weight:600; color:#555; display:block; margin-bottom:4px; text-transform:uppercase; }
        .pay-field .form-control { border-radius:6px; border:1.5px solid #ddd; padding:8px 10px; font-size:14px; width:100%; box-sizing:border-box; }
      </style>
      <div class="pay-form">
        <div>
          <div class="pay-section-title">Xizmatlar</div>
          ${serviceCheckboxes}
        </div>
        <div>
          <div class="pay-section-title">To'lov</div>
          <div style="display:flex;justify-content:center;margin-bottom:8px;">
            <button id="pd-uzs" type="button" class="pd-curr-btn active">UZS</button>
            <button id="pd-usd" type="button" class="pd-curr-btn">USD</button>
          </div>
          <div class="pay-field">
            <label>Hisob<span style="color:#e53935;margin-left:2px;">*</span></label>
            <div id="pd-chips" class="pd-chips">${buildAccountChips("UZS")}</div>
          </div>
          <div class="pay-field" style="margin-top:10px;">
            <label>Summa<span style="color:#e53935;margin-left:2px;">*</span></label>
            <div class="pd-wrap">
              <input id="pd-amount" type="text" class="form-control" placeholder="0" autocomplete="off" style="font-weight:700;font-size:18px;">
              <span id="pd-curr-tag" class="pd-curr-tag">UZS</span>
            </div>
          </div>
        </div>
        <div class="pay-field" id="pay-fx-div">
          <label>Kurs (UZS uchun)</label>
          <input id="pay-fx" type="number" class="form-control" placeholder="12800">
        </div>
        <div class="pay-field">
          <label>Ortiqcha to'lov</label>
          <select id="pay-overpayment" class="form-control">
            <option value="bonus">Bonus sifatida qoldirish</option>
            <option value="refund">Qaytarish (naqd)</option>
          </select>
        </div>
        <div class="pay-field">
          <label>Izoh</label>
          <input id="pay-comment" type="text" class="form-control" placeholder="Izoh...">
        </div>
      </div>`;

    swal
      .fire({
        title: "Xizmat To'lovi",
        html,
        width: "min(560px, 95vw)",
        showCancelButton: true,
        confirmButtonText: "To'lash",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        didOpen: () => {
          const uzsBtn = document.getElementById("pd-uzs")!;
          const usdBtn = document.getElementById("pd-usd")!;
          const chipsDiv = document.getElementById("pd-chips")!;
          const amtInput = document.getElementById("pd-amount") as HTMLInputElement;
          const currTag = document.getElementById("pd-curr-tag")!;
          const fxDiv = document.getElementById("pay-fx-div")!;

          // Auto-fill fx rate
          this.http.get<any>(`${GlobalVars.baseUrl}/fx-rate`).subscribe((d) => {
            if (d.rate) {
              const el = document.getElementById("pay-fx") as HTMLInputElement;
              if (el && !el.value) el.value = String(d.rate);
            }
          });

          const attachChipListeners = () => {
            chipsDiv.querySelectorAll(".pd-acc-chip").forEach((chip) => {
              chip.addEventListener("click", () => {
                chipsDiv.querySelectorAll(".pd-acc-chip").forEach((c) => c.classList.remove("selected"));
                chip.classList.add("selected");
              });
            });
          };
          attachChipListeners();

          const switchCurrency = (currency: string) => {
            currTag.textContent = currency;
            amtInput.value = "";
            chipsDiv.innerHTML = buildAccountChips(currency);
            attachChipListeners();
            fxDiv.style.display = currency === "UZS" ? "" : "none";
            if (currency === "UZS") {
              uzsBtn.classList.add("active");
              usdBtn.classList.remove("active");
            } else {
              usdBtn.classList.add("active");
              uzsBtn.classList.remove("active");
            }
          };

          uzsBtn.addEventListener("click", () => switchCurrency("UZS"));
          usdBtn.addEventListener("click", () => switchCurrency("USD"));

          // Amount formatter
          amtInput.addEventListener("input", () => {
            const raw = amtInput.value.replace(/[^\d.]/g, "");
            const parts = raw.split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            if (parts.length > 2) parts.length = 2;
            amtInput.value = parts.join(".");
          });
        },
        preConfirm: () => {
          const selectedIds: number[] = [];
          document.querySelectorAll(".svc-chk:checked").forEach((el) => {
            selectedIds.push(parseInt((el as HTMLInputElement).value));
          });
          if (selectedIds.length === 0) {
            swal.showValidationMessage("Kamida bitta xizmat tanlang");
            return false;
          }

          const selectedChip = document.querySelector<HTMLButtonElement>(".pd-acc-chip.selected");
          if (!selectedChip) {
            swal.showValidationMessage("Hisob tanlanmagan");
            return false;
          }
          const accountId = parseInt(selectedChip.dataset["id"]!);
          const accountType = selectedChip.dataset["type"] || "CASH";
          const account = this.cashAccounts.find((a: any) => a.id === accountId);
          if (!account) {
            swal.showValidationMessage("Hisob topilmadi");
            return false;
          }

          const rawAmount = parseFloat((document.getElementById("pd-amount") as HTMLInputElement).value.replace(/\s/g, ""));
          if (!rawAmount || rawAmount <= 0) {
            swal.showValidationMessage("Summa musbat bo'lishi kerak");
            return false;
          }

          const currency = account.currency;
          const fxRate = parseFloat((document.getElementById("pay-fx") as HTMLInputElement).value);
          if (currency === "UZS" && !fxRate) {
            swal.showValidationMessage("UZS to'lov uchun kurs kiriting");
            return false;
          }

          return {
            customer_id: parseInt(this.customerId),
            service_ids: selectedIds,
            payments: [{
              cash_account_id: accountId,
              method: this.getPaymentMethod(accountType, currency),
              currency,
              amount_original: rawAmount,
              fx_rate: currency === "UZS" ? fxRate : null,
            }],
            comment: (document.getElementById("pay-comment") as HTMLInputElement).value || null,
            overpayment_action: (document.getElementById("pay-overpayment") as HTMLSelectElement).value,
          };
        },
      })
      .then((result) => {
        if (!result.isConfirmed || !result.value) return;
        this.http
          .post<any>(`${GlobalVars.baseUrl}/services/pay`, result.value, {
            headers: this.getHeaders(),
          })
          .subscribe(
            (data) => {
              if (data.status === "ok") {
                let msg = `${data.receipts_count} ta to'lov qayd etildi.`;
                if (data.overpayment_usd > 0 && data.bonus_created) {
                  msg += ` Ortiqcha $${data.overpayment_usd} bonus sifatida qo'shildi.`;
                  swal.fire({ icon: "success", title: "To'landi!", text: msg, timer: 3000, showConfirmButton: false });
                  this.searchCustomer();
                } else if (data.overpayment_usd > 0 && !data.bonus_created) {
                  // Refund — ask which account to send money from
                  this.searchCustomer();
                  this.showRefundAccountDialog(data.overpayment_usd, parseInt(this.customerId));
                } else {
                  swal.fire({ icon: "success", title: "To'landi!", text: msg, timer: 3000, showConfirmButton: false });
                  this.searchCustomer();
                }
              } else {
                swal.fire("Xatolik", data.error, "error");
              }
            },
            (err) => swal.fire("Xatolik", err.error?.error || "Xatolik yuz berdi", "error"),
          );
      });
  }

  private showRefundAccountDialog(overpaymentUsd: number, customerId: number) {
    const buildChips = (currency: string): string => {
      const filtered = this.cashAccounts.filter((a: any) => a.currency === currency);
      if (filtered.length === 0) return `<span style="color:#999;font-size:13px;">Bu valyutada hisob yo'q</span>`;
      return filtered
        .map(
          (a: any) =>
            `<button type="button" class="rf-acc-chip" data-id="${a.id}" data-type="${a.type || 'CASH'}"
              style="padding:8px 14px;border-radius:8px;border:1.5px solid #ddd;background:#f8f9fa;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s;">
              ${a.name}
            </button>`,
        )
        .join("");
    };

    const html = `
      <style>
        .rf-curr-btn { padding:8px 20px; border:1.5px solid #ddd; background:#f8f9fa; cursor:pointer; font-size:14px; font-weight:600; transition:all .15s; }
        .rf-curr-btn:first-child { border-radius:8px 0 0 8px; }
        .rf-curr-btn:last-child { border-radius:0 8px 8px 0; }
        .rf-curr-btn.active { background:#e53935; color:#fff; border-color:#e53935; }
        .rf-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:6px; }
        .rf-acc-chip.selected { background:#e53935 !important; color:#fff !important; border-color:#e53935 !important; }
        .rf-field label { font-size:12px; font-weight:600; color:#555; display:block; margin-bottom:4px; text-transform:uppercase; }
      </style>
      <div style="text-align:left;">
        <p style="text-align:center;margin-bottom:14px;">Ortiqcha to'lov: <b style="color:#e53935;font-size:18px;">$${overpaymentUsd}</b></p>
        <div style="display:flex;justify-content:center;margin-bottom:12px;">
          <button id="rf-uzs" type="button" class="rf-curr-btn active">UZS</button>
          <button id="rf-usd" type="button" class="rf-curr-btn">USD</button>
        </div>
        <div class="rf-field">
          <label>Qaysi hisobdan qaytarilsin?<span style="color:#e53935;margin-left:2px;">*</span></label>
          <div id="rf-chips" class="rf-chips">${buildChips("UZS")}</div>
        </div>
      </div>`;

    swal
      .fire({
        title: "Qaytarish",
        html,
        width: "min(480px, 95vw)",
        showCancelButton: true,
        confirmButtonText: "Qaytarish",
        cancelButtonText: "Bekor",
        customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
        buttonsStyling: false,
        didOpen: () => {
          const uzsBtn = document.getElementById("rf-uzs")!;
          const usdBtn = document.getElementById("rf-usd")!;
          const chipsDiv = document.getElementById("rf-chips")!;

          const attachChipListeners = () => {
            chipsDiv.querySelectorAll(".rf-acc-chip").forEach((chip) => {
              chip.addEventListener("click", () => {
                chipsDiv.querySelectorAll(".rf-acc-chip").forEach((c) => c.classList.remove("selected"));
                chip.classList.add("selected");
              });
            });
          };
          attachChipListeners();

          const switchCurrency = (currency: string) => {
            chipsDiv.innerHTML = buildChips(currency);
            attachChipListeners();
            if (currency === "UZS") {
              uzsBtn.classList.add("active");
              usdBtn.classList.remove("active");
            } else {
              usdBtn.classList.add("active");
              uzsBtn.classList.remove("active");
            }
          };

          uzsBtn.addEventListener("click", () => switchCurrency("UZS"));
          usdBtn.addEventListener("click", () => switchCurrency("USD"));
        },
        preConfirm: () => {
          const selectedChip = document.querySelector<HTMLButtonElement>(".rf-acc-chip.selected");
          if (!selectedChip) {
            swal.showValidationMessage("Hisob tanlang");
            return false;
          }
          return { cash_account_id: parseInt(selectedChip.dataset["id"]!) };
        },
      })
      .then((result) => {
        if (!result.isConfirmed || !result.value) return;
        this.http
          .post<any>(
            `${GlobalVars.baseUrl}/services/refund`,
            {
              customer_id: customerId,
              overpayment_usd: overpaymentUsd,
              cash_account_id: result.value.cash_account_id,
            },
            { headers: this.getHeaders() },
          )
          .subscribe(
            (data) => {
              if (data.status === "ok") {
                swal.fire({ icon: "success", title: "Qaytarildi!", text: `$${overpaymentUsd} qaytarildi.`, timer: 2500, showConfirmButton: false });
                this.searchCustomer();
              } else {
                swal.fire("Xatolik", data.error, "error");
              }
            },
            (err) => swal.fire("Xatolik", err.error?.error || "Xatolik yuz berdi", "error"),
          );
      });
  }

  cancelService(id: number) {
    swal
      .fire({
        title: "Bekor qilish",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ha, bekor qilish",
        cancelButtonText: "Ortga",
        customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
        buttonsStyling: false,
      })
      .then((result) => {
        if (!result.isConfirmed) return;
        this.http
          .post<any>(`${GlobalVars.baseUrl}/services/${id}/cancel`, {}, { headers: this.getHeaders() })
          .subscribe(
            () => this.searchCustomer(),
            (err) => swal.fire("Xatolik", err.error?.error || "Xatolik yuz berdi", "error"),
          );
      });
  }

  // ── Service types ──────────────────────────────────────

  loadServiceTypes() {
    this.loadingTypes = true;
    this.http
      .get<any>(`${GlobalVars.baseUrl}/service-types`, { headers: this.getHeaders() })
      .subscribe(
        (data) => {
          this.serviceTypes = data.types || [];
          this.loadingTypes = false;
        },
        () => (this.loadingTypes = false),
      );
  }

  addServiceType() {
    this.openServiceTypeDialog(null);
  }

  editServiceType(st: any) {
    this.openServiceTypeDialog(st);
  }

  private openServiceTypeDialog(existing: any) {
    const isEdit = !!existing;

    const categoryOpts = this.categories
      .map(
        (c) =>
          `<option value="${c}" ${existing?.category === c ? "selected" : ""}>${this.categoryLabels[c]}</option>`,
      )
      .join("");

    const html = `
      <style>
        .st-form { display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; text-align:left; }
        .st-form .full { grid-column:1/-1; }
        .st-form label { font-size:12px; font-weight:600; color:#555; display:block; margin-bottom:4px; text-transform:uppercase; }
        .st-form label .req { color:#e53935; margin-left:2px; }
        .st-form .form-control { border-radius:6px; border:1.5px solid #ddd; padding:8px 10px; font-size:14px; width:100%; box-sizing:border-box; }
      </style>
      <div class="st-form">
        <div class="full">
          <label>Nomi<span class="req">*</span></label>
          <input id="st-name" type="text" class="form-control" value="${existing?.name || ""}" placeholder="Xizmat nomi">
        </div>
        <div>
          <label>Narxi</label>
          <input id="st-price" type="number" step="0.01" class="form-control" value="${existing?.default_price || 0}">
        </div>
        <div>
          <label>Valyuta</label>
          <select id="st-currency" class="form-control">
            <option value="UZS" ${existing?.currency !== "USD" ? "selected" : ""}>UZS</option>
            <option value="USD" ${existing?.currency === "USD" ? "selected" : ""}>USD</option>
          </select>
        </div>
        <div class="full">
          <label>Kategoriya</label>
          <select id="st-category" class="form-control">${categoryOpts}</select>
        </div>
      </div>`;

    swal
      .fire({
        title: isEdit ? "Xizmatni Tahrirlash" : "Yangi Xizmat Turi",
        html,
        width: "min(480px, 95vw)",
        showCancelButton: true,
        confirmButtonText: isEdit ? "Saqlash" : "Qo'shish",
        cancelButtonText: "Bekor",
        customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
        buttonsStyling: false,
        preConfirm: () => {
          const name = (document.getElementById("st-name") as HTMLInputElement).value.trim();
          if (!name) { swal.showValidationMessage("Nomi majburiy"); return false; }
          return {
            name,
            default_price: parseFloat((document.getElementById("st-price") as HTMLInputElement).value) || 0,
            currency: (document.getElementById("st-currency") as HTMLSelectElement).value,
            category: (document.getElementById("st-category") as HTMLSelectElement).value,
          };
        },
      })
      .then((result) => {
        if (!result.isConfirmed || !result.value) return;
        const req = isEdit
          ? this.http.put<any>(`${GlobalVars.baseUrl}/service-types/${existing.id}`, result.value, { headers: this.getHeaders() })
          : this.http.post<any>(`${GlobalVars.baseUrl}/service-types`, result.value, { headers: this.getHeaders() });

        req.subscribe(
          (data) => {
            if (data.status === "ok") {
              swal.fire({ icon: "success", title: "Saqlandi!", timer: 1200, showConfirmButton: false });
              this.loadServiceTypes();
            } else {
              swal.fire("Xatolik", data.error, "error");
            }
          },
          (err) => swal.fire("Xatolik", err.error?.error || "Xatolik yuz berdi", "error"),
        );
      });
  }

  toggleServiceTypeActive(st: any) {
    this.http
      .put<any>(`${GlobalVars.baseUrl}/service-types/${st.id}`, { is_active: !st.is_active }, { headers: this.getHeaders() })
      .subscribe(() => this.loadServiceTypes());
  }

  // ── Helpers ────────────────────────────────────────────

  formatAmount(value: number): string {
    if (value == null) return "0";
    return Math.floor(Math.abs(value))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  statusLabel(status: string): string {
    return { PENDING: "Kutilmoqda", COMPLETED: "To'landi", CANCELLED: "Bekor" }[status] || status;
  }

  statusClass(status: string): string {
    return { PENDING: "badge-warning", COMPLETED: "badge-success", CANCELLED: "badge-secondary" }[status] || "";
  }
}
