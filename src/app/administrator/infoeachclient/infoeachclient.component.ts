import { TableData } from "src/app/md/md-table/md-table.component";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from "@angular/core";
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
  selector: "app-infoeachclient",
  templateUrl: "./infoeachclient.component.html",
  styleUrls: ["./infoeachclient.component.css"],
})
export class InfoeachclientComponent implements OnInit {
  public tableData1: TableData;
  public dataTable: TableData;

  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  allDataBoxes: any;
  helloText: string;
  registredMessage: any;
  currentID: any;
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

  printContents;
  popupWin;

  printCondition3: boolean;

  idsChek: string;
  nameChek: string;
  weightChek: string;
  counterChek: string;
  izohChek: string;

  currentParty: string;

  umQarzUSZ: string;
  umQarzUSD: string;

  constructor(
    public authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.orderTypeText = [];
    this.orderStatusText = [];

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

  getListOfPartyBoxes(ownerid) {
    // let ownerid = localStorage.getItem("id");

    return this.http
      .get(
        GlobalVars.baseUrl + "/consignments/for_client?id=" + ownerid,
        this.options
      )
      .subscribe(
        (response) => {
          this.allDataBoxes = response
            .json()
            .consignments.filter((r) => r.quantity !== 0);
          // console.log("all data ", this.allDataBoxes);

          this.umQarzUSZ = response.json().debt_uzs_total;
          this.umQarzUSD = response.json().debt_usd_total;
          this.currentID = response.json().user_id;
        },
        (error) => {
          swal.fire("Xatolik", `BAD REQUEST: ${error.json().error}. `, "error");
          if (error.status == 403) {
            this.authService.logout();
          }
        }
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

  addFinance(finId, partiya) {
    swal
      .fire({
        title: "Xisob Qo'shish!",
        html:
          '<div class="form-group">' +
          '<input id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORda berdi" />' +
          '<input id="input-cash" type="text" class="form-control m-2" placeholder="NAQD PUL BERDI" />' +
          '<input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIKDA BERDI" />' +
          '<input id="input-izoh" type="text" class="form-control m-2" placeholder="IZOH" />' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "BERDI",
        cancelButtonText: "No",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (result) => {
          let usd = $("#input-usd").val();
          let cash = $("#input-cash").val();
          let card = $("#input-card").val();
          let izohh = $("#input-izoh").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/finance/pay?id=" +
                finId +
                "&name=" +
                partiya +
                "&plastic=" +
                card +
                "&usd=" +
                usd +
                "&cash=" +
                cash +
                "&comment=" +
                izohh,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
                  swal
                    .fire("Not Added", response.json().message, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  this.getListOfPartyBoxes(this.currentID);
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
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: "SUCCESSFULLY CHANGED!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  addFinanceAtOnce() {
    swal
      .fire({
        title: "ID: " + this.currentID + " hamma qarzni yopish!",
        html:
          '<div class="form-group">' +
          '<input id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORda berdi" />' +
          '<input id="input-cash" type="text" class="form-control m-2" placeholder="NAQD PUL BERDI" />' +
          '<input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIKDA BERDI" />' +
          '<input id="input-izoh" type="text" class="form-control m-2" placeholder="IZOH" />' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "BERDI",
        cancelButtonText: "No",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (result) => {
          let usd = $("#input-usd").val();
          let cash = $("#input-cash").val();
          let card = $("#input-card").val();
          let izohh = $("#input-izoh").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/finance/payAllDebts?owner_id= " +
                this.currentID +
                "&plastic=" +
                card +
                "&usd=" +
                usd +
                "&cash=" +
                cash +
                "&comment=" +
                izohh,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
                  swal
                    .fire("Not Added", response.json().message, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  this.getListOfPartyBoxes(this.currentID);
                  return false;
                }
              },
              (error) => {
                if (error.status === 400) {
                  swal
                    .fire(
                      "Not Added",
                      `BAD REQUEST: ${error.json().error}`,
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.getListOfPartyBoxes(this.currentID);
                      }
                    });
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.getListOfPartyBoxes(this.currentID);
          swal.fire({
            icon: "success",
            html: "SUCCESSFULLY CHANGED!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  getListOfParcels(partyNum) {
    this.currentParty = partyNum;

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=150" +
          "&ownerID=" +
          this.currentID +
          "&consignment=" +
          partyNum,
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;
          this.showTheList = true;
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

            for (let i = 0; i < this.totalPages; i++) {
              this.mypages[i] = { id: "name" };
            }
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
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
            this.currentID +
            "&consignment=" +
            this.currentParty +
            "&trackingNumber=" +
            searchkey,
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

              for (let i = 0; i < this.totalPages; i++) {
                this.mypages[i] = { id: "name" };
              }
            }
          },
          (error) => {
            if (error.status == 403) {
              this.authService.logout();
            }
          }
        );
    }
  }

  getInfoOfParcel(me) {
    this.trackingNum2 = me;
  }

  printChekYuborish(ids, name, weight, counter) {
    swal.fire({
      html:
        "<style>" +
        ".inline-label {" +
        "display: inline-block;" +
        "width: auto;" +
        "margin-right: 5px;" +
        "text-align: right;" +
        "vertical-align: right;" +
        "}" +
        ".inline-input {" +
        "display: inline-block;" +
        "width: auto;" +
        "vertical-align: right;" +
        "}" +
        "</style>" +
        '<div class="form-group">' +
        '<label for="input-party" class="inline-label">Partiya:</label> ' +
        '<input id="input-party" type="text" class="form-control m-2 inline-input" />' +
        '<br><label for="input-id" class="inline-label">ID:</label>' +
        '<input id="input-id" type="text" class="form-control m-2 inline-input" />' +
        '<br><label for="input-weight" class="inline-label">Ogirligi:</label>' +
        '<input id="input-weight" type="text" class="form-control m-2 inline-input" /> kg' +
        '<br><label for="input-counter" class="inline-label">Soni:</label>' +
        '<input  id="input-counter" type="text" class="form-control m-2 inline-input" /> ta' +
        '<br><label for="input-izoh" class="inline-label">Izoh:</label>' +
        '<input  id="input-izoh" type="text" class="form-control m-2 inline-input" />' +
        "</div>",
      showCancelButton: true,

      confirmButtonText: "Print",
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger",
      },
      buttonsStyling: false,
      didOpen: () => {
        $("#input-party").val(name);
        $("#input-id").val(this.currentID);
        $("#input-weight").val(weight);
        $("#input-counter").val(counter);
      },
      preConfirm: (result) => {
        //   this.chekId = $('#input-id').val();
        //  this.chekIzoh = $('#input-izoh').val();

        // var i:number = $('#types').val(); '<select class="custom-select m-2" id="types" name="types"> </select> ' +
        // this.chekDelType =this.deliveryTypes[i].nameUz;

        this.idsChek = $("#input-id").val();
        this.nameChek = $("#input-party").val();
        this.weightChek = $("#input-weight").val();
        this.counterChek = $("#input-counter").val();
        this.izohChek = $("#input-izoh").val();

        this.printCondition3 = true;

        this.changeDetectorRef.detectChanges();
        this.printContents =
          document.getElementById("print-section3").innerHTML;
        this.popupWin = window.open(
          "",
          "_blank",
          "top=0,left=0,height=100%,width=auto"
        );
        this.popupWin.document.open();
        this.popupWin.document.write(`
            <html>
              <head>
                <title>Print tab</title>
                <style>
                  body
                  {
                    text-align: center;
                  }
  
                </style>
              </head>
          <body onload="window.print(); window.close();"> ${this.printContents}
          
          </body>
            </html>`);

        //
        this.popupWin.document.close();
        this.printCondition3 = false;
      },
    });

    this.printCondition3 = false;
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
          "'s row."
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

    //return this.getListOfPartyBoxes();
  }
}
