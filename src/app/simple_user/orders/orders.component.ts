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
