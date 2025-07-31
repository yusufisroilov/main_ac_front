import { Component, OnInit } from "@angular/core";

import { Router } from "@angular/router";
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ViewChild, ElementRef } from "@angular/core";

import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers } from "@angular/http";
import { DomSanitizer } from "@angular/platform-browser";
import { ChangeDetectorRef } from "@angular/core";

import swal from "sweetalert2";
import { TableData } from "src/app/md/md-table/md-table.component";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";
import { DatePipe } from "@angular/common";

declare var $: any;

@Component({
  selector: "app-big-boxes",
  templateUrl: "./big-boxes.component.html",
  styleUrls: ["./big-boxes.component.css"],
})
export class BigBoxesComponent implements OnInit {
  @ViewChild("myinput") myInputField: ElementRef;
  ngAfterViewInit() {
    this.myInputField.nativeElement.focus();
  }

  validatingForm: UntypedFormGroup;

  public tableData1: TableData;
  public tableData2: TableData;

  options: any;
  headers1: any;
  consignment: any;
  isPartyOpen: boolean;

  boxMessage: string;
  boxNumber: string;
  labelNumber: string;
  boxId: string;
  boxes: any[];
  weightOfBox: string;
  currentWeight: string;
  currentVolume: string;

  total_count: string;

  conditionParty = false;
  conditionBox = false;
  conditionScan = false;
  printLabelCond = false;

  openDate: string;
  consignmentName: string;
  consignmentMessage: string;
  consignmentId: string;

  printContents;
  popupWin;

  printCondition: boolean;

  barcodeVal: string;
  quantityOfProduct: string;
  nameOfProduct: string;

  userId: string;

  thingsInBox: any;

  myDate: any = new Date();

  boxNumInput: string;
  boxData: any;

  headers12: any;

  printContents2;
  popupWin2;
  printCondition2: boolean;

  box_number: string;
  total_price: string;
  total_weight: string;
  receiver_passport: string;
  receiver_id: string;
  company_address: string;
  total_amount: string;
  company_name: string;
  country_name: string;
  print_time: string;
  receiver_name: string;
  receiver_address: string;
  orders: any;
  company_index: string;

  printButtonCond: boolean;
  phone_number: string;

