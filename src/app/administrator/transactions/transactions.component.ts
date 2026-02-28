import { Component, OnInit } from "@angular/core";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { DatePipe } from "@angular/common";

declare const $: any;

@Component({
  selector: "app-transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.css"],
})
export class TransactionsComponent implements OnInit {
  // Tab control: 'v2' (default) or 'v1'
  activeTab: string = "v2";

  // HTTP options
  headers12: any;
  options: any;

  // ──── V2 Ledger state ────
  v2Entries: any[] = [];
  v2Loading: boolean = false;
  v2CurrentPage: number = 0;
  v2PageSize: number = 100;
  v2TotalItems: number = 0;
  v2TotalPages: number = 0;
  v2NeedPagination: boolean = false;

  // V2 Filters
  v2FilterCustomerId: string = "";
  v2FilterConsignment: string = "";
  v2FilterType: string = "";
  v2FilterStartDate: string = "";
  v2FilterEndDate: string = "";

  // ──── V1 Transactions state ────
  allTransactions: any[] = [];
  v1Loading: boolean = false;
  currentPage: number = 0;
  totalPages: number = 0;
  pageSize: number = 200;
  needPagination: boolean = false;
  mypages = [];

  // V1 Filters
  danValue: string;
  gachaValue: string;

  registredMessage: any;

  constructor(
    private datePipe: DatePipe,
    private http: Http,
    public authService: AuthService,
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  ngOnInit(): void {
    // V2 loads by default
    this.loadV2Ledger();
  }

  // ═══════════════════════════════════════════════════
  // TAB SWITCHING
  // ═══════════════════════════════════════════════════

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === "v2" && this.v2Entries.length === 0) {
      this.loadV2Ledger();
    }
    if (tab === "v1" && this.allTransactions.length === 0) {
      this.getListOfTransactions();
    }
  }

  // ═══════════════════════════════════════════════════
  // V2 LEDGER
  // ═══════════════════════════════════════════════════

  loadV2Ledger() {
    this.v2Loading = true;
    let url =
      `${GlobalVars.baseUrl}/finance-v2/ledger-list?page=${this.v2CurrentPage}&size=${this.v2PageSize}`;

    if (this.v2FilterCustomerId) {
      url += `&customer_id=${this.v2FilterCustomerId}`;
    }
    if (this.v2FilterConsignment) {
      url += `&consignment=${this.v2FilterConsignment}`;
    }
    if (this.v2FilterType) {
      url += `&type=${this.v2FilterType}`;
    }
    if (this.v2FilterStartDate) {
      url += `&start_date=${this.v2FilterStartDate}`;
    }
    if (this.v2FilterEndDate) {
      url += `&end_date=${this.v2FilterEndDate}`;
    }

    this.http.get(url, this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "ok") {
          this.v2Entries = result.entries || [];
          this.v2TotalItems = result.totalItems || 0;
          this.v2TotalPages = result.totalPages || 0;
          this.v2CurrentPage = result.currentPage || 0;
          this.v2NeedPagination = this.v2TotalPages > 1;
        }
        this.v2Loading = false;
      },
      (error) => {
        this.v2Loading = false;
        if (error.status === 403) {
          this.authService.logout();
        }
      },
    );
  }

  applyV2Filters() {
    this.v2CurrentPage = 0;
    this.loadV2Ledger();
  }

  clearV2Filters() {
    this.v2FilterCustomerId = "";
    this.v2FilterConsignment = "";
    this.v2FilterType = "";
    this.v2FilterStartDate = "";
    this.v2FilterEndDate = "";
    this.v2CurrentPage = 0;
    this.loadV2Ledger();
  }

  onV2PageChanged(pageIndex: number) {
    this.v2CurrentPage = pageIndex;
    document
      .getElementById("listcard")
      ?.scrollIntoView({ behavior: "smooth" });
    this.loadV2Ledger();
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case "CHARGE":
        return "badge-charge";
      case "PAYMENT":
        return "badge-payment";
      case "BONUS":
        return "badge-bonus";
      case "ADJUSTMENT":
        return "badge-adjustment";
      default:
        return "badge-secondary";
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case "CHARGE":
        return "Hisob";
      case "PAYMENT":
        return "To'lov";
      case "BONUS":
        return "Bonus";
      case "ADJUSTMENT":
        return "Tuzatish";
      default:
        return type;
    }
  }

  getMethodLabel(method: string): string {
    if (!method) return "-";
    switch (method) {
      case "UZS_CASH":
        return "Naqd";
      case "USD_CASH":
        return "USD";
      case "PLASTIC":
        return "Plastik";
      case "BANK":
        return "Bank";
      default:
        return method;
    }
  }

  formatCurrency(value: number): string {
    if (value == null) return "0";
    const intPart = Math.floor(Math.abs(value));
    const formatted = intPart
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return value < 0 ? "-" + formatted : formatted;
  }

  // ═══════════════════════════════════════════════════
  // V1 TRANSACTIONS (kept as-is)
  // ═══════════════════════════════════════════════════

  /**
   * Handle page change from pagination component
   */
  onPageChanged(pageIndex: number) {
    this.currentPage = pageIndex;
    document
      .getElementById("listcard")
      ?.scrollIntoView({ behavior: "smooth" });
    this.getListOfTransactions();
  }

  danFunction(date) {
    this.danValue = this.datePipe.transform(date.value, "dd/MM/yyyy");
  }

  gachaFunction(date) {
    this.gachaValue = this.datePipe.transform(date.value, "dd/MM/yyyy");
  }

  getListOfTransactionsWithDate() {
    this.v1Loading = true;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/transactions/list?from_date=" +
          this.danValue +
          "&to_date=" +
          this.gachaValue,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allTransactions = response.json().transactions;
          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          this.needPagination = this.totalPages > 1;
          this.v1Loading = false;
        },
        (error) => {
          this.v1Loading = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  editTransaction(finID) {
    swal
      .fire({
        title: "Xisobni sanasini to'g'irlash",
        html:
          '<div class="form-group">' +
          '<input id="input-finid" type="text" class="form-control m-2" readonly placeholder="Tracking Number" />' +
          '<input id="inputsana" type="date" class="form-control m-2" />' +
          "</div>",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-finid").val(finID);
        },
        preConfirm: () => {
          let dateed = $("#inputsana").val();
          return this.http
            .post(
              GlobalVars.baseUrl +
                "/transactions/edit?transaction_id=" +
                finID +
                "&date=" +
                dateed,
              "",
              this.options,
            )
            .toPromise()
            .then((response) => {
              if (response.json().status == "error") {
                swal.showValidationMessage(response.json().error);
                return false;
              }
              this.getListOfTransactions();
              return true;
            })
            .catch((error) => {
              swal.showValidationMessage("Xatolik yuz berdi");
              return false;
            });
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          swal.fire({
            icon: "success",
            html: "Sana muvaffaqiyatli o'zgartirildi!",
            customClass: { confirmButton: "btn btn-success" },
            buttonsStyling: false,
          });
        }
      });
  }

  getListOfTransactions() {
    this.v1Loading = true;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/transactions/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allTransactions = response.json().transactions;
          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          this.needPagination = this.totalPages > 1;
          this.v1Loading = false;
        },
        (error) => {
          this.v1Loading = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  getListOfTransactionsWithFilter(clientId, partiya) {
    let filterLink = "&ownerID=" + clientId + "&consignment=" + partiya;
    this.v1Loading = true;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/transactions/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          filterLink,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allTransactions = response.json().transactions;
          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          this.needPagination = this.totalPages > 1;
          this.v1Loading = false;
        },
        (error) => {
          this.v1Loading = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }
}
