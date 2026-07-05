import { AfterViewInit, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";

import swal from "sweetalert2";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare interface OrderInfo {
  trackingNumber: string;
  russianName: string;
  foreignName: string;
  nameofProduct: string;
  quantity: string;
  status: string;
  orderType: string;
  inForeignWarehouseDate: string;
  onWayToAirportDate: string;
}

declare const $: any;

@Component({
  selector: "app-orders",
  templateUrl: "./orders.component.html",
  styleUrls: ["./orders.component.css"],
})
export class OrdersComponent implements OnInit, AfterViewInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  helloText: string;
  registredMessage: any;

  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  pageSize: number = 100;
  mypages = [];
  isPageNumActive: boolean;

  orderTypeText: string[];
  orderStatusText: string[];

  orderTypesList: TypesOfOrder[];
  orderStatusTypeList: StatusOfOrder[];

  // ── Shipping-type badge helpers (AVIA / AVTO / AVTO POCHTA) ──
  private normalizedType(row: any): string {
    return (row?.shipping_type || (row?.isHongKong ? "AVTO" : "AVIA"))
      .toString()
      .toUpperCase();
  }
  shippingLabel(row: any): string {
    switch (this.normalizedType(row)) {
      case "AVTO POCHTA":
        return "Avto Pochta";
      case "AVTO":
        return "Avto";
      default:
        return "Avia";
    }
  }
  shippingColor(row: any): string {
    switch (this.normalizedType(row)) {
      case "AVTO POCHTA":
        return "#7C3AED"; // purple
      case "AVTO":
        return "#E67E22"; // orange
      default:
        return "#1976D2"; // blue
    }
  }
  shippingIcon(row: any): string {
    return this.normalizedType(row) === "AVIA" ? "flight" : "local_shipping";
  }

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService,
  ) {
    this.orderTypeText = [];
    this.orderStatusText = [];

    this.orderTypesList = GlobalVars.orderTypes;
    this.orderStatusTypeList = GlobalVars.orderStatus;
    if (this.orderStatusTypeList == null) {
      this.router.navigate(["/dashboard"]);
    }

    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;
  }

  /**
   * Handle page change from pagination component
   */
  onPageChanged(pageIndex: number) {
    this.currentPage = pageIndex;
    document.getElementById("listcard")?.scrollIntoView({ behavior: "smooth" });
    this.getListOfParcels();
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    this.getListOfParcels();
  }

  getListOfParcels() {
    let ownerid = localStorage.getItem("id");

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          "&ownerID=" +
          ownerid,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;
          // console.log(this.allData);

          for (let index = 0; index < this.allData.length; index++) {
            const element = this.allData[index];
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              element.order_type,
              "uz",
            );
          }

          for (let index = 0; index < this.allData.length; index++) {
            const element1 = this.allData[index];
            this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
              element1.status,
              "uz",
            );
          }

          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          if (this.totalPages > 1) {
            this.needPagination = true;

            for (let i = 0; i < this.totalPages; i++) {
              this.mypages[i] = { id: "name" };
            }
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  getListOfParcelsWithFilter(status, type, ownerid) {
    ownerid = localStorage.getItem("id");

    let filterLink =
      "&status=" + status + "&orderType=" + type + "&ownerID=" + ownerid;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          filterLink,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;

          for (let index = 0; index < this.allData.length; index++) {
            const element = this.allData[index];
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              element.orderType,
              "uz",
            );
          }

          for (let index = 0; index < this.allData.length; index++) {
            const element1 = this.allData[index];
            this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
              element1.status,
              "uz",
            );
          }

          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          if (this.totalPages > 1) {
            this.needPagination = true;

            for (let i = 0; i < this.totalPages; i++) {
              this.mypages[i] = { id: "name" };
            }
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  getListOfParcelsWithSearch(searchkey) {
    if (searchkey == "") {
      this.currentPage = 0;

      this.getListOfParcels();
    } else {
      this.http
        .get(
          GlobalVars.baseUrl + "/orders/search?tracking_number=" + searchkey,
          this.options,
        )
        .subscribe(
          (response) => {
            this.allData = response.json().orders;

            for (let index = 0; index < this.allData.length; index++) {
              const element = this.allData[index];
              this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
                element.orderType,
                "uz",
              );
            }

            for (let index = 0; index < this.allData.length; index++) {
              const element1 = this.allData[index];
              this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
                element1.status,
                "uz",
              );
            }

            this.currentPage = response.json().currentPage;
            this.totalPages = response.json().totalPages;
            if (this.totalPages > 1) {
              this.needPagination = true;

              for (let i = 0; i < this.totalPages; i++) {
                this.mypages[i] = { id: "name" };
              }
            }
          },
          (error) => {
            if (error.status == 403) {
              this.authService.logout();
            }
          },
        );
    }
  }

  editParcel(trackingNumber, ownerID, foreignName, quantity, orderType) {
    swal
      .fire({
        title: "Edit the parcel",
        html:
          '<div class="form-group">' +
          '<input id="input-trnum" type="text" class="form-control m-2" readonly placeholder="Tracking Number" />' +
          '<input id="input-cnname" type="text" class="form-control m-2" placeholder="Name in Chinese" />' +
          '<div style="display:flex;"> <input  id="input-owid" type="text" class="form-control m-2" placeholder="Owner ID" />' +
          '<input  id="input-qnty" type="text" class="form-control m-2" placeholder="Quantity" />' +
          " </div>" +
          '<select class="custom-select m-2" id="types" name="types"> </select> ' +
          "</div>",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-trnum").val(trackingNumber);
          $("#input-cnname").val(foreignName);
          $("#input-owid").val(ownerID);
          $("#input-qnty").val(quantity);

          var options = [];
          for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
            options.push(
              '<option value="',
              GlobalVars.orderTypes[i].id,
              '">',
              GlobalVars.orderTypes[i].description_en,
              "</option>",
            );
          }
          $("#types").html(options.join(""));

          $("#types").val(orderType);
        },
        preConfirm: (result) => {
          let chineseName = $("#input-cnname").val();
          let ownerId = $("#input-owid").val();
          let quantityOfPar = $("#input-qnty").val();
          let typeOfParcel = $("#types").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/edit?tracking_number=" +
                trackingNumber +
                "&name_cn=" +
                chineseName +
                "&owner_id=" +
                ownerId +
                "&quantity=" +
                quantityOfPar +
                "&type=" +
                typeOfParcel,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  this.registredMessage = response.json().message;
                  // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
                  swal
                    .fire("Not Added", this.registredMessage, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  this.getListOfParcels();
                  return false;
                }
              },
              (error) => {
                if (error.status == 400) {
                  swal
                    .fire(
                      "Not Added",
                      "BAD REQUEST: WRONG TYPE OF INPUT",
                      "error",
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                }

                if (error.status == 403) {
                  this.authService.logout();
                }
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: $("#input-trnum").val() + " is SUCCESSFULLY CHANGED!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  receiveParcel(trNum, prName) {
    swal
      .fire({
        title: "Qabul qildim!",
        html: '<div style="display: flex; justify-content: center;"> <p id="mytext"> </p> <p id="mytext2"> </p> </div> buyutmani olganingizni tasdilaysizmi?',
        icon: "warning",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        didOpen: () => {
          $("#mytext").append(trNum);
          $("#mytext2").append(", " + prName);
        },
        confirmButtonText: "Ha, buni oldim",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/client_received?tracking_number=" +
                trNum,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                // swal.fire(
                //   {
                //     title: 'Deleted!',
                //     text: 'Your file has been deleted.',
                //     icon: 'success',
                //     customClass:{
                //       confirmButton: "btn btn-success",
                //     },
                //     buttonsStyling: false
                //   }
                // )

                this.getListOfParcels();
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              },
            );
        }
      });
  }

  getInfoOfParcel(me) {
    this.trackingNum2 = me;
  }

  // ─── Express-scan pre-declare ───────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
  }

  openPreDeclareModal() {
    this.httpClient
      .get<any>(`${GlobalVars.baseUrl}/express-scan/service-types`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe(
        (data) => this.showPreDeclareDialog(data.types || []),
        (err) => {
          if (err.status === 403) this.authService.logout();
          swal.fire(
            "Xatolik",
            err.error?.error || "Xizmat turlarini olishda xatolik",
            "error",
          );
        },
      );
  }

  private showPreDeclareDialog(types: any[]) {
    if (!types.length) {
      swal.fire("Ma'lumot", "Hozircha xizmat turlari mavjud emas", "info");
      return;
    }

    const formatPrice = (v: any): string => {
      const n = parseFloat(v);
      if (!isFinite(n)) return "0";
      return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    const options = types
      .filter((t) => t.code !== "UNKNOWN")
      .map(
        (t) =>
          `<option value="${t.id}"
            data-billable="${t.is_billable}"
            data-price="${t.default_price || 0}"
            data-currency="${t.currency || 'UZS'}">
            ${t.name_uz}${t.is_billable ? " 💰" : ""}
          </option>`,
      )
      .join("");

    const html = `
      <style>
        .es-form { display:flex; flex-direction:column; gap:14px; text-align:left; }
        .es-form label { font-size:12px; font-weight:700; color:#555; text-transform:uppercase; display:block; margin-bottom:6px; }
        .es-form label .req { color:#e53935; margin-left:2px; }
        .es-form .form-control { border-radius:8px; border:1.5px solid #ddd; padding:10px 12px; font-size:15px; width:100%; box-sizing:border-box; }
        .es-form .form-control:focus { border-color:#1976d2; outline:none; box-shadow:0 0 0 3px rgba(25,118,210,0.12); }
        .es-hint { font-size:12px; color:#888; margin-top:4px; }
        .es-bill { margin-top:8px; padding:10px 12px; border-radius:8px; background:#fff4e5; border:1px solid #ffdcb0; display:none; }
        .es-bill-row { display:flex; justify-content:space-between; align-items:center; gap:8px; }
        .es-bill-label { font-size:12px; color:#a15c1a; font-weight:600; }
        .es-bill-amount { font-size:18px; font-weight:800; color:#c8672a; letter-spacing:0.3px; white-space:nowrap; }
        .es-bill-note { font-size:11px; color:#7a4715; margin-top:4px; }
      </style>
      <div class="es-form">
        <div>
          <label>Trek raqami<span class="req">*</span></label>
          <input id="es-tracking" type="text" class="form-control" placeholder="Masalan: SF1234567890" autocomplete="off">
        </div>
        <div>
          <label>Xizmat turi<span class="req">*</span></label>
          <select id="es-service" class="form-control">
            <option value="">-- Tanlang --</option>
            ${options}
          </select>
          <div id="es-bill-warning" class="es-bill">
            <div class="es-bill-row">
              <span class="es-bill-label">⚠️ Xizmat narxi</span>
              <span class="es-bill-amount" id="es-bill-amount">—</span>
            </div>
            <div class="es-bill-note">Ushbu summa hisobingizga qarz sifatida yoziladi.</div>
          </div>
        </div>
      </div>
    `;

    swal
      .fire({
        title: "Trek raqamini oldindan e'lon qilish",
        html,
        width: "min(460px, 95vw)",
        showCancelButton: true,
        confirmButtonText: "E'lon qilish",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-info",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
        didOpen: () => {
          const sel = document.getElementById("es-service") as HTMLSelectElement;
          const warn = document.getElementById("es-bill-warning") as HTMLElement;
          const amountEl = document.getElementById("es-bill-amount") as HTMLElement;
          sel.addEventListener("change", () => {
            const opt = sel.options[sel.selectedIndex];
            const billable = opt?.getAttribute("data-billable") === "true";
            warn.style.display = billable ? "block" : "none";
            if (billable && amountEl) {
              const price = opt?.getAttribute("data-price") || "0";
              const currency = opt?.getAttribute("data-currency") || "UZS";
              amountEl.textContent = `${formatPrice(price)} ${currency}`;
            }
          });
        },
        preConfirm: () => {
          const tracking = (
            document.getElementById("es-tracking") as HTMLInputElement
          ).value.trim();
          const serviceIdRaw = (
            document.getElementById("es-service") as HTMLSelectElement
          ).value;

          if (!tracking) {
            swal.showValidationMessage("Trek raqamini kiriting");
            return false;
          }
          if (!serviceIdRaw) {
            swal.showValidationMessage("Xizmat turini tanlang");
            return false;
          }
          return {
            tracking_number: tracking,
            service_type_id: parseInt(serviceIdRaw),
          };
        },
      })
      .then((result) => {
        if (!result.isConfirmed || !result.value) return;

        this.httpClient
          .post<any>(
            `${GlobalVars.baseUrl}/express-scan/pre-declare`,
            result.value,
            { headers: this.getAuthHeaders() },
          )
          .subscribe(
            (res) => {
              const svcName = res.service?.name_uz || "";
              let msg = `Trek ro'yxatga olindi — ${svcName}`;
              if (res.charge) {
                const amt = parseFloat(res.charge.amount).toFixed(0);
                msg += `. Hisobga ${amt} ${res.charge.currency} qarz qo'shildi.`;
              }
              swal.fire({
                icon: "success",
                title: "Muvaffaqiyatli",
                text: msg,
                timer: 3500,
                showConfirmButton: false,
              });
              this.getListOfParcels();
            },
            (err) => {
              if (err.status === 403) this.authService.logout();
              swal.fire(
                "Xatolik",
                err.error?.error || "Saqlashda xatolik",
                "error",
              );
            },
          );
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
  }

  ngAfterViewInit() {
    $("#datatables").DataTable({
      pagingType: "full_numbers",
      lengthMenu: [
        [10, 25, 50, -1],
        [10, 25, 50, "All"],
      ],
      responsive: true,
      language: {
        search: "_INPUT_",
        searchPlaceholder: "Search records",
      },
    });

    const table = $("#datatables").DataTable();

    // Edit record
    table.on("click", ".edit", function (e) {
      let $tr = $(this).closest("tr");
      if ($($tr).hasClass("child")) {
        $tr = $tr.prev(".parent");
      }

      var data = table.row($tr).data();
      alert(
        "You press on Row: " +
          data[0] +
          " " +
          data[1] +
          " " +
          data[2] +
          "'s row.",
      );
      e.preventDefault();
    });

    // Delete a record
    table.on("click", ".remove", function (e) {
      const $tr = $(this).closest("tr");
      table.row($tr).remove().draw();
      e.preventDefault();
    });

    //Like record
    table.on("click", ".like", function (e) {
      alert("You clicked on Like button");
      e.preventDefault();
    });

    $(".card .material-datatables label").addClass("form-group");

    return this.getListOfParcels();
  }
}
