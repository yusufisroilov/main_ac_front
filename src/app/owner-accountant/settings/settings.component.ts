import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

@Component({
  selector: "app-oa-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
})
export class OaSettingsComponent implements OnInit {
  activeTab: "expense" | "income" = "expense";

  expenseCategories: any[] = [];
  incomeCategories: any[] = [];
  loadingExpense = false;
  loadingIncome = false;

  constructor(private http: HttpClient, public authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.loadExpenseCategories();
    this.loadIncomeCategories();
  }

  switchTab(tab: "expense" | "income") {
    this.activeTab = tab;
  }

  // ── Expense Categories ──

  loadExpenseCategories() {
    this.loadingExpense = true;
    this.http
      .get<any>(GlobalVars.baseUrl + "/expense-categories", { headers: this.getHeaders() })
      .subscribe(
        (data) => { this.expenseCategories = data.categories || []; this.loadingExpense = false; },
        (error) => { this.loadingExpense = false; if (error.status === 403) this.authService.logout(); },
      );
  }

  addExpenseCategory() {
    swal.fire({
      title: "Yangi Xarajat Kategoriyasi",
      input: "text",
      inputPlaceholder: "Kategoriya nomi...",
      showCancelButton: true,
      confirmButtonText: "Yaratish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      inputValidator: (value) => (!value || !value.trim()) ? "Nomini kiriting" : null,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.post<any>(GlobalVars.baseUrl + "/expense-categories", { name: result.value.trim() }, { headers: this.getHeaders() }).subscribe(
          (data) => {
            if (data.status === "ok") { this.loadExpenseCategories(); swal.fire({ icon: "success", title: "Yaratildi!", timer: 1200, showConfirmButton: false }); }
            else { swal.fire("Xatolik", data.error, "error"); }
          },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  editExpenseCategory(cat: any) {
    swal.fire({
      title: "Tahrirlash",
      input: "text",
      inputValue: cat.name,
      showCancelButton: true,
      confirmButtonText: "Saqlash",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      inputValidator: (value) => (!value || !value.trim()) ? "Nomini kiriting" : null,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.put<any>(GlobalVars.baseUrl + "/expense-categories/" + cat.id, { name: result.value.trim() }, { headers: this.getHeaders() }).subscribe(
          (data) => { if (data.status === "ok") this.loadExpenseCategories(); else swal.fire("Xatolik", data.error, "error"); },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  deactivateExpenseCategory(cat: any) {
    swal.fire({
      title: "O'chirishni tasdiqlang",
      text: `"${cat.name}" kategoriyasini o'chirmoqchimisiz?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "O'chirish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.patch<any>(GlobalVars.baseUrl + "/expense-categories/" + cat.id + "/deactivate", {}, { headers: this.getHeaders() }).subscribe(
          () => this.loadExpenseCategories(),
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  // ── Income Categories ──

  loadIncomeCategories() {
    this.loadingIncome = true;
    this.http
      .get<any>(GlobalVars.baseUrl + "/income-categories", { headers: this.getHeaders() })
      .subscribe(
        (data) => { this.incomeCategories = data.categories || []; this.loadingIncome = false; },
        (error) => { this.loadingIncome = false; if (error.status === 403) this.authService.logout(); },
      );
  }

  addIncomeCategory() {
    swal.fire({
      title: "Yangi Daromad Kategoriyasi",
      input: "text",
      inputPlaceholder: "Kategoriya nomi...",
      showCancelButton: true,
      confirmButtonText: "Yaratish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      inputValidator: (value) => (!value || !value.trim()) ? "Nomini kiriting" : null,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.post<any>(GlobalVars.baseUrl + "/income-categories", { name: result.value.trim() }, { headers: this.getHeaders() }).subscribe(
          (data) => {
            if (data.status === "ok") { this.loadIncomeCategories(); swal.fire({ icon: "success", title: "Yaratildi!", timer: 1200, showConfirmButton: false }); }
            else { swal.fire("Xatolik", data.error, "error"); }
          },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  editIncomeCategory(cat: any) {
    swal.fire({
      title: "Tahrirlash",
      input: "text",
      inputValue: cat.name,
      showCancelButton: true,
      confirmButtonText: "Saqlash",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
      inputValidator: (value) => (!value || !value.trim()) ? "Nomini kiriting" : null,
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.http.put<any>(GlobalVars.baseUrl + "/income-categories/" + cat.id, { name: result.value.trim() }, { headers: this.getHeaders() }).subscribe(
          (data) => { if (data.status === "ok") this.loadIncomeCategories(); else swal.fire("Xatolik", data.error, "error"); },
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  deactivateIncomeCategory(cat: any) {
    swal.fire({
      title: "O'chirishni tasdiqlang",
      text: `"${cat.name}" kategoriyasini o'chirmoqchimisiz?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "O'chirish",
      cancelButtonText: "Bekor",
      customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary" },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.patch<any>(GlobalVars.baseUrl + "/income-categories/" + cat.id + "/deactivate", {}, { headers: this.getHeaders() }).subscribe(
          () => this.loadIncomeCategories(),
          (error) => swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error"),
        );
      }
    });
  }

  get activeExpenseCount(): number { return this.expenseCategories.filter(c => c.is_active).length; }
  get activeIncomeCount(): number { return this.incomeCategories.filter(c => c.is_active).length; }
}
