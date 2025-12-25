import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";
import swal from "sweetalert2";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { DatePipe } from "@angular/common";

declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare const $: any;

@Component({
  selector: "app-transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.css"],
})
export class TransactionsComponent implements OnInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allTransactions: any;
  helloText: string;
  registredMessage: any;
  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  pageSize: number = 200;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;

  danValue: string;
  gachaValue: string;

  constructor(
    private datePipe: DatePipe,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
    var date = new Date();

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;

    this.isPageNumActive = false;
  }

  ngOnInit(): void {
    this.dataTable = {
      headerRow: [
        "User ID",
        "Rec ID",
        "Phone number",
        "Full name",
        "Pasport num",
        "Address",
        "Amallar",
      ],

      dataRows: [],
    };
    this.getListOfTransactions();
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    document.getElementById("listcard").scrollIntoView();
    this.getListOfTransactions();
  }

  /**
   * Handle page change from pagination component
   */
  onPageChanged(pageIndex: number) {
    this.currentPage = pageIndex;
    document.getElementById("listcard")?.scrollIntoView({ behavior: "smooth" });
    this.getListOfTransactions();
  }

  danFunction(date) {
    this.danValue = this.datePipe.transform(date.value, "dd/MM/yyyy");
  }

  gachaFunction(date) {
    this.gachaValue = this.datePipe.transform(date.value, "dd/MM/yyyy");
  }

  getListOfTransactionsWithDate() {
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/transactions/list?" +
          "from_date=" +
          this.danValue +
          "&to_date=" +
          this.gachaValue,
        this.options
      )
      .subscribe(
        (response) => {
          this.allTransactions = response.json().transactions;

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

  editTransaction(finID) {
    swal
      .fire({
        title: "Xisobni sanasini to'g'irlash",
        html:
          '<div class="form-group">' +
          '<input id="input-finid" type="text" class="form-control m-2" readonly placeholder="Tracking Number" />' +
          '<input id="inputsana" type="date" class="form-control m-2" ' +
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

        preConfirm: (result) => {
          let dateed = $("#inputsana").val();
          let split = dateed.split("-");

          this.http
            .post(
              GlobalVars.baseUrl +
                "/transactions/edit?transaction_id=" +
                finID +
                "&date=" +
                dateed,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  this.registredMessage = response.json().error;
                  // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
                  swal
                    .fire("Not Added", this.registredMessage, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  this.getListOfTransactions();
                  return false;
                }
              },
              (error) => {
                if (error.status == 400) {
                  swal
                    .fire(
                      "Not Added",
                      "Not Added " + error.json().error,
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

  getListOfTransactions() {
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/transactions/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize,
        this.options
      )
      .subscribe(
        (response) => {
          this.allTransactions = response.json().transactions;

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

  gotoxisobkitob() {
    this.router.navigate(["/uzm/finance"]);
  }

  getListOfTransactionsWithFilter(clientId, partiya) {
    let filterLink = "&ownerID=" + clientId + "&consignment=" + partiya;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/transactions/list?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          filterLink,
        this.options
      )
      .subscribe(
        (response) => {
          this.allTransactions = response.json().transactions;
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

  /*
  getListOfParcelsWithSearch(searchkey){

    if(searchkey=="")
    {
      this.currentPage=0;

       this.getListOfParcels();
    }else{


      this.http.get(GlobalVars.baseUrl+'/orders/search?tracking_number='+ searchkey, this.options)
      .subscribe(response => {
        this.allData = response.json().orders;

        for (let index = 0; index < this.allData.length; index++) {
          const element = this.allData[index];
          this.orderTypeText[index] = GlobalVars.getDescriptionWithID(element.orderType, "uz");  
        }

        for (let index = 0; index < this.allData.length; index++) {
          const element1 = this.allData[index];
          this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(element1.status, "uz");  
        }

        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        }

      })

    }

  } */

  addExpense() {
    swal
      .fire({
        title: "Qaytarilgan Xarajat qo'shish!",
        html:
          '<div class="form-group">' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Mijoz:</label><input id="input-customerid" type="text" class="form-control m-2" placeholder="ID si" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Plastik:</label><input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIK" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Naqd:</label><input  id="input-cash" type="text" class="form-control m-2" placeholder="NAQD" /> </div> ' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">USD $:</label>  <input  id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORDA" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Partiya:</label>  <input  id="input-cons" type="text" class="form-control m-2" placeholder="PARTIYA" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Izoh:</label> <input  id="input-comment" type="text" class="form-control m-2" placeholder="Izoh" /> </div> ' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "Qo'shish",
        cancelButtonText: "No",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          // var options = [];
          // for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
          //     options.push('<option value="',
          //     GlobalVars.orderTypes[i].id, '">',
          //     GlobalVars.orderTypes[i].descriptionEn, '</option>');
          // }
          // $("#types").html(options.join(''));
          // $('#types').val(orderType);
        },
        preConfirm: (result) => {
          let userid = $("#input-customerid").val();
          let usd2 = $("#input-usd").val();
          let cash2 = $("#input-cash").val();
          let card2 = $("#input-card").val();
          let comment = $("#input-comment").val();
          let consignment = $("#input-cons").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/expenses/add?customerID=" +
                userid +
                "&plastic=" +
                card2 +
                "&cash=" +
                cash2 +
                "&usd=" +
                usd2 +
                "&consignment=" +
                consignment +
                "&comment=" +
                comment,
              "",
              this.options
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
                  this.getListOfTransactions();
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
            html: $("#input-trnum").val() + " is SUCCESSFULLY CHANGED!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  editExpense(idd, customerid, card, cash, usd, cons, comment) {
    swal
      .fire({
        title: "Qaytarilgan Xarajat qo'shish!",
        html:
          '<div class="form-group">' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Mijoz:</label><input id="input-customerid" type="text" class="form-control m-2" placeholder="ID si" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Plastik:</label><input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIK" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Naqd:</label><input  id="input-cash" type="text" class="form-control m-2" placeholder="NAQD" /> </div> ' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">USD $:</label>  <input  id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORDA" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Partiya:</label>  <input  id="input-cons" type="text" class="form-control m-2" placeholder="PARTIYA" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Izoh:</label> <input  id="input-comment" type="text" class="form-control m-2" placeholder="Izoh" /> </div> ' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "Qo'shish",
        cancelButtonText: "No",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-customerid").val(customerid);
          $("#input-usd").val(usd);
          $("#input-cash").val(cash);
          $("#input-card").val(card);
          $("#input-cons").val(cons);
          $("#input-comment").val(comment);

          // var options = [];
          // for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
          //     options.push('<option value="',
          //     GlobalVars.orderTypes[i].id, '">',
          //     GlobalVars.orderTypes[i].descriptionEn, '</option>');
          // }
          // $("#types").html(options.join(''));

          // $('#types').val(orderType);
        },
        preConfirm: (result) => {
          let userid = $("#input-customerid").val();
          let usd2 = $("#input-usd").val();
          let cash2 = $("#input-cash").val();
          let card2 = $("#input-card").val();
          let comment = $("#input-comment").val();
          let consignment = $("#input-cons").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/expenses/edit?&id=" +
                idd +
                "&customerID=" +
                userid +
                "&plastic=" +
                card2 +
                "&cash=" +
                cash2 +
                "&usd=" +
                usd2 +
                "&consignment=" +
                consignment +
                "&comment=" +
                comment,
              "",
              this.options
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
                  this.getListOfTransactions();
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
            html: $("#input-trnum").val() + " is SUCCESSFULLY CHANGED!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  //DELETE READY
  deletetExpense(rowid) {
    swal
      .fire({
        title: "Bu Xarajat nomer: " + rowid + "ni o'chirishni hohlaysizmi?",
        showCancelButton: true,
        confirmButtonText: `Ha, shunday`,
        denyButtonText: `Yo'q`,
      })
      .then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl + "/expenses/delete?id=" + rowid,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  swal.fire("O'chirildi", "", "success");
                  this.getListOfTransactions();
                } else {
                  swal
                    .fire("Error happaned!", response.json().message, "error")
                    .then((result) => {});
                }
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        } else if (result.isDenied) {
          swal.fire("O'zgarmadi", "", "info");
        }
      });
  }

  ngAfterViewInit() {
    return this.getListOfTransactions();
  }
}
