import { AfterViewInit, Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Http, RequestOptions, Headers } from "@angular/http";

import swal from "sweetalert2";
import { GlobalVars } from "src/app/global-vars";
import { Router } from "@angular/router";
import { AuthService } from "src/app/pages/login/auth.service";

declare const $: any;

@Component({
  selector: "app-finance",
  templateUrl: "./employee-finance.component.html",
  styleUrls: ["./employee-finance.component.css"],
})
export class EmployeeFinanceComponent implements OnInit {
  headers12: any;
  options: any;
  allData: any[] = [];

  currentParty: string = "";
  activeConsignment: string = "";
  totalItems: number = 0;
  totalWeight: number = 0;

  showLastFinance: boolean = false;
  enteredLast: string = "";
  enteredBeforeLast: string = "";

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService,
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  ngOnInit() {
    this.getListOfFinance();
  }

  // ── List finances (V2) ──────────────────────────────────

  getListOfFinance() {
    return this.http
      .get(GlobalVars.baseUrl + "/finance-v2/list?size=800", this.options)
      .subscribe(
        (response) => {
          this.allData = response.json().finances || [];
          this.totalItems = response.json().totalItems || 0;
          this.totalWeight = response.json().totalWeight || 0;
          this.activeConsignment = response.json().activeConsignment || "";
          this.currentParty = this.activeConsignment || this.currentParty;
        },
        (error) => {
          if (error.status == 403) this.authService.logout();
        },
      );
  }

  // ── Filter by customer ID (debounced) ──────────────────

  private filterTimeout: any;

  onFilterInput(value: string) {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.getListOfFinanceWithFilter(value);
    }, 400);
  }

  getListOfFinanceWithFilter(id: string) {
    const param = id.trim() ? "&ownerId=" + id.trim() : "";
    return this.http
      .get(GlobalVars.baseUrl + "/finance-v2/list?size=800" + param, this.options)
      .subscribe(
        (response) => {
          this.allData = response.json().finances || [];
          this.totalItems = response.json().totalItems || 0;
          this.totalWeight = response.json().totalWeight || 0;
        },
        (error) => {
          if (error.status == 403) this.authService.logout();
        },
      );
  }

  // ── Record new finance (V2) ─────────────────────────────

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
                "/finance-v2/add?owner_id=" + ownerId +
                "&weight=" + weight +
                "&name=" + (this.currentParty || ""),
              {},
              { headers: this.getHeaders() },
            )
            .subscribe(
              (data) => {
                if (data.status === "error") {
                  swal.fire("Qo'shilmadi", data.message || data.error, "error")
                    .then((r) => { if (r.isConfirmed) this.recordFinance(); });
                } else {
                  this.getListOfFinance();
                }
              },
              (error) => {
                swal.fire("Xatolik", error.error?.error || error.error?.message || "Xatolik yuz berdi", "error")
                  .then((r) => { if (r.isConfirmed) this.recordFinance(); });
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) this.recordFinance();
      });
  }

  // ── Edit finance weight (V2) ────────────────────────────

  editFinance(finId: number, weight: number) {
    swal
      .fire({
        title: "Og'irlikni O'zgartirish",
        html:
          '<div class="form-group">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><label style="min-width:60px;">Kilosi:</label><input id="input-weight" type="text" class="form-control" placeholder="Kilosi" /></div>' +
          '<div style="display:flex;align-items:center;gap:8px;"><label style="min-width:60px;">RATE:</label><input id="input-rate" type="text" class="form-control" placeholder="Narx (ixtiyoriy)" /></div>' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "O'zgartirish",
        cancelButtonText: "Bekor",
        customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-danger" },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-weight").val(weight);
        },
        preConfirm: () => {
          const newWeight = $("#input-weight").val();
          const newRate = $("#input-rate").val();

          if (!newWeight && !newRate) {
            swal.showValidationMessage("Kilosi yoki narxni kiriting");
            return false;
          }

          const body: any = { finance_id: finId };
          if (newWeight && parseFloat(newWeight) !== weight) body.weight = newWeight;
          if (newRate) body.perKg = newRate;

          this.httpClient
            .post<any>(GlobalVars.baseUrl + "/finance-v2/edit", body, {
              headers: this.getHeaders(),
            })
            .subscribe(
              (data) => {
                if (data.status === "error") {
                  swal.fire("Xatolik", data.message || data.error, "error");
                } else {
                  swal.fire({ icon: "success", title: "O'zgartirildi!", timer: 1500, showConfirmButton: false });
                  this.getListOfFinance();
                }
              },
              (error) => {
                swal.fire("Xatolik", error.error?.error || error.error?.message || "Xatolik yuz berdi", "error");
              },
            );

          return false;
        },
      });
  }

  // ── Find consignment by name ────────────────────────────

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
        customClass: { confirmButton: "btn btn-success", cancelButton: "btn btn-danger" },
        buttonsStyling: false,
        didOpen: () => {
          document.getElementById("name")?.focus();
        },
        preConfirm: () => {
          const name = $("#name").val();
          this.http
            .get(GlobalVars.baseUrl + "/consignments/info?name=" + name, this.options)
            .subscribe(
              (response) => {
                const res = response.json();
                if (res.status === "error") {
                  swal.fire("Topilmadi", res.message || res.error, "error")
                    .then((r) => { if (r.isConfirmed) this.findConsignmentByName(); });
                } else {
                  localStorage.setItem("current_party", res.consignment.name);
                  this.currentParty = res.consignment.name;
                  this.getListOfFinance();
                }
              },
              (error) => {
                swal.fire("Xatolik", error.json?.()?.error || "Partiya topilmadi", "error")
                  .then((r) => { if (r.isConfirmed) this.findConsignmentByName(); });
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: $("#name").val() + " Partiya Ochildi",
            customClass: { confirmButton: "btn btn-success" },
            buttonsStyling: false,
          });
        }
      });
  }

  getShippingLabel(row: any): string {
    return row.shipping_type === "AVTO" || row.isHongKong ? "Avto" : "Avia";
  }
}
