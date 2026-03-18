import { TableData } from "src/app/md/md-table/md-table.component";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";
import swal from "sweetalert2";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "src/app/pages/login/auth.service";

declare var $: any;

interface PackageGroup {
  type: "tied" | "single";
  identifier: string;
  tie_group_id?: string;
  total_packages: number;
  total_items: number;
  consignments: string[];
  package_barcodes: string[];
  packages: any[];
  weights: any[];
  selected?: boolean;
  selectionType?: "full" | "partial";
  selectedConsignment?: string;
  debt_uzs?: number;
  debt_usd?: number;
  has_high_debt?: boolean;
  consignments_with_debt?: string[];
  forDebt?: boolean;
}

@Component({
  selector: "app-infoeachclientv2",
  templateUrl: "./infoeachclientv2.component.html",
  styleUrls: ["./infoeachclientv2.component.css"],
})
export class Infoeachclientv2Component implements OnInit {
  public tableData1: TableData;
  public dataTable: TableData;

  trackingNum: string;
  allData: any;
  allDataBoxes: any;
  registredMessage: any;
  currentID: any;
  showTheList: any;
  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;
  orderTypeText: string[];
  orderStatusText: string[];
  printContents;
  popupWin;
  printCondition3: boolean;
  idsChek: string;
  nameChek: string;
  weightChek: string;
  counterChek: string;
  izohChek: string;
  currentParty: string;
  umQarzUSZ: string;
  umQarzUSD: string;
  unallocatedCredit: number = 0;

  // Cash accounts for V2 payments
  cashAccounts: any[] = [];

  // Delivery-related properties
  selectedConsignmentId: string = "";
  selectedConsignmentName: string = "";
  selectedConsignmentWeight: string = "";
  selectedConsignmentQuantity: string = "";

  customerPackages: PackageGroup[] = [];
  selectedPackageIdentifiers: string[] = [];
  loadingCustomerPackages: boolean = false;

  deliveryType: string = "";
  customerPhone: string = "";
  deliveryAddress: string = "";
  courierName: string = "";
  courierPhone: string = "";
  deliveryFee: number = 0;
  yandexFee: number = 0;
  deliveryNotes: string = "";

  // Debt tracking
  showDebtWarning: boolean = false;
  packagesWithHighDebt: PackageGroup[] = [];
  debtConsignments: string[] = [];
  totalDebtUzs: number = 0;
  totalDebtUsd: number = 0;

  // Auto-fill tracking
  isEmuDataAutoFilled: boolean = false;
  lastEmuDeliveryId: string = "";
  autoFilledFields = { regionId: false, branchId: false, phone: false };

  // EMU data
  regions: any[] = [];
  branches: any[] = [];
  selectedRegionId: number | null = null;
  selectedBranchId: number | null = null;
  selectedBranchName: string = "";

  // Delivery creation state
  creatingDelivery: boolean = false;

  // Print delivery receipt
  printConditionDelivery: boolean = false;
  deliveryBarcode: string = "";
  deliveryTypeText: string = "";
  totalSelectedPackagesForPrint: number = 0;
  currentDate: string = "";
  selectedBarcodes: string = "";


  constructor(
    public authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private httpClient: HttpClient,
    private router: Router,
  ) {
    this.orderTypeText = [];
    this.orderStatusText = [];

    this.currentPage = 0;
    this.needPagination = false;
    this.isPageNumActive = false;

    this.currentParty = "";
    this.showTheList = false;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.dataTable = {
      headerRow: [
        "No",
        "Tovar nomi",
        "Trek nomeri",
        "Soni",
        "Turi",
        "Qayerdaligi",
        "Amallar",
      ],
      dataRows: [],
    };

    this.tableData1 = {
      headerRow: [
        "NO",
        "Sizning ID",
        "Partiya",
        "Soni",
        "Buyurtmalarni ko'rish",
      ],
      dataRows: [],
    };

    this.loadRegions();
    this.loadCashAccounts();
  }

  // ─── Cash Accounts (V2) ───

  loadCashAccounts() {
    this.httpClient
      .get<any>(GlobalVars.baseUrl + "/finance-v2/cash-accounts?active=true&visibility=3", {
        headers: this.getHeaders(),
      })
      .subscribe(
        (data) => {
          this.cashAccounts = data.accounts || [];
        },
        (error) => {
          console.error("Failed to load cash accounts:", error);
        },
      );
  }

  private getPaymentMethod(type: string, currency: string): string {
    if (type === "CASH" && currency === "USD") return "USD_CASH";
    if (type === "CASH" && currency === "UZS") return "UZS_CASH";
    if (type === "CARD") return "PLASTIC";
    if (type === "BANK") return "BANK";
    return "UZS_CASH";
  }

  // ─── Customer Consignment List ───

