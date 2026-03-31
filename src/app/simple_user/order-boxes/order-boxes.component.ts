import { TableData } from "src/app/md/md-table/md-table.component";

import { AfterViewInit, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";

import swal from "sweetalert2";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

declare var $: any;
declare interface Task {
  title: string;
  checked: boolean;
}

@Component({
  selector: "app-order-boxes",
  templateUrl: "./order-boxes.component.html",
  styleUrls: ["./order-boxes.component.css"],
})
export class OrderBoxesComponent implements OnInit {
  public tableData1: TableData;
  public dataTable: TableData;

  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  allDataBoxes: any;
  helloText: string;
  registredMessage: any;

  showTheList: any;
  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;

  orderTypeText: string[];
  orderStatusText: string[];

  orderTypesList: TypesOfOrder[];
  orderStatusTypeList: StatusOfOrder[];

  currentParty: string;

  // Customer balance
  debtUsd: number = 0;
  debtUzs: number = 0;

  getBalanceIcon(): string {
    if (this.debtUsd > 0) return "account_balance_wallet";
    if (this.debtUsd < 0) return "card_giftcard";
    return "check_circle";
  }

  getBalanceColor(): string {
    if (this.debtUsd > 0) return "#f44336";
    if (this.debtUsd < 0) return "#4caf50";
    return "#4caf50";
  }

  getBalanceLabel(): string {
    if (this.debtUsd > 0) return "Qarzingiz";
    if (this.debtUsd < 0) return "Balans";
    return "Balansingiz";
  }

  getConsignmentStatusText(status: number): string {
    const map: { [key: number]: string } = {
      1: "Kelmagan",
      2: "Xitoy omborida",
      4: "Xitoy aeroportida",
      5: "O'zbekiston aeroportida",
      6: "Bojxonada",
      7: "Toshkent omborida",
    };
    return map[status] || "Nomalum";
  }

  getConsignmentStatusClass(status: number): string {
    const map: { [key: number]: string } = {
      1: "badge-warning",
      2: "badge-info",
      4: "badge-primary",
      5: "badge-info",
      6: "badge-success",
      7: "badge-success",
    };
    return map[status] || "badge-secondary";
  }

  // ── Delivery helpers ──

  getDeliveryTypeLabel(type: string): string {
    const map: { [key: string]: string } = {
      "EMU": "EMU",
      "Yandex": "Yandex",
      "Own-Courier": "Kuryer",
      "Pick-up": "Mijoz o'zi",
    };
    return map[type] || type;
  }

  getDeliveryBadgeClass(type: string): string {
    const map: { [key: string]: string } = {
      "EMU": "badge-info",
      "Yandex": "badge-warning",
      "Own-Courier": "badge-primary",
      "Pick-up": "badge-success",
    };
    return map[type] || "badge-secondary";
  }

  getDeliveryIcon(type: string): string {
    const map: { [key: string]: string } = {
      "EMU": "local_shipping",
      "Yandex": "delivery_dining",
      "Own-Courier": "two_wheeler",
      "Pick-up": "store",
    };
    return map[type] || "local_shipping";
  }

  getDeliveryStatusLabel(status: string): string {
    const map: { [key: string]: string } = {
      "created": "Yaratilgan",
      "sent": "Yuborilgan",
      "collected": "Olingan",
      "delivered": "Yetkazilgan",
      "returned": "Qaytarilgan",
      "cancelled": "Bekor",
    };
    return map[status] || status;
  }

  constructor(
    public authService: AuthService,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
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

    this.currentParty = "";
    this.showTheList = false;
  }

  getListOfPartyBoxes() {
    let ownerid = localStorage.getItem("id");

    // Load consignments
    this.http
      .get(
        GlobalVars.baseUrl + "/consignments/for_client?id=" + ownerid,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allDataBoxes = response.json().consignments;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );

    // Load balance from dashboard/stats (same as CustomerDashboard)
    return this.http
      .get(
        GlobalVars.baseUrl + "/dashboard/stats?customer_id=" + ownerid,
        this.options,
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.debtUsd = result.data.debt_usd_total || 0;
            this.debtUzs = result.data.debt_uzs_total || 0;
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
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
  }

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

    if (this.showTheList == false) {
      return false;
    }
    this.currentParty = partyNum;
  }

  getListOfParcels(partyNum) {
    let ownerid = localStorage.getItem("id");
    this.currentParty = partyNum;

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=150" +
          "&ownerID=" +
          ownerid +
          "&consignment=" +
          partyNum,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;

          this.showTheList = true;
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

  getListOfParcelsWithSearch(searchkey) {
    let ownerid = localStorage.getItem("id");

    if (searchkey == "") {
      this.currentPage = 0;
      this.getListOfParcels(this.currentParty);
    } else {
      this.http
        .get(
          GlobalVars.baseUrl +
            "/orders/list?page=" +
            this.currentPage +
            "&size=50" +
            "&ownerID=" +
            ownerid +
            "&consignment=" +
            this.currentParty +
            "&trackingNumber=" +
            searchkey,
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

                this.getListOfParcels(this.currentParty);
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

    return this.getListOfPartyBoxes();
  }
}
