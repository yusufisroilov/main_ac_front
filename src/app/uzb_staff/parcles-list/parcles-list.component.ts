import { AfterViewInit, Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";

import swal from "sweetalert2";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";
import { Router } from "@angular/router";
import { AuthService } from "src/app/pages/login/auth.service";
import { TmplAstBoundAttribute } from "@angular/compiler";

declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare const $: any;

@Component({
  selector: "app-parcles-list",
  templateUrl: "./parcles-list.component.html",
  styleUrls: ["./parcles-list.component.css"],
})
export class UzParclesListComponent implements OnInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  helloText: string;
  registredMessage: any;

  trackingNum2: any;

  currentOwnerID: string;
  currentParty: string;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  pageSize: number = 100; // Items per page

  orderFilterStatus: string;
  orderFilterType: string;
  orderFilterOwnId: string;
  orderFilterParty: string;
  orderFilterPartys;
  leftCountItems: number;
  totalLeftCountItems: number;

  orderTypeText: string[];
  orderStatusText: string[];

  hideForManager: boolean = true;

  orderTypesList: TypesOfOrder[];
  orderStatusTypeList: StatusOfOrder[];

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.orderTypeText = [];
    this.orderStatusText = [];
    this.totalLeftCountItems = 0;
    this.orderTypesList = GlobalVars.orderTypes;
    this.orderStatusTypeList = GlobalVars.orderStatus;
    if (this.orderStatusTypeList == null) {
      this.router.navigate(["/dashboard"]);
    }

    this.allData = [];

    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    if (localStorage.getItem("role") == "MANAGER") {
      this.hideForManager = false;
    }

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;

    this.orderFilterStatus = "";
    this.orderFilterType = "";
    this.orderFilterOwnId = "";
    this.orderFilterParty = "";
  }

  ngOnInit() {
    this.dataTable = {
      headerRow: [
        "Owner ID",
        "Chinese name",
        "Tracking Number",
        "Quantity",
        "Type",
        "Status",
        "Actions",
      ],

      dataRows: [],
    };
  }

  ngAfterViewInit() {
    this.getListOfParcels();
  }

  getListOfParcels() {
    let filterLink =
      "&status=" +
      this.orderFilterStatus +
      "&orderType=" +
      this.orderFilterType +
      "&ownerID=" +
      this.orderFilterOwnId +
      "&consignment=" +
      this.orderFilterParty;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          filterLink,
        this.options
      )
      .subscribe((response) => {
        this.allData = response.json().orders;

        for (let index = 0; index < this.allData.length; index++) {
          const element = this.allData[index];
          this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
            element.order_type,
            "uz"
          );
        }

        for (let index = 0; index < this.allData.length; index++) {
          const element1 = this.allData[index];
          this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
            element1.status,
            "uz"
          );
        }

        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        this.needPagination = this.totalPages > 1;
      });
  }

  getListOfParcelsWithFilter(status, type, ownerid, partNum, check) {
    if (check == "status") {
      this.orderFilterStatus = status;
    } else if (check == "type") {
      this.orderFilterType = type;
    } else if (check == "ownerid") {
      this.orderFilterOwnId = ownerid;
    } else if (check == "partnum") {
      this.orderFilterParty = partNum;
    }

    let filterLink =
      "&status=" +
      this.orderFilterStatus +
      "&orderType=" +
      this.orderFilterType +
      "&ownerID=" +
      this.orderFilterOwnId +
      "&consignment=" +
      this.orderFilterParty;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          filterLink,
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;
          this.totalLeftCountItems = response.json().totalItems;
          for (let index = 0; index < this.allData.length; index++) {
            const element = this.allData[index];
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              element.order_type,
              "uz"
            );
          }

          for (let index = 0; index < this.allData.length; index++) {
            const element1 = this.allData[index];
            this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
              element1.status,
              "uz"
            );
          }

          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          this.needPagination = this.totalPages > 1;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  getListOfParcelsWithSearch(trackingNumber) {
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          "&tracking_number=" +
          trackingNumber,
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;

          for (let index = 0; index < this.allData.length; index++) {
            const element = this.allData[index];
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              element.order_type,
              "uz"
            );
          }

          for (let index = 0; index < this.allData.length; index++) {
            const element1 = this.allData[index];
            this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
              element1.status,
              "uz"
            );
          }

          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          if (this.totalPages > 1) {
            this.needPagination = true;
          } else {
            this.needPagination = false;
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // Pagination Methods

  /**
   * Handle page change from pagination component
   */
  onPageChanged(pageIndex: number) {
    this.currentPage = pageIndex;
    document.getElementById("listcard")?.scrollIntoView({ behavior: "smooth" });
    this.getListOfParcels();
  }

  recordParcel() {
    swal
      .fire({
        title: "Buyurtma ID raqam: ???",
        input: "text",
        inputAttributes: {
          autocapitalize: "off",
        },
        showCancelButton: true,
        confirmButtonText: "OK",
        showLoaderOnConfirm: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (trackingNumber) => {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/scan-warehouse?tracking_number=" +
                trackingNumber,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  swal
                    .fire({
                      title: "ADDED :)",
                      text: trackingNumber,
                      icon: "success",
                      backdrop: `
                    rgba(50,123,0,0.4)
                    url("../../../assets/audio/scan.gif")
                    left top
                    no-repeat`,
                      customClass: {
                        confirmButton: "btn btn-success",
                      },
                      buttonsStyling: false,
                    })
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.http
                          .get(
                            GlobalVars.baseUrl +
                              "/orders/list?page=" +
                              this.currentPage +
                              "&size=" +
                              this.pageSize,
                            this.options
                          )
                          .subscribe(
                            (response) => {
                              this.allData = response.json().orders;

                              for (
                                let index = 0;
                                index < this.allData.length;
                                index++
                              ) {
                                const element = this.allData[index];
                                this.orderTypeText[index] =
                                  GlobalVars.getDescriptionWithID(
                                    element.order_type,
                                    "uz"
                                  );
                              }

                              for (
                                let index = 0;
                                index < this.allData.length;
                                index++
                              ) {
                                const element1 = this.allData[index];
                                this.orderStatusText[index] =
                                  GlobalVars.getDesOrderStatusWithID(
                                    element1.status,
                                    "uz"
                                  );
                              }

                              this.currentPage = response.json().currentPage;
                              this.totalPages = response.json().totalPages;
                              this.needPagination = this.totalPages > 1;
                            },
                            (error) => {
                              if (error.status == 403) {
                                this.authService.logout();
                              }
                            }
                          );

                        this.recordParcel();
                      }
                    });
                }
              },
              (error) => {
                if (error.status == 400) {
                  swal
                    .fire({
                      title: "Not Added",
                      text: "BAD REQUEST: WRONG TYPE OF INPUT",
                      backdrop: `
                    rgba(0,0,123,0.4)
                    url("../../../assets/audio/error.gif")
                    left top
                    no-repeat`,
                    })
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.recordParcel();
                      }
                    });
                } else if (error.status == 403) {
                  swal
                    .fire({
                      title: "Not Added",
                      text: "YOU ARE UNAUTHORIZED",
                      backdrop: `
                    rgba(0,0,123,0.4)
                    url("../../../assets/audio/error.gif")
                    left top
                    no-repeat`,
                    })
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.recordParcel();
                      }
                    });
                }
              }
            );
        },
      })
      .then((result) => {
        //  this.recordParcel();
      });
  }

  editParcel(trackingNumber, ownerID, ruName, quantity, orderType, cn_name) {
    swal
      .fire({
        title: "Edit the parcel",
        html:
          '<div class="form-group">' +
          '<input id="input-trnum" type="text" class="form-control m-2" readonly placeholder="Tracking Number" />' +
          '<input id="input-runame" type="text" class="form-control m-2" placeholder="Name in Chinese" />' +
          '<div style="display:flex;"> <input  id="input-owid" type="text" class="form-control m-2" placeholder="Owner ID" />' +
          '<input  id="input-qnty" type="text" class="form-control m-2" placeholder="Quantity" />' +
          " </div>" +
          "</div>",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-trnum").val(trackingNumber);
          $("#input-runame").val(ruName);
          $("#input-owid").val(ownerID);
          $("#input-qnty").val(quantity);

          var options = [];
          for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
            options.push(
              '<option value="',
              GlobalVars.orderTypes[i].id,
              '">',
              GlobalVars.orderTypes[i].description_en,
              "</option>"
            );
          }
          $("#types").html(options.join(""));

          $("#types").val(orderType);
        },
        preConfirm: (result) => {
          let rusName = $("#input-runame").val();
          let ownerId = $("#input-owid").val();
          let quantityOfPar = $("#input-qnty").val();
          let typeOfParcel = orderType;

          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/edit?tracking_number=" +
                trackingNumber +
                "&name_ru=" +
                rusName +
                "&owner_id=" +
                ownerId +
                "&quantity=" +
                quantityOfPar +
                "&type=" +
                typeOfParcel +
                "&name_cn=" +
                cn_name,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  this.registredMessage = response.json().message;
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
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                }
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
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

  deleteParcel(trNum) {
    swal
      .fire({
        title: "Are you sure to delete?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        confirmButtonText: "Yes, delete it!",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          this.http
            .delete(
              GlobalVars.baseUrl + "/orders/delete?tracking_number=" + trNum,
              this.options
            )
            .subscribe(
              (response) => {
                swal.fire({
                  title: "Deleted!",
                  text: "Your file has been deleted.",
                  icon: "success",
                  customClass: {
                    confirmButton: "btn btn-success",
                  },
                  buttonsStyling: false,
                });

                this.getListOfParcels();
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }

  getInfoOfParcel(me) {
    this.trackingNum2 = me;
  }
}
