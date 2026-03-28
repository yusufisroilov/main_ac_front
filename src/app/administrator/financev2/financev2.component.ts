import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";
import swal from "sweetalert2";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

declare const $: any;

@Component({
  selector: "app-financev2",
  templateUrl: "./financev2.component.html",
  styleUrls: ["./financev2.component.css"],
})
export class Financev2Component implements OnInit {
  headerRow: string[] = [
    "No",
    "IDsi",
    "Kilosi",
    "USD da",
    "SO'M da",
    "Qarz $",
    "Qarz SO'M",
    "Yetkazildi",
    "Actions",
  ];

  allData: any[] = [];
  cashAccounts: any[] = [];

  currentPage: number = 0;
  totalPages: number = 0;
  needPagination: boolean = false;
  pageSize: number = 600;

  totalWeight: string = "0";
  totalUSD: string = "0";
  totalUZS: string = "0";
  totalDebtUSD: string = "0";
  totalDebtUZS: string = "0";

  currentParty: string = "";
  fxRate: number = 0;

  showLastFinance: boolean = false;
  enteredLast: string = "";
  enteredBeforeLast: string = "";

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.currentParty = localStorage.getItem("current_party") || "";
    this.loadCashAccounts();
    if (this.currentParty) {
      this.getListOfFinance();
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  // ─── Cash Accounts ───

  loadCashAccounts() {
    this.httpClient
      .get<any>(GlobalVars.baseUrl + "/finance-v2/cash-accounts?active=true", {
        headers: this.getHeaders(),
      })
      .subscribe(
        (data) => {
          this.cashAccounts = data.accounts || [];
        },
        (error) => {
          console.error("Failed to load cash accounts:", error);
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  buildPaymentFieldsHtml(): string {
    let html = '<div class="form-group">';
    for (const acc of this.cashAccounts) {
      html += `<input id="input-acc-${acc.id}" type="number" class="form-control m-2" placeholder="${acc.name} (${acc.currency})" />`;
    }
    html +=
      '<input id="input-izoh" type="text" class="form-control m-2" placeholder="IZOH" />';
    html += "</div>";
    return html;
  }

  getPaymentMethod(type: string, currency: string): string {
    if (type === "CASH" && currency === "USD") return "USD_CASH";
    if (type === "CASH" && currency === "UZS") return "UZS_CASH";
    if (type === "CARD") return "PLASTIC";
    if (type === "BANK") return "BANK";
    return "UZS_CASH";
  }

  buildPaymentsFromDialog(): any[] {
    const payments = [];
    for (const acc of this.cashAccounts) {
      const el = document.getElementById(
        `input-acc-${acc.id}`,
      ) as HTMLInputElement;
      const val = parseFloat(el?.value) || 0;
      if (val > 0) {
        payments.push({
          method: this.getPaymentMethod(acc.type, acc.currency),
          currency: acc.currency,
          amount_original: val,
          cash_account_id: acc.id,
        });
      }
    }
    return payments;
  }

  // ─── Consignment Selection ───

  findConsignmentByName() {
    swal
      .fire({
        title: "Partiya Raqamini Qidirish",
        html:
          '<div class="form-group">' +
          '<input id="name" type="text" class="form-control m-2" placeholder="Partiya Raqami..." />' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "Qidirish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          const input = document.getElementById("name");
          if (input) input.focus();
        },
        preConfirm: () => {
          const name = ($("#name").val() as string) || "";
          if (!name) return;

          this.httpClient
            .get<any>(GlobalVars.baseUrl + "/consignments/info?name=" + name, {
              headers: this.getHeaders(),
            })
            .subscribe(
              (data) => {
                if (data.status === "error") {
                  swal.fire("Topilmadi", data.message || data.error, "error");
                  return;
                }
                this.currentParty = data.consignment.name;
                localStorage.setItem("current_party", data.consignment.name);
                this.getListOfFinance();
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
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: this.currentParty + " Partiya Ochildi",
            customClass: { confirmButton: "btn btn-success" },
            buttonsStyling: false,
          });
        }
      });
  }

  // ─── Finance List ───

  getListOfFinance() {
    this.httpClient
      .get<any>(
        GlobalVars.baseUrl +
          "/finance-v2/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (data) => {
          this.allData = (data.finances || []).map((f: any) => ({
            id: f.id,
            customer_id: f.customer_id,
            weight: f.billable_weight_kg,
            amount_usd: f.amount_usd,
            amount_uzs: f.amount_uzs_locked,
            debt_usd: f.debt_usd,
            debt_uzs: f.debt_uzs,
            delivered: f.delivered,
            consignment: f.consignment,
          }));
          // console.log("all data ", this.allData);

          this.totalWeight = data.totalWeight || "0";
          this.totalUSD = data.totalUSD || "0";
          this.totalUZS = data.totalUZS || "0";
          this.totalDebtUSD = data.totalDebtUSD || "0";
          this.totalDebtUZS = data.totalDebtUZS || "0";
          this.fxRate = data.fxRate || 0;

          this.currentPage = data.currentPage || 0;
          this.totalPages = data.totalPages || 0;
          this.needPagination = this.totalPages > 1;
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  getListOfFinanceWithFilter(id: string) {
    const ownerId = id || "";
    this.httpClient
      .get<any>(
        GlobalVars.baseUrl +
          "/finance-v2/list?size=" +
          this.pageSize +
          "&ownerId=" +
          ownerId,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (data) => {
          this.allData = (data.finances || []).map((f: any) => ({
            id: f.id,
            customer_id: f.customer_id,
            weight: f.billable_weight_kg,
            amount_usd: f.amount_usd,
            amount_uzs: f.amount_uzs_locked,
            debt_usd: f.debt_usd,
            debt_uzs: f.debt_uzs,
            delivered: f.delivered,
            consignment: f.consignment,
          }));

          this.totalWeight = data.totalWeight || "0";
          this.totalUSD = data.totalUSD || "0";
          this.totalUZS = data.totalUZS || "0";
          this.totalDebtUSD = data.totalDebtUSD || "0";
          this.totalDebtUZS = data.totalDebtUZS || "0";
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  getListwithFiltr(cond: string) {
    this.httpClient
      .get<any>(
        GlobalVars.baseUrl +
          "/finance-v2/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          "&delivered=" +
          cond,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (data) => {
          this.allData = (data.finances || []).map((f: any) => ({
            id: f.id,
            customer_id: f.customer_id,
            weight: f.billable_weight_kg,
            amount_usd: f.amount_usd,
            amount_uzs: f.amount_uzs_locked,
            debt_usd: f.debt_usd,
            debt_uzs: f.debt_uzs,
            delivered: f.delivered,
            consignment: f.consignment,
          }));

          this.totalWeight = data.totalWeight || "0";
          this.totalUSD = data.totalUSD || "0";
          this.totalUZS = data.totalUZS || "0";
          this.totalDebtUSD = data.totalDebtUSD || "0";
          this.totalDebtUZS = data.totalDebtUZS || "0";
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  // ─── Pagination ───

  onPageChanged(pageIndex: number) {
    this.currentPage = pageIndex;
    document.getElementById("listcard")?.scrollIntoView({ behavior: "smooth" });
    this.getListOfFinance();
  }

  // ─── Record Finance (Weighing) ───

  recordFinance() {
    swal
      .fire({
        title: "XISOB KITOB QO'SHISH!",
        html:
          '<div class="form-group">' +
          '<input id="input-owid" type="text" class="form-control m-2" placeholder="Mijoz IDsi" />' +
          '<input id="input-weight" type="text" class="form-control m-2" placeholder="Yuk Og\'irligi" />' +
          "</div>",
        confirmButtonText: "QO'SHISH",
        customClass: { confirmButton: "btn btn-success" },
        buttonsStyling: false,
        didOpen: () => {
          this.showLastFinance = true;
          $("input[id=input-owid]").filter(":visible").focus();
        },
        preConfirm: () => {
          this.enteredBeforeLast = this.enteredLast;
          const ownerId = $("#input-owid").val();
          const weight = $("#input-weight").val();
          this.enteredLast = ownerId + " ID ga " + weight + " kg";

          this.httpClient
            .post<any>(
              GlobalVars.baseUrl +
                "/finance-v2/add?owner_id=" +
                ownerId +
                "&weight=" +
                weight +
                "&name=" +
                (localStorage.getItem("current_party") || ""),
              {},
              { headers: this.getHeaders() },
            )
            .subscribe(
              (data) => {
                if (data.status === "error") {
                  swal
                    .fire("Qo'shilmadi", data.message || data.error, "error")
                    .then((r) => {
                      if (r.isConfirmed) this.recordFinance();
                    });
                } else {
                  this.getListOfFinance();
                }
              },
              (error) => {
                swal
                  .fire(
                    "Qo'shilmadi",
                    `BAD REQUEST: ${error.error?.error || error.message}`,
                    "error",
                  )
                  .then((r) => {
                    if (r.isConfirmed) this.recordFinance();
                  });
                if (error.status === 403) this.authService.logout();
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.recordFinance();
        }
      });
  }

  // ─── Add Payment ───

  addFinance(finId: number) {
    swal
      .fire({
        title: "Xisob Qo'shish!",
        html: this.buildPaymentFieldsHtml(),
        showCancelButton: true,
        confirmButtonText: "BERDI",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const payments = this.buildPaymentsFromDialog();
          const izoh = ($("#input-izoh").val() as string) || "";

          if (payments.length === 0) return;

          this.httpClient
            .post<any>(
              GlobalVars.baseUrl + "/finance-v2/pay",
              { finance_id: finId, payments, comment: izoh },
              { headers: this.getHeaders() },
            )
            .subscribe(
              (data) => {
                if (data.status === "error") {
                  swal.fire("Qo'shilmadi", data.message || data.error, "error");
                } else {
                  this.getListOfFinance();
                }
              },
              (error) => {
                swal.fire(
                  "Qo'shilmadi",
                  `Xato: ${error.error?.message || error.message}`,
                  "error",
                );
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: "MUVAFFAQIYATLI!",
            customClass: { confirmButton: "btn btn-success" },
            buttonsStyling: false,
          });
        }
      });
  }

  // ─── Edit Finance (Weight/Rate) ───

  editFinance(finId: number, weight: string) {
    swal
      .fire({
        title: "Xisob O'zgartirish!",
        html:
          '<div class="form-group">' +
          '<input id="input-weight" type="text" class="form-control m-2" placeholder="Kilosi" />' +
          '<input id="input-rate" type="text" class="form-control m-2" placeholder="RATE ($/kg)" />' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "O'zgartish",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-weight").val(weight);
        },
        preConfirm: () => {
          let weight2 = $("#input-weight").val();
          if (weight2 == weight) weight2 = "";
          const rate2 = $("#input-rate").val();

          const body: any = { finance_id: finId };
          if (weight2) body.weight = weight2;
          if (rate2) body.perKg = rate2;

          if (!weight2 && !rate2) return;

          this.httpClient
            .post<any>(GlobalVars.baseUrl + "/finance-v2/edit", body, {
              headers: this.getHeaders(),
            })
            .subscribe(
              (data) => {
                if (data.status === "error") {
                  swal.fire("Xatolik", data.message || data.error, "error");
                } else {
                  this.getListOfFinance();
                }
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
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.getListOfFinance();
          swal.fire({
            icon: "success",
            html: "MUVAFFAQIYATLI O'ZGARTIRILDI!",
            customClass: { confirmButton: "btn btn-success" },
            buttonsStyling: false,
          });
        }
      });
  }

  // ─── Mark Delivered ───

  deliveredFunc(finId: number, ownerId: number) {
    swal
      .fire({
        title: "Bu yuki yetkazildimi?",
        text: "ID " + ownerId + "ning Yuki yetkazilganini tasdiqlaysizmi?",
        icon: "warning",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        confirmButtonText: "Ha, Yetkazildi!",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          this.httpClient
            .post<any>(
              GlobalVars.baseUrl + "/finance-v2/deliver",
              { finance_id: finId },
              { headers: this.getHeaders() },
            )
            .subscribe(
              (data) => {
                let msg = "Bu yuk yetkazildi.";
                if (data.is_nasiya) {
                  msg += ` Qarz: $${data.remaining_debt_usd} (nasiya)`;
                }
                swal.fire({
                  title: "Tasdiqlandi!",
                  text: msg,
                  icon: "success",
                  customClass: { confirmButton: "btn btn-success" },
                  buttonsStyling: false,
                });
                this.getListOfFinance();
              },
              (error) => {
                swal.fire("Xatolik", "Yetkazishda xatolik yuz berdi", "error");
                if (error.status === 403) this.authService.logout();
              },
            );
        }
      });
  }

  // ─── Excel Download ───

  fetchFinancesOfCons() {
    if (!this.currentParty) {
      swal.fire("Xatolik", "Avval partiyani tanlang", "warning");
      return;
    }
    this.httpClient
      .get(
        GlobalVars.baseUrl +
          `/finance-v2/download-excel?consignment=${this.currentParty}`,
        {
          headers: this.getHeaders(),
          responseType: "blob",
        },
      )
      .subscribe(
        (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Xisob_Kitob_V2_${this.currentParty}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          swal.fire("Xatolik", "Excel yuklab olishda xatolik", "error");
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  // ─── Helpers ───

  checkDebt(debtUzs: number): string {
    return debtUzs <= 5000 ? "less" : "g";
  }

  gototransactions() {
    this.router.navigate(["/uzm/transactions"]);
  }
}
