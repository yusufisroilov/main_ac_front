import { AfterViewInit, Component, OnInit } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";

import swal from "sweetalert2";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";
import { Router } from "@angular/router";
import { AuthService } from "src/app/pages/login/auth.service";

declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare const $: any;

@Component({
  selector: "app-finance",
  templateUrl: "./finance.component.html",
  styleUrls: ["./finance.component.css"],
})
export class FinanceComponent implements OnInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  helloText: string;
  registredMessage: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;

  orderFilterStatus: string;
  orderFilterType: string;
  orderFilterOwnId: string;
  orderFilterParty: string;

  currentFinID: string;
  currentDeliveredCase: boolean;
  allPaid: string;

  totalItems: string;
  totalWeight: string;
  totalUSD: string;
  totalUZS: string;
  totalPaidUSD: string;
  totalPaidUZS: string;
  totalPaidPlastic: string;
  totalDebtUSD: string;
  totalDebtUZS: string;
  openToBobOnly: boolean = false;
  consignmentName: string;
  activeConsignment: string;
  showLastFinance: boolean = false;
  enteredLast: string;
  enteredBeforeLast: string;

  hideForManager: boolean = true;

  currentParty: any = "";

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    if (localStorage.getItem("role") == "MANAGER") {
      this.hideForManager = false;
    }

    // if (localStorage.getItem("id") == "631") {
    //   this.openToBobOnly = true;
    // }

    this.allPaid = "g";
    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;

    this.currentFinID = "";

    this.orderFilterStatus = "";
    this.orderFilterType = "";
    this.orderFilterOwnId = "";
    this.orderFilterParty = "";
  }

  ngOnInit() {
    this.dataTable = {
      headerRow: [
        "No",
        "IDsi",
        "Kilosi",
        "USD da",
        "SO'M da",
        "To'ladi USD",
        "To'ladi NAQD",
        "To'ladi PLASTIK",
        "QOLDI",
      ],

      dataRows: [],
    };

    this.currentParty = localStorage.getItem("current_party");
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
    this.currentParty = localStorage.getItem("current_party");
    return this.getListOfFinance();
  }

  getListOfFinance() {
    //let filterLink = '&status='+this.orderFilterStatus+"&orderType="+this.orderFilterType+"&ownerID="+this.orderFilterOwnId+"&consignment="+this.orderFilterParty;
    return this.http
      .get(GlobalVars.baseUrl + "/finance/list?size=800", this.options)
      .subscribe(
        (response) => {
          this.allData = response.json().finances;
          this.totalItems = response.json().totalItems;
          this.totalWeight = response.json().totalWeight;
          this.totalUSD = response.json().totalUSD;
          this.totalUZS = response.json().totalUZS;
          this.totalPaidUSD = response.json().totalPaidUSD;
          this.totalPaidUZS = response.json().totalPaidUZS;
          this.totalPaidPlastic = response.json().totalPaidPlastic;
          this.totalDebtUSD = response.json().totalDebtUSD;
          this.totalDebtUZS = response.json().totalDebtUZS;
          this.activeConsignment = response.json().activeConsignment;

          // this.currentPage = response.json().currentPage;
          //  this.totalPages = response.json().totalPages;
          // if (this.totalPages >= 1) {
          //   this.needPagination = true;
          //   this.mypages=[''];
          //   for(let i=0; i<this.totalPages;i++){
          //     this.mypages[i] = {id: "name"};

          //   }
          // }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // openCurrentParty(party: string){

  //   this.consignmentName = party;

  // }

  // openFinanceParty()
  // {

  //   swal.fire({
  //     title: 'KURS KIRITING',
  //     allowEnterKey: true,
  //     html: '<div class="form-group">' +
  //       '<input id="input-rate" type="text" class="form-control m-2" placeholder="kurs" />' +
  //       '</div>',
  //     confirmButtonText: "KIRITISH",
  //     customClass: {
  //       confirmButton: 'btn btn-info',
  //     },
  //     buttonsStyling: false,
  //     didOpen: () => {

  //       $('#input-rate').val(rate);

  //      },
  //     preConfirm: (valueB) => {

  //       let newRate = $('#input-rate').val();

  //       this.http.post(GlobalVars.baseUrl + '/consignments/refinance?consignment='+this.consignmentName+'&rate=' + newRate,'', this.options)
  //       .subscribe(response => {

  //         if(response.json().status == "ok")
  //         {

  //           this.http.get(GlobalVars.baseUrl + '/consignments/list', this.options)
  //           .subscribe(response => {

  //            this.consignments=response.json().consignments;

  //           })

  //         }else {

  //           swal.fire('Error happaned!', response.json().message, 'error').then((result) => { } );
  //         }

  //       }, error => {
  //         if (error.status == 403) {

  //           this.authService.logout();

  //         }
  //     })

  //         },

  //         }).then((result) => {
  //           if (result.isConfirmed) {
  //               swal.fire('OMADLI!','O\'zgartirildi','success');
  //           }
  //         }
  //         )

  // }

  getListOfFinanceWithFilter(id: string) {
    if (id != "") {
      this.currentFinID = id;
    }
    // if (deliver != null) {this.currentDeliveredCase = deliver; }
    if (id == "") {
      this.currentFinID = "";
    }
    // console.log("current id ", this.currentFinID);

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/finance/list?size=500&ownerId=" +
          this.currentFinID,
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().finances;
          this.totalItems = response.json().totalItems;
          this.totalWeight = response.json().totalWeight;
          this.totalUSD = response.json().totalUSD;
          this.totalUZS = response.json().totalUZS;
          this.totalPaidUSD = response.json().totalPaidUSD;
          this.totalPaidUZS = response.json().totalPaidUZS;
          this.totalPaidPlastic = response.json().totalPaidPlastic;
          this.totalDebtUSD = response.json().totalDebtUSD;
          this.totalDebtUZS = response.json().totalDebtUZS;
          this.activeConsignment = response.json().activeConsignment;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
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
          "&size=300" +
          filterLink,
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;
          this.allData = response.json().orders;
          this.totalItems = response.json().totalItems;
          this.totalWeight = response.json().totalWeight;
          this.totalUSD = response.json().totalUSD;
          this.totalUZS = response.json().totalUZS;
          this.totalPaidUSD = response.json().totalPaidUSD;
          this.totalPaidUZS = response.json().totalPaidUZS;
          this.totalPaidPlastic = response.json().totalPaidPlastic;
          this.totalDebtUSD = response.json().totalDebtUSD;
          this.totalDebtUZS = response.json().totalDebtUZS;
          this.activeConsignment = response.json().activeConsignment;

          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          if (this.totalPages >= 1) {
            this.needPagination = true;
            this.mypages = [""];
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
    if (searchkey == "") {
      this.currentPage = 0;

      this.getListOfFinance();
    } else {
      this.http
        .get(
          GlobalVars.baseUrl + "/orders/search?tracking_number=" + searchkey,
          this.options
        )
        .subscribe(
          (response) => {
            this.allData = response.json().orders;
            this.totalItems = response.json().totalItems;
            this.totalWeight = response.json().totalWeight;
            this.totalUSD = response.json().totalUSD;
            this.totalUZS = response.json().totalUZS;
            this.totalPaidUSD = response.json().totalPaidUSD;
            this.totalPaidUZS = response.json().totalPaidUZS;
            this.totalPaidPlastic = response.json().totalPaidPlastic;
            this.totalDebtUSD = response.json().totalDebtUSD;
            this.totalDebtUZS = response.json().totalDebtUZS;
            this.activeConsignment = response.json().activeConsignment;

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

  recordFinance() {
    swal
      .fire({
        title: "XISOB KITOB QO'SHISH!",
        html:
          '<div class="form-group">' +
          '<input  id="input-owid" type="text" class="form-control m-2" placeholder="Mijoz IDsi" />' +
          '<input  id="input-weight" type="text" class="form-control m-2" placeholder="Yuk Og\'rili" />' +
          "</div>",
        confirmButtonText: "QO'SHISH",
        customClass: {
          confirmButton: "btn btn-success",
        },
        buttonsStyling: false,
        didOpen: () => {
          this.showLastFinance = true;
          var ele = $("input[id=input-owid]").filter(":visible").focus();
        },
        preConfirm: (result) => {
          this.enteredBeforeLast = this.enteredLast;
          let ownerId = $("#input-owid").val();
          let weight = $("#input-weight").val();
          this.enteredLast = ownerId + " ID ga " + weight + " kg";

          this.http
            .post(
              GlobalVars.baseUrl +
                "/finance/add?owner_id=" +
                ownerId +
                "&weight=" +
                weight +
                "&name=" +
                localStorage.getItem("current_party"),
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
                        this.recordFinance();
                      } else {
                      }
                    });
                } else {
                  this.getListOfFinance();
                  return false;
                }
              },

              (error) => {
                if (error) {
                  swal
                    .fire(
                      "Not Added",
                      `BAD REQUEST: ${error.json().error}`,
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.recordFinance();
                      } else {
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
          this.recordFinance();
        }
      });
  }

  findConsignmentByName() {
    swal
      .fire({
        title: "Partiya Raqamini Qidirish",
        html:
          '<div class="form-group">' +
          '<input  id="name" type="text" class="form-control m-2" placeholder="Partiya Raqami..." />' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "Qidirish",
        cancelButtonText: "Bekor qilish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (result) => {
          let name = $("#name").val();

          this.http
            .get(
              GlobalVars.baseUrl + "/consignments/info?name=" + name,
              this.options
            )
            .subscribe(
              (response) => {
                localStorage.setItem(
                  "current_party",
                  response.json().consignment.name
                );

                if (response.json().status == "error") {
                  this.registredMessage = response.json().message;
                  swal
                    .fire("Not Added", this.registredMessage, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.findConsignmentByName();
                      } else {
                      }
                    });
                } else {
                  this.getListOfFinance();
                  return false;
                }
              },
              (error) => {
                if (error) {
                  swal
                    .fire(
                      "Not Added",
                      `BAD REQUEST: ${error.json().error}`,
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.findConsignmentByName();
                        this.currentParty =
                          localStorage.getItem("current_party");
                      } else {
                        this.getListOfFinance();
                        return false;
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
          swal
            .fire({
              icon: "success",
              html: $("#name").val() + " Partiya Ochildi",
              customClass: {
                confirmButton: "btn btn-success",
              },
              buttonsStyling: false,
            })
            .then(() => {
              this.currentParty = localStorage.getItem("current_party");
            });
        }
      });
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    document.getElementById("listcard").scrollIntoView();
    this.getListOfFinance();
  }

  editFinance(finId, weight, usd, cash, card, ownerId) {
    swal
      .fire({
        title: "Xisob O'zgartirish!",
        html:
          '<div class="form-group">' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Kilosi:</label><input id="input-weight" type="text" class="form-control m-2" placeholder="Kilosi" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">USD $:</label><input id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORDA" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Naqd:</label><input  id="input-cash" type="text" class="form-control m-2" placeholder="NAQD" /> </div> ' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">Plastik:</label>  <input  id="input-card" type="text" class="form-control m-2" placeholder="PLASTIK" /> </div>' +
          '<div class="form-group" style="display: block ruby;"><label for="input-card">RATE</label> <input  id="input-rate" type="text" class="form-control m-2" placeholder="RATE" /> </div> ' +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "O'zgartish",
        cancelButtonText: "No",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-weight").val(weight);
          $("#input-usd").val(usd);
          $("#input-cash").val(cash);
          $("#input-card").val(card);

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
          let weight2 = $("#input-weight").val();
          if ($("#input-weight").val() == weight) {
            weight2 = "";
          }
          console.log("wieght ", weight2);

          let usd2 = $("#input-usd").val();
          let cash2 = $("#input-cash").val();
          let card2 = $("#input-card").val();
          let rate2 = $("#input-rate").val();

          if (rate2 || weight2) {
            this.http
              .post(
                GlobalVars.baseUrl +
                  "/finance/changeRK?owner_id=" +
                  ownerId +
                  "&id=" +
                  finId +
                  "&weight=" +
                  weight2 +
                  "&name=" +
                  localStorage.getItem("current_party") +
                  "&perKg=" +
                  rate2,
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
                          this.recordFinance();
                        } else {
                        }
                      });
                  } else {
                    this.getListOfFinance();
                    return false;
                  }
                },
                (error) => {
                  if (error) {
                    swal
                      .fire(
                        "Not Added",
                        `BAD REQUEST: ${error.json().error}`,
                        "error"
                      )
                      .then((result) => {
                        if (result.isConfirmed) {
                          this.getListOfFinance();
                          this.recordFinance();
                        } else {
                        }
                      });
                  }

                  if (error.status == 403) {
                    this.authService.logout();
                  }
                }
              );
          }
          this.http
            .post(
              GlobalVars.baseUrl +
                "/finance/edit?plastic=" +
                card2 +
                "&cash=" +
                cash2 +
                "&usd=" +
                usd2 +
                "&id=" +
                finId +
                "&rate=" +
                rate2,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                this.getListOfFinance();
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
                  return false;
                }
              },
              (error) => {
                if (error) {
                  swal
                    .fire(
                      "Not Added",
                      `BAD REQUEST: ${error.json().error}`,
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.getListOfFinance();
                      }
                    });
                }
              }
            );
        },
      })
      .then((result) => {
        this.getListOfFinance();
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

  checkDebt(debt) {
    if (debt <= 5000) {
      this.allPaid = "less";
      return this.allPaid;
    } else {
      this.allPaid = "g";
      return this.allPaid;
    }
  }

  gototransactions() {
    this.router.navigate(["/uzm/transactions"]);
  }

  addFinance(finId) {
    swal
      .fire({
        title: "Xisob Qo'shish!",
        html:
          '<div class="form-group">' +
          '<input id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORda berdi" />' +
          '<input id="input-cash" type="text" class="form-control m-2" placeholder="NAQD PUL BERDI" />' +
          '<input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIKDA BERDI" />' +
          '<input id="input-izoh" type="text" class="form-control m-2" placeholder="IZOH QOLDIRISH" />' +
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
          let izoh = $("#input-izoh").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/finance/pay?id=" +
                finId +
                "&plastic=" +
                card +
                "&usd=" +
                usd +
                "&cash=" +
                cash +
                "&comment=" +
                izoh,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                this.getListOfFinance();
                if (response.json().status == "error") {
                  // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
                  swal
                    .fire("Not Added", response.json().message, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  return false;
                }
              },
              (error) => {
                if (error) {
                  swal
                    .fire(
                      "Not Added",
                      `BAD REQUEST: ${error.json().error}`,
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.getListOfFinance();
                      }
                    });
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.getListOfFinance();
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

  deliveredFunc(trNum, owID) {
    swal
      .fire({
        title: "Bu yuki yetkazildimi??",
        text: "ID " + owID + "ning Yuki yetkazilganini tasdiqlaysizmi?",
        icon: "warning",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        confirmButtonText: "Ha, Yetkazildi!",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/finance/edit?delivered=true" +
                "&id=" +
                trNum,
              "",
              this.options
            )
            .subscribe((response) => {
              swal.fire({
                title: "Tasdiqlandi!",
                text: "Bu yuk yetkazildi.",
                icon: "success",
                customClass: {
                  confirmButton: "btn btn-success",
                },
                buttonsStyling: false,
              });

              this.getListOfFinance();
            });
        }
      });
  }

  getListwithFiltr(cond) {
    return this.http
      .get(GlobalVars.baseUrl + "/finance/list?size=300", this.options)
      .subscribe(
        (response) => {
          if (cond == "true") {
            this.allData = response
              .json()
              .finances.filter((r) => r.debt_uzs > 5000);
          } else if (cond == "false") {
            this.allData = response
              .json()
              .finances.filter((r) => r.debt_uzs < 5000);
          } else {
            this.allData = response.json().finances;
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
