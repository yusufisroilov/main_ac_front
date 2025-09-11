import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";

import swal from "sweetalert2";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";
import { Router } from "@angular/router";
import { AuthService } from "src/app/pages/login/auth.service";
import { TmplAstBoundAttribute } from "@angular/compiler";
import { DatePipe, formatDate } from "@angular/common";

declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare const $: any;

@Component({
  selector: "app-deliveries",
  templateUrl: "./deliveries.component.html",
  styleUrls: ["./deliveries.component.css"],
  providers: [DatePipe],
})
export class DeliveriesComponent implements OnInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  allDataSent: any;
  helloText: string;
  registredMessage: any;
  myDate = new Date();
  trackingNum2: any;

  currentOwnerID: string;
  currentParty: string;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;

  orderFilterStatus: string;
  orderFilterType: string;
  orderFilterOwnId: string;
  orderFilterParty: string;
  orderFilterPartys;
  leftCountItems: number;
  totalLeftCountItems: number;

  printContents;
  popupWin;
  printCondition1: boolean;
  printCondition2: boolean;
  printCondition3: boolean;

  chekId;
  chekName;
  chekphone;
  chekRegion;
  chekTuman;
  chekDelType;
  chekIzoh;

  deliveryTypeText: string[];

  hideForManager: boolean = true;
  deliveryTypes: any[] = [];

  constructor(
    private datePipe: DatePipe,
    private changeDetectorRef: ChangeDetectorRef,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.totalLeftCountItems = 0;

    this.http
      .get(GlobalVars.baseUrl + "/delivery_type/list", this.options)
      .subscribe((response) => {
        this.deliveryTypes = response.json().delivery_types;
      });

    this.allData = [];
    this.allDataSent = [];
    formatDate(new Date(), "dd/MM/yyyy", "en");
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    if (localStorage.getItem("role") == "MANAGER") {
      this.hideForManager = false;
    }

    this.deliveryTypeText = [];

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;

    this.orderFilterStatus = "";
    this.orderFilterType = "";
    this.orderFilterOwnId = "";
    this.orderFilterParty = "";

    this.getListOfNewDeliveries();
    this.getListOfSentDeliveries();
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
  }

  getListOfNewDeliveries() {
    //let filterLink = '&status='+this.orderFilterStatus+"&orderType="+this.orderFilterType+"&ownerID="+this.orderFilterOwnId+"&consignment="+this.orderFilterParty;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/delivery/list?status=in_progress&size=500" +
          "&deliveryType=" +
          this.orderFilterStatus,
        this.options
      )
      .subscribe((response) => {
        this.allData = response.json().deliviries;

        // for (let index = 0; index < this.allData.length; index++) {
        //   const element = this.allData[index];
        //   this.orderTypeText[index] = GlobalVars.getDescriptionWithID(element.orderType, "uz");
        // }

        for (let index = 0; index < this.allData.length; index++) {
          const element1 = this.allData[index];
          this.deliveryTypeText[index] = this.getDeliveriesType(
            element1.deliveryType
          );
        }

        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages >= 1) {
          this.needPagination = true;
          this.mypages = [""];
          for (let i = 0; i < this.totalPages; i++) {
            this.mypages[i] = { id: "name" };
          }
        }
      });
  }

  getListOfSentDeliveries() {
    //let filterLink = '&status='+this.orderFilterStatus+"&orderType="+this.orderFilterType+"&ownerID="+this.orderFilterOwnId+"&consignment="+this.orderFilterParty;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/delivery/list?status=sent&size=500" +
          "&deliveryType=" +
          this.orderFilterStatus,
        this.options
      )
      .subscribe((response) => {
        this.allDataSent = response.json().deliviries;

        // for (let index = 0; index < this.allData.length; index++) {
        //   const element = this.allData[index];
        //   this.orderTypeText[index] = GlobalVars.getDescriptionWithID(element.orderType, "uz");
        // }

        for (let index = 0; index < this.allDataSent.length; index++) {
          const element1 = this.allDataSent[index];
          this.deliveryTypeText[index] = this.getDeliveriesType(
            element1.deliveryType
          );
        }

        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages >= 1) {
          this.needPagination = true;
          this.mypages = [""];
          for (let i = 0; i < this.totalPages; i++) {
            this.mypages[i] = { id: "name" };
          }
        }
      });
  }

  getListOfDeliveriesWithFilter(status) {
    this.orderFilterStatus = status;

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/delivery/list?status=in_progress&deliveryType=" +
          this.orderFilterStatus,
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().deliviries;
          this.totalLeftCountItems = response.json().totalItems;
          // for (let index = 0; index < this.allData.length; index++) {
          //   const element = this.allData[index];
          //   this.deliveryTypeText[index] = GlobalVars.getDescriptionWithID(element.orderType, "uz");
          // }

          for (let index = 0; index < this.allData.length; index++) {
            const element1 = this.allData[index];
            this.deliveryTypeText[index] = this.getDeliveriesType(
              element1.deliveryType
            );
          }

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

  getDeliveriesType(id) {
    for (let index = 0; index < this.deliveryTypes.length; index++) {
      if (this.deliveryTypes[index].id == id) {
        return this.deliveryTypes[index].nameUz;
      }
    }

    return "not found anything";
  }

  printChekYuborish() {
    swal
      .fire({
        title: "Edit the parcel",
        html:
          '<div class="form-group">' +
          '<input id="input-nima" type="text" class="form-control m-2" placeholder="Nimadan" />' +
          '<input id="input-id" type="text" class="form-control m-2" placeholder="ID" />' +
          '<input id="input-phone" type="text" class="form-control m-2" placeholder="Tel Nomer" />' +
          '<input  id="input-vil" type="text" class="form-control m-2" placeholder="Viloyat" />' +
          '<input  id="input-izoh" type="text" class="form-control m-2" placeholder="Izoh" />' +
          "</div>",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          var options = [];
          for (var i = 0; i < this.deliveryTypes.length; i++) {
            options.push(
              '<option value="',
              this.deliveryTypes[i].id,
              '">',
              this.deliveryTypes[i].nameUz,
              "</option>"
            );
          }
          $("#types").html(options.join(""));
        },
        preConfirm: (result) => {
          this.chekId = $("#input-id").val();
          this.chekphone = $("#input-phone").val();
          this.chekRegion = $("#input-vil").val();
          this.chekIzoh = $("#input-izoh").val();
          this.chekDelType = $("#input-nima").val();
          // var i:number = $('#types').val(); '<select class="custom-select m-2" id="types" name="types"> </select> ' +
          // this.chekDelType =this.deliveryTypes[i].nameUz;

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

    this.printCondition3 = false;
  }

  yuborishniBelgilash() {
    swal.fire({
      title: "Yuk yuborilganda biror trek nomerni skanerlang!",
      text: "K ID lar uchun!",
      allowEnterKey: true,
      input: "text",
      confirmButtonText: "YUBORILDI",
      customClass: {
        confirmButton: "btn btn-success",
      },
      buttonsStyling: false,

      preConfirm: (valueB) => {
        this.http
          .post(
            GlobalVars.baseUrl +
              "/orders/client_sent?tracking_number=" +
              valueB,
            "",
            this.options
          )
          .subscribe(
            (response) => {
              if (response.json().status == "error") {
                swal
                  .fire({
                    title: "XATO",
                    text: response.json().message,
                  })
                  .then((result) => {
                    if (result.isConfirmed) {
                    }
                  });
              } else {
                this.yuborishniBelgilash();
              }
            },
            (error) => {
              if (error.status == 400) {
                swal
                  .fire({
                    title: "Not Added",
                    text: "BAD REQUEST: WRONG TYPE OF INPUT",
                  })
                  .then((result) => {
                    if (result.isConfirmed) {
                      this.yuborishniBelgilash();
                    }
                  });
              } else if (error.status == 403) {
                swal
                  .fire({
                    title: "Not Added",
                    text: "YOU ARE UNAUTHORIZED",
                  })
                  .then((result) => {
                    if (result.isConfirmed) {
                      this.yuborishniBelgilash();
                    }
                  });
              }
            }
          );
      },
    });
  }

  printChek1(
    delID,
    type,
    aownerID,
    aownerName,
    aadditionalPhoneNumber,
    aregion,
    atown
  ) {
    this.chekId = aownerID;
    this.chekName = aownerName;
    this.chekphone = aadditionalPhoneNumber;
    this.chekRegion = aregion;
    this.chekTuman = atown;
    this.chekDelType = type;

    this.printCondition1 = true;

    this.changeDetectorRef.detectChanges();
    this.printContents = document.getElementById("print-section1").innerHTML;
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
    this.printCondition1 = false;

    this.http
      .post(
        GlobalVars.baseUrl +
          "/delivery/changeStatus?deliveryID=" +
          delID +
          "&status=sent",
        "",
        this.options
      )
      .subscribe(
        (response) => {
          swal.fire({
            title: "O'zgartirildi!",
            icon: "success",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });

          this.getListOfNewDeliveries();
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  printChek2(
    delID,
    type,
    aownerID,
    aownerName,
    aadditionalPhoneNumber,
    aregion,
    atown
  ) {
    this.chekId = aownerID;
    this.chekName = aownerName;
    this.chekphone = aadditionalPhoneNumber;
    this.chekRegion = aregion;
    this.chekTuman = atown;
    this.chekDelType = type;

    this.printCondition2 = true;

    this.changeDetectorRef.detectChanges();
    this.printContents = document.getElementById("print-section2").innerHTML;
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
    this.printCondition2 = false;

    this.http
      .post(
        GlobalVars.baseUrl +
          "/delivery/changeStatus?deliveryID=" +
          delID +
          "&status=sent",
        "",
        this.options
      )
      .subscribe(
        (response) => {
          swal.fire({
            title: "O'zgartirildi!",
            icon: "success",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });

          this.getListOfNewDeliveries();
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  printChek3(
    type,
    aownerID,
    aownerName,
    aadditionalPhoneNumber,
    aregion,
    atown
  ) {
    this.chekId = aownerID;
    this.chekName = aownerName;
    this.chekphone = aadditionalPhoneNumber;
    this.chekRegion = aregion;
    this.chekTuman = atown;
    this.chekDelType = type;

    this.printCondition3 = true;

    this.changeDetectorRef.detectChanges();
    this.printContents = document.getElementById("print-section3").innerHTML;
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
  }

  getListOfParcelsWithSearch(searchkey) {
    if (searchkey == "") {
      this.currentPage = 0;

      this.getListOfNewDeliveries();
    } else {
      if (searchkey.length > 3) {
        this.http
          .get(
            GlobalVars.baseUrl + "/orders/search?tracking_number=" + searchkey,
            this.options
          )
          .subscribe(
            (response) => {
              this.allData = response.json().orders;

              // for (let index = 0; index < this.allData.length; index++) {
              //   const element = this.allData[index];
              //   this.orderTypeText[index] = GlobalVars.getDescriptionWithID(element.orderType, "uz");
              // }

              // for (let index = 0; index < this.allData.length; index++) {
              //   const element1 = this.allData[index];
              //   this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(element1.status, "uz");
              // }

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
  }

  playAudio() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/incorrect2.mp3";
    audio.load();
    audio.play();
  }

  playAudio2() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/uraa.wav";
    audio.load();
    audio.play();
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    document.getElementById("listcard").scrollIntoView();
    this.getListOfNewDeliveries();
  }

  changeStatusSent(delID) {
    swal
      .fire({
        title: "Yuborilganini tasdiqlaysizmi?",
        text: "Bu yuk yuboilgandan keyin",
        icon: "warning",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        confirmButtonText: "Ha, bu yuk ketdi!",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/delivery/changeStatus?deliveryID=" +
                delID +
                "&status=sent",
              "",
              this.options
            )
            .subscribe(
              (response) => {
                swal.fire({
                  title: "O'zgartirildi!",
                  icon: "success",
                  customClass: {
                    confirmButton: "btn btn-success",
                  },
                  buttonsStyling: false,
                });

                this.getListOfNewDeliveries();
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

  deleteNewDelivey(deliDI) {
    swal
      .fire({
        title: "O'chirishni xoxlaysizmi?",
        text: "Buni qaytarishni imkoni yo'q!",
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
            .post(
              GlobalVars.baseUrl + "/delivery/delete?deliveryID=" + deliDI,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                swal.fire({
                  title: "O'chirildi!",
                  text: "Bu malumot bazadan butun umrga o'chirildi.",
                  icon: "success",
                  customClass: {
                    confirmButton: "btn btn-success",
                  },
                  buttonsStyling: false,
                });

                this.getListOfNewDeliveries();
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
    // console.log("ne is"+ me);
    this.trackingNum2 = me;
  }
}
