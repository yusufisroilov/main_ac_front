import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import swal from "sweetalert2";

@Component({
  selector: "app-expense-categories",
  templateUrl: "./expense-categories.component.html",
  styleUrls: ["./expense-categories.component.css"],
})
export class ExpenseCategoriesComponent implements OnInit {
  categories: any[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.http
      .get<any>(GlobalVars.baseUrl + "/expense-categories", {
        headers: this.getHeaders(),
      })
      .subscribe(
        (data) => {
          this.categories = data.categories || [];
          this.loading = false;
        },
        (error) => {
          this.loading = false;
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  addCategory() {
    swal
      .fire({
        title: "Yangi Kategoriya",
        input: "text",
        inputPlaceholder: "Kategoriya nomi...",
        showCancelButton: true,
        confirmButtonText: "Yaratish",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        inputValidator: (value) => {
          if (!value || !value.trim()) return "Nomini kiriting";
          return null;
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          this.http
            .post<any>(
              GlobalVars.baseUrl + "/expense-categories",
              { name: result.value.trim() },
              { headers: this.getHeaders() },
            )
            .subscribe(
              (data) => {
                if (data.status === "ok") {
                  this.loadCategories();
                  swal.fire({ icon: "success", title: "Yaratildi!", timer: 1500, showConfirmButton: false });
                } else {
                  swal.fire("Xatolik", data.error, "error");
                }
              },
              (error) => {
                swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error");
              },
            );
        }
      });
  }

  editCategory(cat: any) {
    swal
      .fire({
        title: "Kategoriyani tahrirlash",
        input: "text",
        inputValue: cat.name,
        showCancelButton: true,
        confirmButtonText: "Saqlash",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        inputValidator: (value) => {
          if (!value || !value.trim()) return "Nomini kiriting";
          return null;
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          this.http
            .put<any>(
              GlobalVars.baseUrl + "/expense-categories/" + cat.id,
              { name: result.value.trim() },
              { headers: this.getHeaders() },
            )
            .subscribe(
              (data) => {
                if (data.status === "ok") {
                  this.loadCategories();
                } else {
                  swal.fire("Xatolik", data.error, "error");
                }
              },
              (error) => {
                swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error");
              },
            );
        }
      });
  }

  deactivateCategory(cat: any) {
    swal
      .fire({
        title: "O'chirishni tasdiqlang",
        text: `"${cat.name}" kategoriyasini o'chirmoqchimisiz?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "O'chirish",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-danger",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .patch<any>(
              GlobalVars.baseUrl + "/expense-categories/" + cat.id + "/deactivate",
              {},
              { headers: this.getHeaders() },
            )
            .subscribe(
              () => this.loadCategories(),
              (error) => {
                swal.fire("Xatolik", error.error?.error || "Xatolik yuz berdi", "error");
              },
            );
        }
      });
  }
}