  constructor(
    public authService: AuthService,
    private http: Http,
    private changeDetectorRef: ChangeDetectorRef,
    private httpClient: HttpClient
  ) {
    this.headers1 = new Headers({ "Content-Type": "application/json" });
    this.headers1.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers1 });

    this.userId = localStorage.getItem("id");

    let partyStatus;
    partyStatus = false;
    this.printCondition = false;
    this.barcodeVal = "";
    this.labelNumber = "";
    this.currentWeight = "";
    this.currentVolume = "";

    this.box_number = "";
    this.total_price = "";
    this.total_weight = "";
    this.receiver_passport = "";
    this.receiver_id = "";
    this.company_address = "";
    this.total_amount = "";
    this.company_name = "";
    this.country_name = "";
    this.print_time = "";
    this.receiver_name = "";
    this.receiver_address = "";
    this.phone_number = "";

    this.printButtonCond = false;

    //this.orders;
    this.company_index = "";

    this.http
      .get(GlobalVars.baseUrl + "/consignments/check", this.options)
      .subscribe(
        (response) => {
          if (response.json().status == "ok") {
            partyStatus = true;
            this.openDate = response.json().openDate;
            this.consignmentName = response.json().name;
            this.consignmentId = response.json().id;
            this.consignmentMessage = response.json().message;
            this.showPartyLink();
            this.http
              .get(GlobalVars.baseUrl + "/boxes/check", this.options)
              .subscribe((response) => {
                if (response.json().status == "ok") {
                  partyStatus = true;
                  this.boxMessage = response.json().message;
                  this.boxNumber = response.json().boxNumber;
                  this.boxId = response.json().id;
                  this.hideBoxLink();

                  this.http
                    .get(
                      GlobalVars.baseUrl +
                        "/bigbox/bigbox_items?bigbox_number=" +
                        this.boxNumber,
                      this.options
                    )
                    .subscribe((response) => {
                      if (response.json().status == "ok") {
                        this.thingsInBox = response.json().orders;
                        this.total_count = response.json().total_count;
                      }
                    });
                }
              });

            this.getlistofboxs();
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  ngOnInit() {
    this.validatingForm = new UntypedFormGroup({
      contactFormModalName: new UntypedFormControl("", Validators.required),
      contactFormModalEmail: new UntypedFormControl("", Validators.email),
      contactFormModalSubject: new UntypedFormControl("", Validators.required),
      contactFormModalMessage: new UntypedFormControl("", Validators.required),
    });

    this.tableData2 = {
      headerRow: [
        "No",
        "BigBox ID",
        "Date",
        "Real Weight",
        "Volume",
        "Dimensions",
        "Links",
      ],
      dataRows: [
        ["1", "100110001", "79", "Dakota Rice", "$105", "12", "btn-link"],
        ["2", "100110002", "120", "Minerva Hooper", "$185", "8", "btn-link"],
        ["3", "100110003", "210", "Sage Rodriguez", "$69", "10.6", "btn-link"],
        ["4", "100110004", "333", "Philip Chaney", "$98", "15.6", "btn-link"],
      ],
    };

    this.tableData1 = {
      headerRow: [
        "Owner ID",
        "Owner ID",
        "Native Name",
        "Chinese name",
        "Quantity",
        "Weight",
        "Price",
        "Actions",
      ],
      dataRows: [
        [
          "1",
          "115",
          "Kulrang Kurtka ",
          "婴儿衣服",
          "2",
          "0,78",
          "6,7",
          "btn-link",
        ],
        ["2", "115", "Ayollar", "婴衣服", "1", "0,78", "9", "btn-link"],
        ["3", "115", "Krasovka", "儿衣服", "1", "0,78", "3", "btn-link"],
        ["4", "115", "Mike Monday", "衣服", "3", "0,78", "4", "btn-link"],
        ["5", "115", "Paul Dickens", "婴儿衣", "1", "0,78", "6.7", "btn-link"],
      ],
    };
  }

  get contactFormModalName() {
    return this.validatingForm.get("contactFormModalName");
  }

  get contactFormModalEmail() {
    return this.validatingForm.get("contactFormModalEmail");
  }

  get contactFormModalSubject() {
    return this.validatingForm.get("contactFormModalSubject");
  }

  get contactFormModalMessage() {
    return this.validatingForm.get("contactFormModalMessage");
  }

  openNewBoxFunc() {
    this.http
      .post(GlobalVars.baseUrl + "/bigbox/create", "", this.options)
      .subscribe((response) => {
        this.boxMessage = response.json().message;
        this.boxNumber = response.json().bigbox.bigbox_number;
        this.getlistofboxs();

        this.http
          .get(
            GlobalVars.baseUrl + "/bigbox/bigbox_items:" + this.boxNumber,
            this.options
          )
          .subscribe(
            (response) => {
              if (response.json().status == "ok") {
                this.total_count = response.json().total_count;
                this.thingsInBox = response.json().orders;
              }
            },
            (error) => {
              if (error.status == 403) {
                this.authService.logout();
              }
            }
          );
        this.hideBoxLink();
      });
  }

  getlistofboxs() {
    return this.http
      .get(GlobalVars.baseUrl + "/bigbox/bigboxes_list", this.options)
      .subscribe(
        (response) => {
          this.boxes = response.json().bigboxes;
          this.currentVolume = response.json().totalVolumeWeight;
          this.currentWeight = response.json().totalRealWeight;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  showSwal(type) {
    if (type == "input-field-scan") {
      this.scanParcel();
    } else if (type == "open-party") {
      swal
        .fire({
          title: "Are you sure?",
          text: "You will close the Party scanning and send to Airport!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, I am sure",
          cancelButtonText: "No, let's wait",
          customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-danger",
          },
          buttonsStyling: false,
        })
        .then((result) => {
          if (result.value) {
            swal.fire({
              title: "Party CLOSED!",
              text: "The party is closed.",
              icon: "success",
              customClass: {
                confirmButton: "btn btn-success",
              },
              buttonsStyling: false,
            });
          } else {
            swal.fire({
              title: "Cancelled",
              text: "You can continue to scan!",
              icon: "error",
              customClass: {
                confirmButton: "btn btn-info",
              },
              buttonsStyling: false,
            });
          }
        });
    } else if (type == "input-closebox") {
      swal
        .fire({
          title: "Do you want to close the box?",

          showCancelButton: true,
          customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-danger",
          },
          buttonsStyling: false,
        })
        .then((result) => {
          if (result.value) {
            const answers = result.value;
            const weight = parseFloat(answers);
            this.http
              .post(
                GlobalVars.baseUrl + "/bigbox/closebigbox",
                "",
                this.options
              )
              .subscribe(
                (response) => {
                  swal.fire({
                    icon: "success",
                    html: "Box is closed",
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });

                  this.getlistofboxs();
                  this.hideBoxLink();
                },
                (error) => {
                  if (error.status == 403) {
                    this.authService.logout();
                  }
                }
              );
          } else {
            swal.fire({
              title: "Cancelled",
              text: "You can continue to scan!",
              icon: "error",
              customClass: {
                confirmButton: "btn btn-info",
              },
              buttonsStyling: false,
            });
          }
        });
    }
  }

  showPartyLink() {
    this.conditionParty = !this.conditionParty;
    this.conditionBox = !this.conditionBox;
  }

  reOpenBox(boxNumer) {
    this.http
      .post(
        GlobalVars.baseUrl + "/bigbox/openbigbox?bigbox_number=" + boxNumer,
        "",
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status == "ok") {
            this.boxMessage = response.json().message;
            this.total_count = response.json().total_count;
            this.boxNumber = boxNumer;
            this.boxId = response.json().id;
            this.conditionBox = false;
            this.conditionScan = true;
            //this.hideBoxLink();

            this.http
              .get(
                GlobalVars.baseUrl +
                  "/bigbox/bigbox_items?bigbox_number=" +
                  boxNumer,
                this.options
              )
              .subscribe(
                (response) => {
                  this.thingsInBox = response.json().boxes;
                },
                (error) => {
                  if (error.status == 403) {
                    this.authService.logout();
                  }
                }
              );

            document.getElementById("listcard").scrollIntoView();
            this.getlistofboxs();
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  hideBoxLink() {
    this.conditionBox = !this.conditionBox;
    this.conditionScan = !this.conditionScan;
  }

  removeParcelFromBox(trNum, boxNumer) {
    swal
      .fire({
        title: "Remove From Box!",
        html: '<div style="display: flex; justify-content: center;"> <p id="mytext"> </p> <p id="mytext2"> </p> </div> do you want to remove this?',
        icon: "warning",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        didOpen: () => {
          $("#mytext").append(trNum);
          $("#mytext2").append(", " + boxNumer);
        },
        confirmButtonText: "Yes, remove From Box",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/deleteFromBox?tracking_number=" +
                trNum,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                this.http
                  .post(
                    GlobalVars.baseUrl + "/boxes/reopen?box_number=" + boxNumer,
                    "",
                    this.options
                  )
                  .subscribe((response) => {
                    if (response.json().status == "ok") {
                      this.boxMessage = response.json().message;

                      this.boxNumber = response.json().boxNumber;
                      this.boxId = response.json().id;
                      this.conditionBox = false;
                      this.conditionScan = true;
                      //this.hideBoxLink();
                      this.thingsInBox = response.json().orders;
                      document.getElementById("listcard").scrollIntoView();
                      this.getlistofboxs();
                    }
                  });
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

  playAudio() {
    let audio = new Audio();
    audio.src = "../../../assets/audio/incorrect.mp3";
    audio.load();
    audio.play();
  }

  scanParcel() {
    swal
      .fire({
        title: "SCAN DOCS TO ADD",
        text: "Scan the document barcode to add this box!",
        allowEnterKey: true,
        input: "text",
        confirmButtonText: "ADD",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (valueB) => {
          this.http
            .post(
              GlobalVars.baseUrl + "/bigbox/scan?box_number=" + valueB,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                console.log("response json ", response.json().message);

                if (response.json().status == "error") {
                  swal
                    .fire(
                      "Not Added to Box",
                      response.json().message + " First RECORD THE PARCEL",
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.playAudio();
                      }
                    });
                } else {
                  // this.labelNumber = response.json().label_number;
                  // this.boxNumber = response.json().box_number;
                  // this.nameOfProduct = response.json().name;
                  // this.quantityOfProduct = response.json().quantity;
                  // this.barcodeVal = response.json().tacking_number;
                  // this.printLabelCond = true;
                  // this.print();

                  this.http
                    .get(
                      GlobalVars.baseUrl +
                        "/bigbox/bigbox_items?bigbox_number=" +
                        this.boxNumber,
                      this.options
                    )
                    .subscribe((response) => {
                      if (response.json().status == "ok") {
                        this.thingsInBox = response.json().boxes;
                      }
                    });
                }
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.scanParcel();
        } else {
          swal.fire({
            icon: "warning",
            html: "FINISHED",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  editBoxFunc(boxNum) {
    swal
      .fire({
        title: "Edit the box info",
        // position: 'top-end',
        confirmButtonText: "ADD THIS PARCEL",
        html:
          '<div class="form-group">' +
          '<input  id="input-realweight" type="text" class="form-control m-2" placeholder="Real Weight" />' +
          '<div style="display:flex;"> <input  id="input-length" type="text" class="form-control m-2" placeholder="Length" />' +
          '<input  id="input-height" type="text" class="form-control m-2" placeholder="Height" />' +
          '<input  id="input-width" type="text" class="form-control m-2" placeholder="Width" />' +
          " </div>" +
          "</div>",

        customClass: {
          confirmButton: "btn btn-success",
        },
        buttonsStyling: false,
        didOpen: () => {
          localStorage.removeItem("labelsTemp1");
          var ele = $("input[id=input-trnum]").filter(":visible").focus();
        },
        preConfirm: (result) => {
          let realweightW = $("#input-realweight").val();
          let lengthW = $("#input-length").val();
          let heightW = $("#input-height").val();
          let widthW = $("#input-width").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/bigbox/editbigbox?bigbox_number=" +
                boxNum +
                "&length=" +
                lengthW +
                "&height=" +
                heightW +
                "&width=" +
                widthW +
                "&real_weight=" +
                realweightW,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  var registredMessage = response.json().message;
                  // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
                  swal
                    .fire("Not Added", registredMessage, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  this.getlistofboxs();
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
                        this.getlistofboxs();
                      }
                    });
                }

                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            ); // end of response
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.getlistofboxs();
        }
      });
  }

  assignSerchBox(boxNum) {
    return this.http
      .get(
        GlobalVars.baseUrl + "/boxes/listForStaff?boxNumber=HM138" + boxNum,
        this.options
      )
      .subscribe(
        (response) => {
          this.boxes = response.json().boxes;
          //this.total_count = response.json().total_count;
          //this.currentWeight = response.json().total_weight;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );

    //this.boxNumberInSearch = boxNum;
  }
}
