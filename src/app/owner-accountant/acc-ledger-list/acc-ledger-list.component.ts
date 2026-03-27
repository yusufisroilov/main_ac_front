import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";

interface LedgerEntry {
  id: number;
  type: string;
  amount: number;
  currency: string;
  amount_usd: number | null;
  fx_rate: number | null;
  comment: string;
  created_at: string;
  accountName?: string;
  accountCurrency?: string;
}

interface CashAccountOption {
  id: number;
  name: string;
  currency: string;
}

@Component({
  selector: "app-acc-ledger-list",
  templateUrl: "./acc-ledger-list.component.html",
  styleUrls: ["./acc-ledger-list.component.css"],
})
export class AccLedgerListComponent implements OnInit {
  entries: LedgerEntry[] = [];
  accounts: CashAccountOption[] = [];
  loading = false;

  // Pagination
  currentPage = 0;
  pageSize = 100;
  totalItems = 0;
  totalPages = 0;

  // Filters
  showFilters = false;
  filterType = "";
  filterAccountId: number | null = null;
  filterComment = "";
  filterStartDate = "";
  filterEndDate = "";

  typeOptions = [
    { value: "", label: "Barchasi" },
    { value: "PAYMENT_IN", label: "To'lov" },
    { value: "EXPENSE", label: "Xarajat" },
    { value: "INCOME", label: "Daromad" },
    { value: "OWNER_DRAW", label: "Owner Draw" },
    { value: "TRANSFER_IN", label: "Transfer (kirish)" },
    { value: "TRANSFER_OUT", label: "Transfer (chiqish)" },
  ];

  private headers: HttpHeaders;
  private commentTimeout: any;

  constructor(private http: HttpClient) {
    const token = localStorage.getItem("token") || "";
    this.headers = new HttpHeaders({
      Authorization: token,
      "Content-Type": "application/json",
    });
  }

  ngOnInit() {
    this.loadAccounts();
    this.loadData();
  }

  loadAccounts() {
    this.http
      .get<any>(GlobalVars.baseUrl + "/cash-accounts", {
        headers: this.headers,
      })
      .subscribe(
        (res) => {
          this.accounts = (res.accounts || res.data || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            currency: a.currency,
          }));
        },
        (err) => console.error("Error loading accounts:", err),
      );
  }

  loadData() {
    this.loading = true;
    let params = new HttpParams()
      .set("page", this.currentPage.toString())
      .set("size", this.pageSize.toString());

    if (this.filterType) params = params.set("type", this.filterType);
    if (this.filterAccountId)
      params = params.set("cash_account_id", this.filterAccountId.toString());
    if (this.filterComment)
      params = params.set("comment", this.filterComment);
    if (this.filterStartDate)
      params = params.set("start_date", this.filterStartDate);
    if (this.filterEndDate)
      params = params.set("end_date", this.filterEndDate);

    this.http
      .get<any>(GlobalVars.baseUrl + "/cash-accounts/ledger/all", {
        headers: this.headers,
        params,
      })
      .subscribe(
        (res) => {
          this.entries = (res.entries || []).map((e: any) => ({
            ...e,
            accountName: e.cashAccount?.name || e.cash_account?.name || e.accountName || "",
            accountCurrency: e.cashAccount?.currency || e.cash_account?.currency || e.accountCurrency || "",
          }));
          this.totalItems = res.totalItems || 0;
          this.totalPages = res.totalPages || 0;
          this.loading = false;
        },
        (err) => {
          console.error("Error loading ledger:", err);
          this.loading = false;
        },
      );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadData();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadData();
  }

  onCommentInput(value: string) {
    clearTimeout(this.commentTimeout);
    this.commentTimeout = setTimeout(() => {
      this.filterComment = value.trim();
      this.onFilterChange();
    }, 500);
  }

  clearFilters() {
    this.filterType = "";
    this.filterAccountId = null;
    this.filterComment = "";
    this.filterStartDate = "";
    this.filterEndDate = "";
    this.currentPage = 0;
    this.loadData();
  }

  get hasFilters(): boolean {
    return (
      !!this.filterType ||
      this.filterAccountId !== null ||
      !!this.filterComment ||
      !!this.filterStartDate ||
      !!this.filterEndDate
    );
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  getTypeLabel(type: string): string {
    const opt = this.typeOptions.find((t) => t.value === type);
    return opt ? opt.label : type;
  }

  getTypeClass(type: string): string {
    switch (type) {
      case "PAYMENT_IN": return "badge-success";
      case "EXPENSE": return "badge-danger";
      case "INCOME": return "badge-warning";
      case "OWNER_DRAW": return "badge-purple";
      case "TRANSFER_IN": return "badge-info";
      case "TRANSFER_OUT": return "badge-secondary";
      default: return "badge-secondary";
    }
  }

  isIncoming(type: string): boolean {
    return ["PAYMENT_IN", "INCOME", "TRANSFER_IN"].includes(type);
  }

  formatAmount(entry: LedgerEntry): string {
    const sign = this.isIncoming(entry.type) ? "+" : "-";
    const abs = Math.abs(entry.amount);
    if (entry.currency === "UZS") {
      return sign + abs.toLocaleString("uz") + " so'm";
    }
    return sign + "$" + abs.toFixed(2);
  }

  formatUsdEquiv(entry: LedgerEntry): string | null {
    if (entry.currency !== "UZS" || !entry.amount_usd) return null;
    const sign = this.isIncoming(entry.type) ? "+" : "";
    return sign + "$" + Math.abs(entry.amount_usd).toFixed(2);
  }
}
