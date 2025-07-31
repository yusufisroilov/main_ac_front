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
  selector: "app-allorders",
  templateUrl: "./allorders.component.html",
  styleUrls: ["./allorders.component.css"],
})
export class AllordersComponent implements OnInit {
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
  mypages = [];
  isPageNumActive: boolean;

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
    this.isPageNumActive = false;

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

    return this.getListOfParcels();
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
        "&size=100" +
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
        if (this.totalPages >= 1) {
          this.needPagination = true;
          this.mypages = [""];
          for (let i = 0; i < this.totalPages; i++) {
            this.mypages[i] = { id: "name" };
          }
        }
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
        "&size=100" +
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

      this.getListOfParcels();
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

              for (let index = 0; index < this.allData.length; index++) {
                const element = this.allData[index];
                this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
                  element.order_type,
                  "uz"
                );
              }

              for (let index = 0; index < this.allData.length; index++) {
                const element1 = this.allData[index];
                this.orderStatusText[index] =
                  GlobalVars.getDesOrderStatusWithID(element1.status, "uz");
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

  giveId() {
    this.totalLeftCountItems = 0;

    swal
      .fire({
        title: "ID BERISH",
        allowEnterKey: true,
        input: "text",
        confirmButtonText: "ID BERISH",
        customClass: {
          confirmButton: "btn btn-info",
        },
        buttonsStyling: false,

        preConfirm: (valueB) => {
          this.currentOwnerID = valueB;
          this.getListOfParcelsMoreParties("", "", valueB, "", "ownerid");
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.recordParcel();
        }
      });
  }

  givePartyNum() {
    swal
      .fire({
        title: "Hozirgi Partiya",
        text: "CU bilan birga yozing!",
        allowEnterKey: true,
        input: "text",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "btn btn-success",
        },
        buttonsStyling: false,

        preConfirm: (valueB) => {
          if (valueB.includes(",")) {
            var array = valueB.split(",");
            this.currentParty = valueB;
            this.getListOfParcelsMoreParties("", "", "", array, "partnum");
          } else {
            this.currentParty = valueB;

            this.getListOfParcelsMoreParties(
              "",
              "",
              "",
              this.currentParty,
              "partnum"
            );
          }
        },
      })
      .then((result) => { });
  }

  getListOfParcelsMoreParties(status, type, ownerid, partNums, check) {
    this.allData = [];

    if (check == "status") {
      this.orderFilterStatus = status;
      this.totalLeftCountItems = 0;
    } else if (check == "type") {
      this.orderFilterType = type;
      this.totalLeftCountItems = 0;
    } else if (check == "ownerid") {
      this.orderFilterOwnId = ownerid;
      this.totalLeftCountItems = 0;
    } else if (check == "partnum") {
      this.orderFilterPartys = partNums;
    }

    for (let i = 0; i < this.orderFilterPartys.length; i++) {
      // let filterLink = "&consignment=CU"+partNums[i];
      let filterLink =
        "&status=" +
        this.orderFilterStatus +
        "&orderType=" +
        this.orderFilterType +
        "&ownerID=" +
        this.orderFilterOwnId +
        "&consignment=" +
        this.orderFilterPartys[i];


      this.http
        .get(
          GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=100" +
          filterLink,
          this.options
        )
        .subscribe(
          (response) => {
            if (this.allData.length == 0) {
              this.allData = response.json().orders;
            } else {
              let arrayss = response.json().orders;

              this.allData.push(...arrayss);
            }

            var tmz = response.json().totalItems;
            this.totalLeftCountItems = this.totalLeftCountItems + tmz;

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
  }



  recordParcel() {
    swal
      .fire({
        title: "ID:" + this.currentOwnerID + " NI SKANERLANG!",
        text: "TOSHKENTGA KELDI",
        allowEnterKey: true,
        input: "text",
        confirmButtonText: "KELDI",
        showCancelButton: true,
        cancelButtonText: "ID Berish",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-info",
        },
        buttonsStyling: false,

        preConfirm: (valueB) => {
          this.http.post(
            GlobalVars.baseUrl +
              "/orders/arrivedCheck?tracking_number=" +
              valueB +
              "&ownerID=" +
              this.currentOwnerID +
              "&status=7",
            "",
            this.options
          )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  this.playAudio();
                  swal
                    .fire({
                      title: "XATO",
                      text: response.json().message,
                      backdrop: `
                    rgba(255,0,0,0.4)
                    url("../../../assets/audio/error.gif")
                    left top
                    no-repeat`,
                    })
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  // let filterLink = '&status=5'+"&ownerID="+this.orderFilterOwnId+"&consignment="+this.orderFilterParty;
                  // this.http.get(GlobalVars.baseUrl+'/orders/list?page='+ this.currentPage+'&size=100'+filterLink, this.options)
                  // .subscribe(response => {

                  //   this.leftCountItems = response.json().totalItems;
                  //     if(response.json().totalItems == 0)
                  //     {
                  //       this.playAudio2();
                  //     }

                  // })

                  var leftTemps: number = 0;

                  for (let i = 0; i < this.orderFilterPartys.length; i++) {
                    // let filterLink = "&consignment=CU"+partNums[i];
                    let filterLink =
                      "&status=5" +
                      "&ownerID=" +
                      this.orderFilterOwnId +
                      "&consignment=" +
                      this.orderFilterPartys[i];
                    this.http
                      .get(
                        GlobalVars.baseUrl +
                        "/orders/list?page=" +
                        this.currentPage +
                        "&size=100" +
                        filterLink,
                        this.options
                      )
                      .subscribe(
                        (response) => {
                          leftTemps = leftTemps + response.json().totalItems;
                          this.leftCountItems = leftTemps;
                        },
                        (error) => {
                          if (error.status == 403) {
                            this.authService.logout();
                          }
                        }
                      );
                  }

                  setTimeout(function () {
                    if (leftTemps == 0) {
                      let audio = new Audio();
                      audio.src = "../../../assets/audio/uraa.wav";
                      audio.load();
                      audio.play();
                    }
                  }, 3000);

                  this.recordParcel();
                }
              },
              (error) => {
                if (error.status == 400) {
                  this.playAudio();
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
                  this.playAudio();
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
        if (result.isConfirmed) {
          this.recordParcel();
        } else {
          this.giveId();
        }
      });
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    document.getElementById("listcard").scrollIntoView();
    this.getListOfParcels();
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
    // console.log("ne is"+ me);
    this.trackingNum2 = me;
  }
}