  getListOfPartyBoxes(ownerid) {
    this.httpClient
      .get<any>(
        GlobalVars.baseUrl + "/consignments/for_client_v2?id=" + ownerid,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (data) => {
          this.allDataBoxes = (data.consignments || []).filter(
            (r) => r.quantity !== 0,
          );
          this.umQarzUSZ = data.debt_uzs_total;
          this.umQarzUSD = data.debt_usd_total;
          this.unallocatedCredit = data.unallocated_credit_usd || 0;
          this.currentID = data.user_id;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `BAD REQUEST: ${error.error?.error || error.message}`,
            "error",
          );
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  // ─── Orders List ───

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    this.getListOfParcels(this.currentParty);
  }

  openListOfPartLog() {
    this.showTheList = !this.showTheList;
  }

  openListOfPart(partyNum) {
    this.openListOfPartLog();
    if (this.showTheList == false) return false;
    this.currentParty = partyNum;
  }

  getListOfParcels(partyNum) {
    this.currentParty = partyNum;

    this.httpClient
      .get<any>(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=150&ownerID=" +
          this.currentID +
          "&consignment=" +
          partyNum,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (data) => {
          this.allData = data.orders;
          this.showTheList = true;

          for (let index = 0; index < this.allData.length; index++) {
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              this.allData[index].order_type,
              "uz",
            );
          }

          for (let index = 0; index < this.allData.length; index++) {
            this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
              this.allData[index].status,
              "uz",
            );
          }

          this.currentPage = data.currentPage;
          this.totalPages = data.totalPages;
          if (this.totalPages > 1) {
            this.needPagination = true;
            for (let i = 0; i < this.totalPages; i++) {
              this.mypages[i] = { id: "name" };
            }
          }
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  getListOfParcelsWithSearch(searchkey) {
    if (searchkey == "") {
      this.currentPage = 0;
      this.getListOfParcels(this.currentParty);
    } else {
      this.httpClient
        .get<any>(
          GlobalVars.baseUrl +
            "/orders/list?page=" +
            this.currentPage +
            "&size=50&ownerID=" +
            this.currentID +
            "&consignment=" +
            this.currentParty +
            "&trackingNumber=" +
            searchkey,
          { headers: this.getHeaders() },
        )
        .subscribe(
          (data) => {
            this.allData = data.orders;

            for (let index = 0; index < this.allData.length; index++) {
              this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
                this.allData[index].order_type,
                "uz",
              );
            }

            for (let index = 0; index < this.allData.length; index++) {
              this.orderStatusText[index] =
                GlobalVars.getDesOrderStatusWithID(
                  this.allData[index].status,
                  "uz",
                );
            }

            this.currentPage = data.currentPage;
            this.totalPages = data.totalPages;
            if (this.totalPages > 1) {
              this.needPagination = true;
              for (let i = 0; i < this.totalPages; i++) {
                this.mypages[i] = { id: "name" };
              }
            }
          },
          (error) => {
            if (error.status === 403) this.authService.logout();
          },
        );
    }
  }

  getInfoOfParcel(me) {
    this.trackingNum2 = me;
  }

  // ─── V2 Payment ───

  addFinance(finId: number, partiya: string) {
    const buildAccountChips = (currency: string): string => {
      const filtered = this.cashAccounts.filter((a) => a.currency === currency);
      if (!filtered.length) {
        return `<p class="pd-no-acc">Bu valyuta uchun hisob topilmadi</p>`;
      }
      return filtered
        .map(
          (a) =>
            `<button type="button" class="pd-acc-chip" data-id="${a.id}" title="${a.name}">
               <span class="pd-chip-name">${a.name}</span>
             </button>`,
        )
        .join("");
    };

    const html = `
      <style>
        .pd { text-align: left; font-family: inherit; }

        /* ── Currency toggle ── */
        .pd-curr-row { display: flex; gap: 8px; margin-bottom: 18px; }
        .pd-curr-btn {
          flex: 1; padding: 10px 0; border-radius: 8px;
          border: 2px solid #ddd; background: #f5f5f5; color: #888;
          font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.18s;
          letter-spacing: 0.5px;
        }
        .pd-curr-btn.active {
          background: #1565c0; color: #fff; border-color: #1565c0;
          box-shadow: 0 2px 10px rgba(21,101,192,0.28);
        }

        /* ── Account chips ── */
        .pd-field { margin-bottom: 16px; }
        .pd-lbl {
          display: block; font-size: 11px; font-weight: 700; color: #888;
          text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px;
        }
        .pd-lbl .req { color: #e53935; margin-left: 2px; }
        .pd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .pd-acc-chip {
          display: flex; align-items: center;
          padding: 8px 14px; border-radius: 20px;
          border: 2px solid #e0e0e0; background: #f9f9f9; color: #444;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.16s; max-width: 160px;
          white-space: nowrap; overflow: hidden;
        }
        .pd-acc-chip .pd-chip-name {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pd-acc-chip:hover { border-color: #90caf9; background: #e3f2fd; color: #1565c0; }
        .pd-acc-chip.selected {
          border-color: #1565c0; background: #1565c0; color: #fff;
          box-shadow: 0 2px 8px rgba(21,101,192,0.3);
        }
        .pd-no-acc { color: #e53935; font-size: 13px; margin: 0; }

        /* ── Amount ── */
        .pd-wrap { position: relative; }
        #pd-amount {
          padding-right: 56px; font-size: 22px; font-weight: 700;
          letter-spacing: 0.5px; border-radius: 8px; border: 2px solid #e0e0e0;
          transition: border-color 0.2s;
        }
        #pd-amount:focus { border-color: #1565c0; outline: none; box-shadow: 0 0 0 3px rgba(21,101,192,0.12); }
        .pd-curr-tag {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          font-size: 11px; font-weight: 700; color: #888;
          background: #efefef; border-radius: 5px; padding: 2px 7px;
          pointer-events: none;
        }
        #pd-comment { border-radius: 8px; font-size: 14px; }
      </style>
      <div class="pd">
        <div class="pd-curr-row">
          <button id="pd-uzs" type="button" class="pd-curr-btn active">UZS</button>
          <button id="pd-usd" type="button" class="pd-curr-btn">USD</button>
        </div>
        <div class="pd-field">
          <span class="pd-lbl">Hisob<span class="req">*</span></span>
          <div id="pd-chips" class="pd-chips">${buildAccountChips("UZS")}</div>
        </div>
        <div class="pd-field">
          <span class="pd-lbl">Summa<span class="req">*</span></span>
          <div class="pd-wrap">
            <input id="pd-amount" type="text" class="form-control" placeholder="0" autocomplete="off">
            <span id="pd-curr-tag" class="pd-curr-tag">UZS</span>
          </div>
        </div>
        <div class="pd-field">
          <span class="pd-lbl">Izoh</span>
          <input id="pd-comment" type="text" class="form-control" placeholder="Izoh...">
        </div>
      </div>`;

    swal.fire({
      title: "To'lov Qo'shish",
      html,
      width: "min(440px, 95vw)",
      showCancelButton: true,
      confirmButtonText: "Tasdiqlash",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      didOpen: () => {
        const btnUzs   = document.getElementById("pd-uzs") as HTMLButtonElement;
        const btnUsd   = document.getElementById("pd-usd") as HTMLButtonElement;
        const chipsDiv = document.getElementById("pd-chips") as HTMLElement;
        const currTag  = document.getElementById("pd-curr-tag") as HTMLElement;
        const amtInput = document.getElementById("pd-amount") as HTMLInputElement;

        const attachChipListeners = () => {
          chipsDiv.querySelectorAll<HTMLButtonElement>(".pd-acc-chip").forEach((chip) => {
            chip.addEventListener("click", () => {
              chipsDiv.querySelectorAll(".pd-acc-chip").forEach((c) => c.classList.remove("selected"));
              chip.classList.add("selected");
            });
          });
        };

        const switchCurrency = (currency: string) => {
          currTag.textContent = currency;
          amtInput.value = "";
          chipsDiv.innerHTML = buildAccountChips(currency);
          attachChipListeners();
          btnUzs.classList.toggle("active", currency === "UZS");
          btnUsd.classList.toggle("active", currency === "USD");
        };

        btnUzs.addEventListener("click", () => switchCurrency("UZS"));
        btnUsd.addEventListener("click", () => switchCurrency("USD"));
        attachChipListeners();

        // Live formatter — space thousand separator, allow one decimal point
        amtInput.addEventListener("input", () => {
          const raw = amtInput.value.replace(/[^\d.]/g, "");
          const parts = raw.split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
          if (parts.length > 2) parts.length = 2;
          amtInput.value = parts.join(".");
        });
      },
      preConfirm: () => {
        const chipsDiv  = document.getElementById("pd-chips") as HTMLElement;
        const amtInput  = document.getElementById("pd-amount") as HTMLInputElement;
        const comment   = (document.getElementById("pd-comment") as HTMLInputElement).value.trim();

        const selected  = chipsDiv.querySelector<HTMLButtonElement>(".pd-acc-chip.selected");
        const accountId = selected ? parseInt(selected.dataset["id"]) : NaN;
        const rawAmount = parseFloat(amtInput.value.replace(/\s/g, ""));

        if (!selected || isNaN(accountId)) {
          swal.showValidationMessage("Hisob tanlanmagan");
          return false;
        }
        if (!rawAmount || rawAmount <= 0) {
          swal.showValidationMessage("Summa musbat bo'lishi kerak");
          return false;
        }

        const account = this.cashAccounts.find((a) => a.id === accountId);
        if (!account) {
          swal.showValidationMessage("Hisob topilmadi");
          return false;
        }

        return {
          payments: [{
            method: this.getPaymentMethod(account.type, account.currency),
            currency: account.currency,
            amount_original: rawAmount,
            cash_account_id: accountId,
          }],
          comment: comment || null,
        };
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;

      const { payments, comment } = result.value;
      this.httpClient
        .post<any>(
          GlobalVars.baseUrl + "/finance-v2/pay",
          { finance_id: finId, payments, comment },
          { headers: this.getHeaders() },
        )
        .subscribe(
          (data) => {
            if (data.status === "error") {
              swal.fire("Qo'shilmadi", data.message || data.error, "error");
              return;
            }
            this.getListOfPartyBoxes(this.currentID);
            if (data.overpayment_usd > 0) {
              this.handleOverpayment(data.overpayment_usd, data.finance_id);
            } else {
              swal.fire({ icon: "success", title: "Muvaffaqiyat!", timer: 1500, showConfirmButton: false });
            }
          },
          (error) => {
            swal.fire("Xatolik", error.error?.message || error.error?.error || "Xatolik yuz berdi", "error");
          },
        );
    });
  }

  private handleOverpayment(overpaidUsd: number, financeId?: number) {
    const accountOptions = this.cashAccounts
      .map((a) => `<option value="${a.id}" data-currency="${a.currency}" data-name="${a.name}">${a.name} (${a.currency})</option>`)
      .join("");

    swal.fire({
      title: "Ortiqcha To\'lov",
      icon: "warning",
      html: `
        <p style="margin-bottom:16px">
          Mijoz <b>${overpaidUsd.toFixed(2)}$</b> ortiqcha to\'ladi.
        </p>
        <p style="margin-bottom:8px">Qanday amalga oshirilsin?</p>
      `,
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: "✅ Kredit sifatida saqlash",
      denyButtonText: "💵 Naqd qaytarish",
      customClass: { confirmButton: "btn btn-success", denyButton: "btn btn-warning" },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        // Button A: keep as unallocated BONUS credit
        this.httpClient
          .post<any>(
            GlobalVars.baseUrl + "/finance-v2/keep-credit",
            { customer_id: this.currentID, amount_usd: overpaidUsd, finance_id: financeId, comment: "Ortiqcha to\'lov krediti" },
            { headers: this.getHeaders() },
          )
          .subscribe(
            () => swal.fire({ icon: "success", title: `${overpaidUsd.toFixed(2)}$ kredit sifatida saqlandi`, timer: 2000, showConfirmButton: false }),
            (err) => swal.fire("Xatolik", err.error?.message || "Kredit saqlashda xatolik", "error"),
          );
      } else if (result.isDenied) {
        // Button B: return cash — pick which account + fx_rate if UZS
        swal.fire({
          title: "Qaytariladigan Hisob",
          html: `
            <p style="margin-bottom:12px">Qaysi hisobdan <b>${overpaidUsd.toFixed(2)}$</b> qaytarilsin?</p>
            <select id="op-account" class="form-control" style="margin-bottom:12px">
              <option value="">— Hisob tanlang —</option>
              ${accountOptions}
            </select>
            <div id="op-rate-row" style="display:none">
              <label style="font-size:12px;font-weight:700;color:#888">KURS (1 USD = ? UZS)</label>
              <input id="op-rate" type="number" class="form-control" placeholder="masalan: 12800">
            </div>
          `,
          confirmButtonText: "Qaytarish",
          showCancelButton: true,
          cancelButtonText: "Bekor",
          customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
          buttonsStyling: false,
          didOpen: () => {
            const sel = document.getElementById("op-account") as HTMLSelectElement;
            const rateRow = document.getElementById("op-rate-row") as HTMLElement;
            sel.addEventListener("change", () => {
              const opt = sel.options[sel.selectedIndex];
              rateRow.style.display = opt.dataset["currency"] === "UZS" ? "block" : "none";
            });
          },
          preConfirm: () => {
            const sel = document.getElementById("op-account") as HTMLSelectElement;
            if (!sel.value) { swal.showValidationMessage("Hisob tanlang"); return false; }
            const opt = sel.options[sel.selectedIndex];
            const currency = opt.dataset["currency"];
            let fxRate: number | null = null;
            if (currency === "UZS") {
              const rateVal = parseFloat((document.getElementById("op-rate") as HTMLInputElement).value);
              if (!rateVal || rateVal <= 0) { swal.showValidationMessage("Kurs kiritilmagan"); return false; }
              fxRate = rateVal;
            }
            return { from_account_id: parseInt(sel.value), currency, fxRate };
          },
        }).then((r2) => {
          if (!r2.isConfirmed || !r2.value) return;
          const { from_account_id, fxRate } = r2.value;
          this.httpClient
            .post<any>(
              GlobalVars.baseUrl + "/finance-v2/return-cash",
              { customer_id: this.currentID, amount_usd: overpaidUsd, from_account_id, fx_rate: fxRate, finance_id: financeId },
              { headers: this.getHeaders() },
            )
            .subscribe(
              (res) => swal.fire({ icon: "success", title: res.message || "Qaytarildi", timer: 2000, showConfirmButton: false }),
              (err) => swal.fire("Xatolik", err.error?.message || "Qaytarishda xatolik", "error"),
            );
        });
      }
    });
  }

  // ─── Bulk Payment (single button for all finances) ───

  addBulkPayment() {
    if (!this.currentID) return;

    const buildAccountChips = (currency: string): string => {
      const filtered = this.cashAccounts.filter((a) => a.currency === currency);
      if (!filtered.length) {
        return `<p class="pd-no-acc">Bu valyuta uchun hisob topilmadi</p>`;
      }
      return filtered
        .map(
          (a) =>
            `<button type="button" class="pd-acc-chip" data-id="${a.id}" title="${a.name}">
               <span class="pd-chip-name">${a.name}</span>
             </button>`,
        )
        .join("");
    };

    const html = `
      <style>
        .pd { text-align: left; font-family: inherit; }
        .pd-curr-row { display: flex; gap: 8px; margin-bottom: 18px; }
        .pd-curr-btn {
          flex: 1; padding: 10px 0; border-radius: 8px;
          border: 2px solid #ddd; background: #f5f5f5; color: #888;
          font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.18s;
          letter-spacing: 0.5px;
        }
        .pd-curr-btn.active {
          background: #1565c0; color: #fff; border-color: #1565c0;
          box-shadow: 0 2px 10px rgba(21,101,192,0.28);
        }
        .pd-field { margin-bottom: 16px; }
        .pd-lbl {
          display: block; font-size: 11px; font-weight: 700; color: #888;
          text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px;
        }
        .pd-lbl .req { color: #e53935; margin-left: 2px; }
        .pd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .pd-acc-chip {
          display: flex; align-items: center;
          padding: 8px 14px; border-radius: 20px;
          border: 2px solid #e0e0e0; background: #f9f9f9; color: #444;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.16s; max-width: 160px;
          white-space: nowrap; overflow: hidden;
        }
        .pd-acc-chip .pd-chip-name {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pd-acc-chip:hover { border-color: #90caf9; background: #e3f2fd; color: #1565c0; }
        .pd-acc-chip.selected {
          border-color: #1565c0; background: #1565c0; color: #fff;
          box-shadow: 0 2px 8px rgba(21,101,192,0.3);
        }
        .pd-no-acc { color: #e53935; font-size: 13px; margin: 0; }
        .pd-wrap { position: relative; }
        #pd-amount {
          padding-right: 56px; font-size: 22px; font-weight: 700;
          letter-spacing: 0.5px; border-radius: 8px; border: 2px solid #e0e0e0;
          transition: border-color 0.2s;
        }
        #pd-amount:focus { border-color: #1565c0; outline: none; box-shadow: 0 0 0 3px rgba(21,101,192,0.12); }
        .pd-curr-tag {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          font-size: 11px; font-weight: 700; color: #888;
          background: #efefef; border-radius: 5px; padding: 2px 7px;
          pointer-events: none;
        }
        #pd-comment { border-radius: 8px; font-size: 14px; }
      </style>
      <div class="pd">
        <div class="pd-curr-row">
          <button id="pd-uzs" type="button" class="pd-curr-btn active">UZS</button>
          <button id="pd-usd" type="button" class="pd-curr-btn">USD</button>
        </div>
        <div class="pd-field">
          <span class="pd-lbl">Hisob<span class="req">*</span></span>
          <div id="pd-chips" class="pd-chips">${buildAccountChips("UZS")}</div>
        </div>
        <div class="pd-field">
          <span class="pd-lbl">Summa<span class="req">*</span></span>
          <div class="pd-wrap">
            <input id="pd-amount" type="text" class="form-control" placeholder="0" autocomplete="off">
            <span id="pd-curr-tag" class="pd-curr-tag">UZS</span>
          </div>
        </div>
        <div class="pd-field">
          <span class="pd-lbl">Izoh</span>
          <input id="pd-comment" type="text" class="form-control" placeholder="Izoh...">
        </div>
      </div>`;

    swal.fire({
      title: "To'lov (barcha partiyalar uchun)",
      html,
      width: "min(440px, 95vw)",
      showCancelButton: true,
      confirmButtonText: "Tasdiqlash",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      didOpen: () => {
        const btnUzs   = document.getElementById("pd-uzs") as HTMLButtonElement;
        const btnUsd   = document.getElementById("pd-usd") as HTMLButtonElement;
        const chipsDiv = document.getElementById("pd-chips") as HTMLElement;
        const currTag  = document.getElementById("pd-curr-tag") as HTMLElement;
        const amtInput = document.getElementById("pd-amount") as HTMLInputElement;

        const attachChipListeners = () => {
          chipsDiv.querySelectorAll<HTMLButtonElement>(".pd-acc-chip").forEach((chip) => {
            chip.addEventListener("click", () => {
              chipsDiv.querySelectorAll(".pd-acc-chip").forEach((c) => c.classList.remove("selected"));
              chip.classList.add("selected");
            });
          });
        };

        const switchCurrency = (currency: string) => {
          currTag.textContent = currency;
          amtInput.value = "";
          chipsDiv.innerHTML = buildAccountChips(currency);
          attachChipListeners();
          btnUzs.classList.toggle("active", currency === "UZS");
          btnUsd.classList.toggle("active", currency === "USD");
        };

        btnUzs.addEventListener("click", () => switchCurrency("UZS"));
        btnUsd.addEventListener("click", () => switchCurrency("USD"));
        attachChipListeners();

        amtInput.addEventListener("input", () => {
          const raw = amtInput.value.replace(/[^\d.]/g, "");
          const parts = raw.split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
          if (parts.length > 2) parts.length = 2;
          amtInput.value = parts.join(".");
        });
      },
      preConfirm: () => {
        const chipsDiv  = document.getElementById("pd-chips") as HTMLElement;
        const amtInput  = document.getElementById("pd-amount") as HTMLInputElement;
        const comment   = (document.getElementById("pd-comment") as HTMLInputElement).value.trim();

        const selected  = chipsDiv.querySelector<HTMLButtonElement>(".pd-acc-chip.selected");
        const accountId = selected ? parseInt(selected.dataset["id"]) : NaN;
        const rawAmount = parseFloat(amtInput.value.replace(/\s/g, ""));

        if (!selected || isNaN(accountId)) {
          swal.showValidationMessage("Hisob tanlanmagan");
          return false;
        }
        if (!rawAmount || rawAmount <= 0) {
          swal.showValidationMessage("Summa musbat bo'lishi kerak");
          return false;
        }

        const account = this.cashAccounts.find((a) => a.id === accountId);
        if (!account) {
          swal.showValidationMessage("Hisob topilmadi");
          return false;
        }

        return {
          payments: [{
            method: this.getPaymentMethod(account.type, account.currency),
            currency: account.currency,
            amount_original: rawAmount,
            cash_account_id: accountId,
          }],
          comment: comment || null,
        };
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;

      const { payments, comment } = result.value;
      this.httpClient
        .post<any>(
          GlobalVars.baseUrl + "/finance-v2/pay-bulk",
          { customer_id: this.currentID, payments, comment },
          { headers: this.getHeaders() },
        )
        .subscribe(
          (data) => {
            if (data.status === "error") {
              swal.fire("Xatolik", data.message || data.error, "error");
              return;
            }
            this.getListOfPartyBoxes(this.currentID);
            if (data.overpayment_usd > 0) {
              this.handleOverpayment(data.overpayment_usd);
            } else {
              swal.fire({ icon: "success", title: data.message || "Muvaffaqiyat!", timer: 1500, showConfirmButton: false });
            }
          },
          (error) => {
            swal.fire("Xatolik", error.error?.message || error.error?.error || "Xatolik yuz berdi", "error");
          },
        );
    });
  }

  // ─── Navigate to Ledger ───

  goToLedger() {
    if (!this.currentID) return;
    this.router.navigate(["/uzm/transactions"], {
      queryParams: { customer_id: this.currentID },
    });
  }

  // ─── Services ───

  openServices() {
    // TODO: implement services dialog
  }

  // ─── Delivery ───

  openDeliveryForAll() {
    if (!this.currentID) return;
    this.selectedConsignmentId = "";
    this.selectedConsignmentName = "";
    this.selectedConsignmentWeight = "";
    this.selectedConsignmentQuantity = "";
    this.loadCustomerPackagesForDelivery();
    $("#deliveryCreationModal").modal("show");
  }

  openDeliveryCreationDirectly(
    id: string,
    name: string,
    weight: string,
    quantity: string,
  ) {
    this.selectedConsignmentId = id;
    this.selectedConsignmentName = name;
    this.selectedConsignmentWeight = weight;
    this.selectedConsignmentQuantity = quantity;

    this.loadCustomerPackagesForDelivery();
    $("#deliveryCreationModal").modal("show");
  }

  printPaymentReceiptFromModal() {
    if (!this.selectedConsignmentId) {
      swal.fire("Xatolik", "Consignment ma'lumotlari topilmadi", "error");
      return;
    }

    const selectedGroups = this.customerPackages.filter((g) => g.selected);

    if (selectedGroups.length === 0) {
      swal.fire("Xatolik", "Qutillar tanlanmagan", "error");
      return;
    }

    let totalPackages = 0;
    let totalItems = 0;
    let totalWeight = 0;
    const allBarcodes: string[] = [];
    const allConsignments: Set<string> = new Set();

    selectedGroups.forEach((group) => {
      if (group.type === "tied") {
        if (group.selectionType === "partial") {
          const currentConsignmentPackages = group.packages.filter(
            (pkg) => pkg.consignment === this.selectedConsignmentName,
          );
          currentConsignmentPackages.forEach((pkg) => {
            totalPackages++;
            totalItems += parseInt(pkg.items_count) || 0;
            totalWeight += parseFloat(pkg.weight) || 0;
            allBarcodes.push(pkg.barcode);
            allConsignments.add(pkg.consignment);
          });
        } else {
          if (group.packages && group.packages.length > 0) {
            group.packages.forEach((pkg) => {
              totalPackages++;
              totalItems += parseInt(pkg.items_count) || 0;
              totalWeight += parseFloat(pkg.weight) || 0;
              allBarcodes.push(pkg.barcode);
              allConsignments.add(pkg.consignment);
            });
          } else {
            totalPackages += group.total_packages || 0;
            totalItems += group.total_items || 0;
            if (group.weights && Array.isArray(group.weights)) {
              group.weights.forEach((w) => {
                totalWeight += parseFloat(w) || 0;
              });
            }
            if (group.package_barcodes && Array.isArray(group.package_barcodes)) {
              allBarcodes.push(...group.package_barcodes);
            }
            if (group.consignments && Array.isArray(group.consignments)) {
              group.consignments.forEach((c) => allConsignments.add(c));
            }
          }
        }
      } else if (group.type === "single") {
        if (group.packages && group.packages.length > 0) {
          const pkg = group.packages[0];
          totalPackages++;
          totalItems += parseInt(pkg.items_count) || 0;
          totalWeight += parseFloat(pkg.weight) || 0;
          allBarcodes.push(pkg.barcode);
          allConsignments.add(pkg.consignment);
        } else {
          totalPackages += group.total_packages || 0;
          totalItems += group.total_items || 0;
          if (group.weights && group.weights.length > 0) {
            totalWeight += parseFloat(group.weights[0]) || 0;
          }
          if (group.package_barcodes && group.package_barcodes.length > 0) {
            allBarcodes.push(group.package_barcodes[0]);
          }
          if (group.consignments && group.consignments.length > 0) {
            allConsignments.add(group.consignments[0]);
          }
        }
      }
    });

    let partyNameDisplay = "";
    if (allConsignments.size === 1) {
      partyNameDisplay = Array.from(allConsignments)[0];
    } else {
      partyNameDisplay = Array.from(allConsignments).join(", ");
    }

    this.printChekYuborish(
      this.selectedConsignmentId,
      partyNameDisplay,
      totalWeight.toFixed(2),
      totalItems,
      allBarcodes,
    );
  }

  printChekYuborish(ids, name, weight, counter, barcodes: string[] = []) {
    this.idsChek = this.currentID;
    this.nameChek = name;
    this.weightChek = weight;
    this.counterChek = counter;
    this.izohChek = this.deliveryNotes;

    this.printCondition3 = true;
    this.changeDetectorRef.detectChanges();

    this.printContents = document.getElementById("print-section3-v2").innerHTML;
    this.popupWin = window.open(
      "",
      "_blank",
      "top=0,left=0,height=100%,width=auto",
    );
    this.popupWin.document.open();
    this.popupWin.document.write(`
      <html>
        <head>
          <title>Print tab</title>
          <style>body { text-align: center; }</style>
        </head>
        <body onload="window.print(); window.close();"> ${this.printContents}</body>
      </html>`);
    this.popupWin.document.close();
    this.printCondition3 = false;
  }

  showDeliveryCreation() {
    $("#chekOptionsModal").modal("hide");
    setTimeout(() => {
      this.loadCustomerPackagesForDelivery();
      $("#deliveryCreationModal").modal("show");
    }, 300);
  }

  loadCustomerPackagesForDelivery() {
    this.loadingCustomerPackages = true;
    this.customerPackages = [];
    this.selectedPackageIdentifiers = [];
    this.showDebtWarning = false;
    this.packagesWithHighDebt = [];
    this.debtConsignments = [];
    this.totalDebtUzs = 0;
    this.totalDebtUsd = 0;

    this.httpClient
      .get<any>(
        GlobalVars.baseUrl + "/deliveries/admin?owner_id=" + this.currentID,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (result) => {
          if (result.status === "success") {
            this.customerPackages = result.data.package_groups || [];
            this.customerPhone = result.data.phone_number;

            this.checkForHighDebt();
            this.customerPackages.forEach((group) => (group.selected = true));
            this.updateSelectedPackages();
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni yuklashda xatolik",
              "error",
            );
          }
          this.loadingCustomerPackages = false;
        },
        (error) => {
          this.loadingCustomerPackages = false;
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  checkForHighDebt() {
    this.packagesWithHighDebt = [];
    this.debtConsignments = [];
    this.totalDebtUzs = 0;
    this.totalDebtUsd = 0;

    this.customerPackages.forEach((group) => {
      if (group.has_high_debt) {
        this.packagesWithHighDebt.push(group);
        if (
          group.consignments_with_debt &&
          group.consignments_with_debt.length > 0
        ) {
          group.consignments_with_debt.forEach((consignment) => {
            if (!this.debtConsignments.includes(consignment)) {
              this.debtConsignments.push(consignment);
            }
          });
        }
      }
      this.totalDebtUzs += group.debt_uzs || 0;
      this.totalDebtUsd += group.debt_usd || 0;
    });

    this.showDebtWarning = this.packagesWithHighDebt.length > 0;
  }

  updateSelectedPackages() {
    this.selectedPackageIdentifiers = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        this.selectedPackageIdentifiers.push(group.identifier);
      }
    });
  }

  selectDeliveryType(type: string) {
    this.deliveryType = type;

    if (type !== "Yandex" && type !== "Own-Courier") {
      this.deliveryAddress = "";
      this.courierName = "";
    }
  }

  areAllPackagesSelected(): boolean {
    if (this.customerPackages.length === 0) return false;
    return this.customerPackages.every((group) => group.selected);
  }

  toggleAllPackages(checked: boolean) {
    this.customerPackages.forEach((group) => {
      group.selected = checked;
      if (!checked) {
        group.selectionType = undefined;
        group.selectedConsignment = undefined;
      }
    });
    this.updateSelectedPackages();
  }

  onPackageSelectionChange(group: PackageGroup) {
    if (!group.selected) {
      group.selectionType = undefined;
      group.selectedConsignment = undefined;
    }
    this.updateSelectedPackages();
  }

  getTotalSelectedPackages(): number {
    return this.customerPackages
      .filter((group) => group.selected)
      .reduce((total, group) => total + group.total_packages, 0);
  }

  hasMultipleConsignments(group: PackageGroup): boolean {
    return (
      group.type === "tied" &&
      group.consignments.length > 1 &&
      group.consignments.includes(this.selectedConsignmentName) &&
      !group.selected
    );
  }

  getPackageCountForConsignment(
    group: PackageGroup,
    consignmentName: string,
  ): number {
    if (group.type === "single") {
      return group.consignments.includes(consignmentName) ? 1 : 0;
    }
    return group.packages.filter((pkg) => pkg.consignment === consignmentName)
      .length;
  }

  selectFullTiedGroup(group: PackageGroup) {
    group.selected = true;
    group.selectionType = "full";
    this.updateSelectedPackages();
  }

  selectOnlyCurrentConsignmentPackages(group: PackageGroup) {
    group.selected = true;
    group.selectionType = "partial";
    group.selectedConsignment = this.selectedConsignmentName;
    this.updateSelectedPackages();

    swal.fire({
      icon: "warning",
      title: "Bog'lanish buziladi",
      text: `Faqat ${this.selectedConsignmentName} qutilari tanlanadi. Boshqa qutillar bog'lanishdan chiqariladi va "collected" holatiga o'tkaziladi.`,
      confirmButtonText: "Tushunarli",
      customClass: { confirmButton: "btn btn-warning" },
      buttonsStyling: false,
    });
  }

  hasTiedPackagesSelected(): boolean {
    return this.customerPackages.some(
      (group) => group.selected && group.type === "tied",
    );
  }

  clearAllSelections() {
    this.customerPackages.forEach((group) => {
      group.selected = false;
      group.selectionType = undefined;
    });
    this.updateSelectedPackages();
  }

  canCreateDelivery(): boolean {
    if (this.selectedPackageIdentifiers.length === 0 || !this.deliveryType) {
      return false;
    }
    const hasUnbypassedDebt = this.customerPackages.some(
      (g) => g.selected && g.debt_uzs > 3000 && !g.forDebt,
    );
    if (hasUnbypassedDebt) return false;
    return true;
  }

  createDelivery() {
    if (!this.canCreateDelivery()) {
      swal.fire("Xatolik", "Barcha majburiy maydonlarni to'ldiring", "error");
      return;
    }

    this.creatingDelivery = true;

    if (this.selectedBranchId) {
      const selectedBranch = this.branches.find(
        (b) => b.id == this.selectedBranchId,
      );
      this.selectedBranchName = selectedBranch ? selectedBranch.name : "";
    }

    const packageIdentifiers = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        if (group.selectionType === "partial") {
          const currentConsignmentBarcodes = group.packages
            .filter((pkg) => pkg.consignment === this.selectedConsignmentName)
            .map((pkg) => pkg.barcode);
          packageIdentifiers.push(...currentConsignmentBarcodes);
        } else {
          packageIdentifiers.push(group.identifier);
        }
      }
    });

    const deliveryData = {
      owner_id: this.currentID,
      delivery_type: this.deliveryType,
      package_identifiers: packageIdentifiers,
      customer_phone: this.customerPhone,
      delivery_address: this.deliveryAddress || null,
      emu_branch_id: this.selectedBranchId || null,
      yandex_fee: this.yandexFee || null,
      courier_name: this.courierName || null,
      courier_phone: this.courierPhone || null,
      delivery_fee: this.deliveryFee || 0,
      notes: this.deliveryNotes || null,
      admin_created_by: localStorage.getItem("username") || null,
    };

    this.httpClient
      .post<any>(
        GlobalVars.baseUrl + "/deliveries/admin/create",
        deliveryData,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (result) => {
          if (result.status === "success") {
            this.deliveryBarcode = result.data.delivery_barcode;
            this.deliveryTypeText = this.getDeliveryTypeText(this.deliveryType);
            this.totalSelectedPackagesForPrint =
              this.getTotalSelectedPackages();
            this.currentDate = new Date().toLocaleDateString("uz-UZ");

            const selectedBarcodes = [];
            let totalItems = 0;
            let totalWeight = 0;
            const consignmentNames = new Set<string>();

            this.customerPackages.forEach((group) => {
              if (group.selected) {
                if (group.selectionType === "partial") {
                  const barcodes = group.packages
                    .filter(
                      (pkg) =>
                        pkg.consignment === this.selectedConsignmentName,
                    )
                    .map((pkg) => pkg.barcode);
                  selectedBarcodes.push(...barcodes);
                  group.packages
                    .filter(
                      (pkg) =>
                        pkg.consignment === this.selectedConsignmentName,
                    )
                    .forEach((pkg) => {
                      totalItems += parseInt(pkg.items_count) || 0;
                      totalWeight += parseFloat(pkg.weight) || 0;
                      consignmentNames.add(pkg.consignment);
                    });
                } else {
                  selectedBarcodes.push(...group.package_barcodes);
                  totalItems += group.total_items || 0;
                  if (group.packages && group.packages.length > 0) {
                    group.packages.forEach((pkg) => {
                      totalWeight += parseFloat(pkg.weight) || 0;
                    });
                  }
                  group.consignments.forEach((c) => consignmentNames.add(c));
                }
              }
            });

            this.selectedBarcodes = selectedBarcodes.join(", ");
            const consignmentNameDisplay =
              Array.from(consignmentNames).join(", ");

            // Print receipt only for Pick-up and Yandex deliveries
            if (this.deliveryType === 'Pick-up' || this.deliveryType === 'Yandex') {
              this.printChekYuborish(
                this.currentID,
                consignmentNameDisplay,
                totalWeight.toFixed(2),
                totalItems,
                selectedBarcodes,
              );
            }

            // Collect nasiya groups BEFORE closing modal
            const nasiyaGroups = this.customerPackages.filter(
              (g) => g.selected && g.forDebt && g.debt_uzs > 0,
            );

            this.closeDeliveryModal();
            this.getListOfPartyBoxes(this.currentID);

            if (nasiyaGroups.length > 0) {
              this.processNasiyaPayments(nasiyaGroups);
            }

            swal.fire({
              icon: "success",
              title: "Muvaffaqiyat!",
              text:
                nasiyaGroups.length > 0
                  ? "Yetkazish muvaffaqiyatli yaratildi. Nasiya to'lovlari qayd etildi."
                  : "Yetkazish muvaffaqiyatli yaratildi",
            });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Yetkazish yaratishda xatolik",
              "error",
            );
          }
          this.creatingDelivery = false;
        },
        (error) => {
          swal.fire("Xatolik", "Yetkazish yaratishda xatolik", "error");
          this.creatingDelivery = false;
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  // V2 nasiya: record via /finance-v2/deliver (debt remains on ledger)
  processNasiyaPayments(nasiyaGroups: PackageGroup[]) {
    const processedConsignments = new Set<string>();

    nasiyaGroups.forEach((group) => {
      const debtConsignments =
        group.consignments_with_debt && group.consignments_with_debt.length > 0
          ? group.consignments_with_debt
          : group.consignments;

      debtConsignments.forEach((consignmentName) => {
        if (processedConsignments.has(consignmentName)) return;
        processedConsignments.add(consignmentName);

        const consignmentRow = this.allDataBoxes?.find(
          (r) => r.name == consignmentName,
        );

        if (consignmentRow) {
          // V2: mark as delivered via /finance-v2/deliver, debt stays on ledger
          this.httpClient
            .post<any>(
              GlobalVars.baseUrl + "/finance-v2/deliver",
              { finance_id: consignmentRow.id },
              { headers: this.getHeaders() },
            )
            .subscribe(
              () => {
                this.getListOfPartyBoxes(this.currentID);
              },
              (error) => {
                console.error(
                  "Error recording nasiya for " + consignmentName,
                  error,
                );
                swal.fire(
                  "Xatolik",
                  consignmentName +
                    " uchun nasiya qayd etishda xatolik yuz berdi",
                  "error",
                );
              },
            );
        }
      });
    });
  }

  closeDeliveryModal() {
    $("#deliveryCreationModal").modal("hide");
    this.resetDeliveryForm();
  }

  resetDeliveryForm() {
    this.customerPackages = [];
    this.selectedPackageIdentifiers = [];
    this.deliveryType = "";
    this.customerPhone = "";
    this.deliveryAddress = "";
    this.courierName = "";
    this.courierPhone = "";
    this.deliveryFee = 0;
    this.yandexFee = 0;
    this.deliveryNotes = "";
    this.selectedRegionId = null;
    this.selectedBranchId = null;
    this.selectedBranchName = "";
    this.branches = [];

    this.showDebtWarning = false;
    this.packagesWithHighDebt = [];
    this.debtConsignments = [];
    this.totalDebtUzs = 0;
    this.totalDebtUsd = 0;

    this.isEmuDataAutoFilled = false;
    this.lastEmuDeliveryId = "";
    this.autoFilledFields = { regionId: false, branchId: false, phone: false };
  }

  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU",
      Yandex: "Yandex",
      "Own-Courier": "Kuryer",
      "Pick-up": "Olib ketish",
    };
    return types[type] || type;
  }

  // ─── EMU ───

  loadRegions() {
    this.httpClient
      .get<any>(GlobalVars.baseUrl + "/regions/emu", {
        headers: this.getHeaders(),
      })
      .subscribe(
        (result) => {
          if (result.status === "success") {
            this.regions = result.data.regions || [];
          }
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  onRegionSelect(event: any) {
    const regionId = event.target.value;

    if (this.autoFilledFields.regionId) {
      this.autoFilledFields.regionId = false;
    }
    this.selectedRegionId = regionId ? parseInt(regionId) : null;
    this.selectedBranchId = null;
    this.selectedBranchName = "";
    this.branches = [];

    if (regionId) {
      this.httpClient
        .get<any>(
          GlobalVars.baseUrl + "/branches?region_id=" + regionId,
          { headers: this.getHeaders() },
        )
        .subscribe(
          (result) => {
            if (result.status === "success") {
              this.branches = result.data.branches || [];
            }
          },
          (error) => {
            if (error.status === 403) this.authService.logout();
          },
        );
    }
  }

  getLastEmuDeliveryData(ownerId: string) {
    this.httpClient
      .get<any>(
        GlobalVars.baseUrl + "/deliveries/last_emu?owner_id=" + ownerId,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (result) => {
          if (result.status === "success" && result.data) {
            const lastDelivery = result.data;
            this.lastEmuDeliveryId = lastDelivery.delivery_id || "";

            if (lastDelivery.region_id) {
              this.selectedRegionId = lastDelivery.region_id;
              this.autoFilledFields.regionId = true;

              this.httpClient
                .get<any>(
                  GlobalVars.baseUrl +
                    "/branches?region_id=" +
                    lastDelivery.region_id,
                  { headers: this.getHeaders() },
                )
                .subscribe(
                  (branchResult) => {
                    if (branchResult.status === "success") {
                      this.branches = branchResult.data.branches || [];
                      if (lastDelivery.emu_branch_id) {
                        this.selectedBranchId = lastDelivery.emu_branch_id;
                        this.autoFilledFields.branchId = true;
                        const selectedBranch = this.branches.find(
                          (b) => b.id == lastDelivery.emu_branch_id,
                        );
                        this.selectedBranchName = selectedBranch
                          ? selectedBranch.name
                          : "";
                      }
                    }
                  },
                  (error) => {
                    if (error.status === 403) this.authService.logout();
                  },
                );
            }

            if (lastDelivery.customer_phone) {
              this.customerPhone = lastDelivery.customer_phone;
              this.autoFilledFields.phone = true;
            }

            this.isEmuDataAutoFilled = true;

            swal.fire({
              icon: "info",
              title: "Ma'lumot",
              html: `
                <p>Oxirgi EMU yetkazishdan ma'lumotlar avtomatik to'ldirildi:</p>
                <ul style="text-align: left;">
                  ${lastDelivery.region_name ? `<li><b>Viloyat:</b> ${lastDelivery.region_name}</li>` : ""}
                  ${lastDelivery.branch_name ? `<li><b>Filial:</b> ${lastDelivery.branch_name}</li>` : ""}
                  ${lastDelivery.customer_phone ? `<li><b>Telefon:</b> ${lastDelivery.customer_phone}</li>` : ""}
                </ul>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                  Barcha maydonlarni o'zgartirishingiz mumkin
                </p>
              `,
              timer: 5000,
              timerProgressBar: true,
              showConfirmButton: false,
              toast: true,
              position: "top-end",
            });
          }
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  onBranchManualChange() {
    if (this.autoFilledFields.branchId) {
      this.autoFilledFields.branchId = false;
    }
  }

  onPhoneManualChange() {
    if (this.autoFilledFields.phone) {
      this.autoFilledFields.phone = false;
    }
  }
}
