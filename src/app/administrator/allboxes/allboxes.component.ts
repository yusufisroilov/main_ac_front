import { Component, OnInit } from "@angular/core";
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

declare const $: any;

@Component({
  selector: "app-allboxes",
  templateUrl: "./allboxes.component.html",
  styleUrls: ["./allboxes.component.css"],
})
export class AllboxesComponent implements OnInit {
  public dataTable: DataTable;
  public dataTable2: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allBoxesData: any;
  boxOrdersData: any;
  helloText: string;
  registredMessage: any;

  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;
  currentBox: string;
  currentBoxOwner: string;

  showTheList: boolean;

  totalWeight: string;

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    this.showTheList = false;

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    this.getListOfPartyBoxes();
  }

  getListOfPartyBoxes() {
    return this.http
      .get(GlobalVars.baseUrl + "/boxes/listForStaff", this.options)
      .subscribe(
        (response) => {
          this.allBoxesData = response.json().boxes;
          this.totalWeight = response.json().total_weight;
          /*
        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        } */
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  closeListOfBoxItemsLog() {
    this.showTheList = false;
  }

  goToNextBox() {
    let numee: string[] = this.currentBox.split("U", 9);
    let currentRID: string;
    let myintt = parseInt(numee[1]);
    myintt = myintt + 1;
    this.currentBox = "CU" + myintt;
    this.http
      .get(
        GlobalVars.baseUrl + "/boxes/listForStaff?boxNumber=" + this.currentBox,
        this.options
      )
      .subscribe((response) => {
        currentRID = response.json().boxes[0].receiverID;

        this.getListOfParcels(this.currentBox, currentRID);
      });
  }

  goToNPrevBox() {
    let numee: string[] = this.currentBox.split("U", 9);
    let currentRID: string;
    let myintt = parseInt(numee[1]);
    myintt = myintt - 1;
    this.currentBox = "CU" + myintt;
    this.http
      .get(
        GlobalVars.baseUrl + "/boxes/listForStaff?boxNumber=" + this.currentBox,
        this.options
      )
      .subscribe((response) => {
        currentRID = response.json().boxes[0].receiverID;

        this.getListOfParcels(this.currentBox, currentRID);
      });
  }

  getListOfParcels(boxNum, ownId) {
    //let ownerid = localStorage.getItem("id");
    this.currentBox = boxNum;
    this.currentBoxOwner = ownId;

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=50" +
          "&boxNumber=" +
          boxNum,
        this.options
      )
      .subscribe((response) => {
        this.boxOrdersData = response.json().orders;
        this.showTheList = true;
        document.getElementById("buyurtmalar").scrollIntoView();
        /*
        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        } */
      });
  }

  getListOfBoxesWithFilter(rid) {
    //ownerid = localStorage.getItem("id");
    //console.log("me working: " + status + " ty" + type + "ord" + ownerid)

    //let filterLink = '&status='+status+"&orderType="+type+"&ownerID="+ownerid;
    return this.http
      .get(
        GlobalVars.baseUrl + "/boxes/listForStaff?receiverID=" + rid,
        this.options
      )
      .subscribe((response) => {
        this.allBoxesData = response.json().boxes;

        /* this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        } */
      });
  }

  putOwnerBox() {
    swal
      .fire({
        title: "N2, Qabul qiluvchi biriktirish",
        html:
          '<div class="form-group">' +
          '<div style="display:flex;"> <input  id="input-brnum" readonly type="text" class="form-control m-2" placeholder="Box num:" />' +
          '<input  id="input-ownid" type="text" class="form-control m-2" placeholder="Owner RID" />',
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-ownid").focus();

          $("#input-brnum").val(this.currentBox);
          $("#input-ownid").val(this.currentBoxOwner);

          /*  var options = [];
        for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
            options.push('<option value="',
            GlobalVars.orderTypes[i].id, '">',
            GlobalVars.orderTypes[i].descriptionEn, '</option>');
        } 
        $("#types").html(options.join(''));
     
        $('#types').val(orderType); */
        },
        preConfirm: (result) => {
          let ownID = $("#input-ownid").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/boxes/edit?rid=" +
                ownID +
                "&box_number=" +
                this.currentBox,
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
                  this.getListOfPartyBoxes();
                  this.currentBoxOwner = ownID;

                  swal.fire({
                    icon: "success",
                    html: "OK! " + response.json().message,
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });

                  //this.getListOfParcels();
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
                } else if (error.status == 500) {
                  swal
                    .fire("Not Added", "Cause: " + error.error, "error")
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
        /* if (result.isConfirmed) {
        swal.fire({
          icon: 'success',
          html: $('#input-trnum').val() +' is SUCCESSFULLY CHANGED!',
          customClass: {
            confirmButton: 'btn btn-success',
          },
          buttonsStyling: false
        });


      } */
      });
  }

  editBox(boxNumber, ownerID) {
    swal
      .fire({
        title: "Qabul qiluvchi biriktirish",
        html:
          '<div class="form-group">' +
          '<div style="display:flex;"> <input  id="input-brnum" readonly type="text" class="form-control m-2" placeholder="Box num:" />' +
          '<input  id="input-ownid" type="text" class="form-control m-2" placeholder="Owner RID" />',
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-ownid").focus();

          $("#input-brnum").val(boxNumber);
          $("#input-ownid").val(ownerID);

          /*  var options = [];
        for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
            options.push('<option value="',
            GlobalVars.orderTypes[i].id, '">',
            GlobalVars.orderTypes[i].descriptionEn, '</option>');
        } 
        $("#types").html(options.join(''));
     
        $('#types').val(orderType); */
        },
        preConfirm: (result) => {
          let ownID = $("#input-ownid").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/boxes/edit?rid=" +
                ownID +
                "&box_number=" +
                boxNumber,
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
                  this.getListOfPartyBoxes();

                  swal.fire({
                    icon: "success",
                    html: "OK! " + response.json().message,
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });

                  //this.getListOfParcels();
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
                } else if (error.status == 500) {
                  swal
                    .fire("Not Added", "Cause: " + error.error, "error")
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
        /* if (result.isConfirmed) {
        swal.fire({
          icon: 'success',
          html: $('#input-trnum').val() +' is SUCCESSFULLY CHANGED!',
          customClass: {
            confirmButton: 'btn btn-success',
          },
          buttonsStyling: false
        });


      } */
      });
  }

  editParcel(
    trackingNumber,
    price,
    foreignName,
    quantity,
    nativeName,
    ownerID,
    orderType
  ) {
    swal
      .fire({
        title: "Edit the parcel",
        html:
          '<div class="form-group">' +
          '<input id="input-trnum" type="text" class="form-control m-2" readonly placeholder="Tracking Number" />' +
          '<input id="input-cnname" type="text" class="form-control m-2" readonly placeholder="Name in Chinese" />' +
          '<div style="display:flex;"> <input  id="input-qnty" type="text" class="form-control m-2" placeholder="Quantity" />' +
          ' <input  id="input-price" type="text" class="form-control m-2" placeholder="Price" />' +
          " </div>" +
          '<input id="input-runame" type="text" class="form-control m-2" placeholder="Name in Chinese" />' +
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
          $("#input-price").val(price);
          $("#input-qnty").val(quantity);
          $("#input-runame").val(nativeName);

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
          let chineseName = $("#input-cnname").val();
          let quantityOfPar = $("#input-qnty").val();
          let priceOfPar = $("#input-price").val();
          let nativeName = $("#input-runame").val();
          /*+ '&name_uz=' + nativeName*/
          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/edit?tracking_number=" +
                trackingNumber +
                "&name_cn=" +
                chineseName +
                "&type=" +
                orderType +
                "&owner_id=" +
                ownerID +
                "&quantity=" +
                quantityOfPar +
                "&name_ru=" +
                nativeName +
                "&price=" +
                priceOfPar,
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
                  swal.fire({
                    icon: "success",
                    html: "OK: " + response.json().message,
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });

                  this.getListOfParcels(this.currentBox, this.currentBoxOwner);
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
        }
      });
  }

  /*
  receiveParcel(trNum){

    swal.fire({
      title: 'Qabul qildim!',
      text: "Belgilangan xx xxx buyutmani olganingizni tasdilaysizmi?",
      icon: 'warning',
      showCancelButton: true,
      customClass:{
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger',
      },
      confirmButtonText: 'Ha, buni oldim',
       buttonsStyling: false
    }).then((result) => {
      if (result.value) {
     
      //  this.http.delete(GlobalVars.baseUrl + '/orders/delete?tracking_number=' + trNum, this.options)
        //        .subscribe(response => {

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


              //  })  
     
      }
    })


  }

  getInfoOfParcel(me)
  {
    console.log("ne is"+ me);
    this.trackingNum2 = me;  
  }
   */

  ngOnInit(): void {
    this.dataTable = {
      headerRow: [
        "No",
        "Box Number",
        "Biriktirilgan",
        "Soni",
        "Summasi",
        "Og'irligi",
        "Amallar",
      ],

      dataRows: [],
    };

    this.dataTable2 = {
      headerRow: [
        "No",
        "Track number",
        "Chinese name",
        "Rus name",
        "Soni",
        "Price",
        "Amallar",
      ],

      dataRows: [],
    };
  }

  ngAfterViewInit() {
    return this.getListOfPartyBoxes();
  }
}
