import { Router } from "@angular/router";
import { Component, OnInit } from "@angular/core";
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
  selector: "app-add-orders",
  templateUrl: "./add-orders.component.html",
  styleUrls: ["./add-orders.component.css"],
  providers: [DatePipe],
})
export class AddOrdersComponent implements OnInit {
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

  boxNumber: string;
  labelNumber: string;
  boxId: string;
  boxes: any[];
  weightOfBox: string;
  currentWeight: string;

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

  boxMessage;
  constructor(
    public authService: AuthService,
    private http: Http,
    private changeDetectorRef: ChangeDetectorRef,
    private httpClient: HttpClient,
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
            // console.log("part res ", response.json());

            partyStatus = true;
            this.openDate = response.json().open_date;
            this.consignmentName = response.json().name;
            this.consignmentId = response.json().id;
            this.consignmentMessage = response.json().message;
            this.showPartyLink();
            this.http
              .get(GlobalVars.baseUrl + "/boxes/check", this.options)
              .subscribe((response) => {
                if (response.json().status == "ok") {
                  // console.log("box res ", response.json());

                  partyStatus = true;
                  this.boxMessage = response.json().message;
                  this.boxNumber = response.json().boxNumber;
                  this.boxId = response.json().id;
                  this.hideBoxLink();

                  this.http
                    .get(
                      GlobalVars.baseUrl +
                        "/orders/listByBox?box_number=" +
                        this.boxNumber,
                      this.options,
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
        },
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
        "Box ID",
        "Date",
        "Assigned Person",
        "Total Sum",
        "Weight",
        "Status",
        "Links",
      ],
      dataRows: [
        [
          "1",
          "100110001",
          "79",
          "Dakota Rice",
          "$105",
          "12",
          "Niger",
          "btn-link",
        ],
        [
          "2",
          "100110002",
          "120",
          "Minerva Hooper",
          "$185",
          "8",
          "Curaçao",
          "btn-link",
        ],
        [
          "3",
          "100110003",
          "210",
          "Sage Rodriguez",
          "$69",
          "10.6",
          "Netherlands",
          "btn-link",
        ],
        [
          "4",
          "100110004",
          "333",
          "Philip Chaney",
          "$98",
          "15.6",
          "Korea, South",
          "btn-link",
        ],
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

  openPartyFunc() {
    swal
      .fire({
        title: "",
        html: `
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600; color: #1a1a2e;">New Consignment</h3>
            <p style="margin: 0; font-size: 13px; color: #6c757d;">Fill in the details below to open a new consignment</p>
          </div>

          <div style="text-align: left; margin-bottom: 18px;">
            <label style="font-size: 13px; font-weight: 600; color: #344767; display: block; margin-bottom: 8px;">
              Consignment Type <span style="color: #e53e3e;">*</span>
            </label>
            <div style="display: flex; gap: 8px;" id="type-selector">
              <div id="btn-avia" onclick="document.getElementById('consignment-type').value='AVIA'; document.getElementById('btn-avia').style.borderColor='#667eea'; document.getElementById('btn-avia').style.background='#f0f0ff'; document.getElementById('btn-avto').style.borderColor='#e2e8f0'; document.getElementById('btn-avto').style.background='#fff'; document.getElementById('consignment-type').dispatchEvent(new Event('change'));"
                style="flex: 1; padding: 8px 8px; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; background: #fff;">
                <span style="font-size: 18px; vertical-align: middle;">&#9992;</span>
                <span style="font-weight: 600; font-size: 13px; color: #344767; vertical-align: middle; margin-left: 4px;">AVIA</span>
             
              </div>
              <div id="btn-avto" onclick="document.getElementById('consignment-type').value='AVTO'; document.getElementById('btn-avto').style.borderColor='#667eea'; document.getElementById('btn-avto').style.background='#f0f0ff'; document.getElementById('btn-avia').style.borderColor='#e2e8f0'; document.getElementById('btn-avia').style.background='#fff'; document.getElementById('consignment-type').dispatchEvent(new Event('change'));"
                style="flex: 1; padding: 8px 8px; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; background: #fff;">
                <span style="font-size: 18px; vertical-align: middle;">&#128666;</span>
                <span style="font-weight: 600; font-size: 13px; color: #344767; vertical-align: middle; margin-left: 4px;">AVTO</span>
                
              </div>
            </div>
            <select id="consignment-type" style="display: none;">
              <option value="" disabled selected></option>
              <option value="AVIA">AVIA</option>
              <option value="AVTO">AVTO</option>
            </select>
          </div>

          <div style="text-align: left; margin-bottom: 6px;">
            <label id="date-label" style="font-size: 13px; font-weight: 600; color: #344767; display: block; margin-bottom: 8px;">
              Departure Date <span style="color: #e53e3e;">*</span>
            </label>
            <input type="date" id="flight-date" style="width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #344767; outline: none; transition: border-color 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e2e8f0'" required>
            <small id="date-hint" style="display: block; margin-top: 6px; font-size: 11px; color: #a0aec0;">Select consignment type first</small>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText:
          '<span style="display: inline-flex; align-items: center; gap: 6px;">Create Consignment</span>',
        cancelButtonText: "Cancel",
        customClass: {
          popup: "swal2-popup",
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        width: 420,
        didOpen: () => {
          const typeSelect = document.getElementById(
            "consignment-type",
          ) as HTMLSelectElement;
          const dateLabel = document.getElementById("date-label");
          const dateHint = document.getElementById("date-hint");

          typeSelect.addEventListener("change", () => {
            if (typeSelect.value === "AVTO") {
              dateLabel.innerHTML =
                'Truck Departure Date <span style="color: #e53e3e;">*</span>';
              dateHint.textContent =
                "Date when shipment departs from truck station (~20 days to UZB)";
              dateHint.style.color = "#6c757d";
            } else if (typeSelect.value === "AVIA") {
              dateLabel.innerHTML =
                'China Airport Date <span style="color: #e53e3e;">*</span>';
              dateHint.textContent =
                "Expected date shipment arrives at China airport (~3 days to UZB)";
              dateHint.style.color = "#6c757d";
            }
          });
        },
        preConfirm: () => {
          const flightDate = (
            document.getElementById("flight-date") as HTMLInputElement
          ).value;
          const consignmentType = (
            document.getElementById("consignment-type") as HTMLSelectElement
          ).value;
          if (!consignmentType) {
            swal.showValidationMessage("Please select a consignment type");
            return false;
          }
          if (!flightDate) {
            swal.showValidationMessage("Please select the departure date");
            return false;
          }
          return { flightDate, consignmentType };
        },
      })
      .then((result) => {
        if (result.isConfirmed && result.value) {
          const flightDate = result.value.flightDate;
          const consignmentType = result.value.consignmentType;
          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/open?in_foreign_airport_date=" +
                flightDate +
                "&type=" +
                consignmentType,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.openDate = response.json().open_date;
                  this.consignmentName = response.json().consignment_name;
                  this.consignmentMessage = response.json().message;
                  this.consignmentId = response.json().id;
                  this.showPartyLink();
                  const typeLabel =
                    consignmentType === "AVTO" ? "🚚 AVTO" : "🛬 AVIA";
                  swal.fire({
                    icon: "success",
                    title: "Consignment Created",
                    text: `New ${typeLabel} consignment has been opened successfully!`,
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });
                }
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

  closePartyFunc() {
    this.http
      .post(
        GlobalVars.baseUrl + "/consignments/close?id=" + this.consignmentId,
        "",
        this.options,
      )
      .subscribe(
        (response) => {
          if (response.json().status == "ok") {
            this.consignmentMessage = response.json().message;
            this.showPartyLink();
            this.getlistofboxs();
            //localStorage.removeItem('current_party');
            GlobalVars.currentParty = "";
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  openNewBoxFunc() {
    this.http
      .post(GlobalVars.baseUrl + "/boxes/open", "", this.options)
      .subscribe((response) => {
        this.boxMessage = response.json().message;
        this.boxNumber = response.json().box_number;
        this.getlistofboxs();
        this.http
          .get(
            GlobalVars.baseUrl +
              "/orders/listByBox?box_number=" +
              this.boxNumber,
            this.options,
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
            },
          );
        this.hideBoxLink();
      });
  }

  getlistofboxs() {
    return this.http
      .get(GlobalVars.baseUrl + "/boxes/listForStaff", this.options)
      .subscribe(
        (response) => {
          this.boxes = response.json().boxes;
          this.total_count = response.json().total_count;
          this.currentWeight = response.json().total_weight;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
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
            this.closePartyFunc();
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
          title: "Input the weight of box",
          input: "text",
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
                GlobalVars.baseUrl + "/boxes/close?weight=" + weight,
                "",
                this.options,
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
                },
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
        GlobalVars.baseUrl + "/boxes/reopen?box_number=" + boxNumer,
        "",
        this.options,
      )
      .subscribe(
        (response) => {
          if (response.json().status == "ok") {
            this.boxMessage = response.json().message;
            this.total_count = response.json().total_count;
            this.boxNumber = response.json().boxNumber;
            this.boxId = response.json().id;
            this.conditionBox = false;
            this.conditionScan = true;
            //this.hideBoxLink();
            this.thingsInBox = response.json().orders;
            document.getElementById("listcard").scrollIntoView();
            this.getlistofboxs();
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
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
              this.options,
            )
            .subscribe(
              (response) => {
                this.http
                  .post(
                    GlobalVars.baseUrl + "/boxes/reopen?box_number=" + boxNumer,
                    "",
                    this.options,
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
              },
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
        title: "SCAN WITHOUT PRINT",
        text: "Scan the parcel to add the box!",
        allowEnterKey: true,
        input: "text",
        confirmButtonText: "Print",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (valueB) => {
          this.http
            .post(
              GlobalVars.baseUrl + "/orders/scan?tracking_number=" + valueB,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  swal
                    .fire(
                      "Not Added to Box",
                      response.json().message + " First RECORD THE PARCEL",
                      "error",
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.playAudio();
                      }
                    });
                } else {
                  this.labelNumber = response.json().label_number;
                  this.boxNumber = response.json().box_number;
                  this.nameOfProduct = response.json().name;
                  this.quantityOfProduct = response.json().quantity;
                  this.barcodeVal = response.json().tacking_number;
                  // this.printLabelCond = true;
                  // this.print();

                  this.http
                    .get(
                      GlobalVars.baseUrl +
                        "/orders/listByBox?box_number=" +
                        this.boxNumber,
                      this.options,
                    )
                    .subscribe((response) => {
                      if (response.json().status == "ok") {
                        this.thingsInBox = response.json().orders;
                      }
                    });
                }
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              },
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

  scanParcelAndPrint() {
    swal
      .fire({
        title: "PRINT LABEL",
        text: "Scan the parcel for printing label!",
        allowEnterKey: true,
        input: "text",
        confirmButtonText: "Print",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (valueB) => {
          this.http
            .post(
              GlobalVars.baseUrl + "/orders/scan?tracking_number=" + valueB,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  swal
                    .fire(
                      "Not Added to Box",
                      response.json().message + " First RECORD THE PARCEL",
                      "error",
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                        this.playAudio();
                      }
                    });
                } else {
                  this.labelNumber = response.json().label_number;
                  this.boxNumber = response.json().box_number;
                  this.nameOfProduct = response.json().name;
                  this.quantityOfProduct = response.json().quantity;
                  this.barcodeVal = response.json().tacking_number;
                  this.printLabelCond = true;
                  this.print();

                  this.http
                    .get(
                      GlobalVars.baseUrl +
                        "/orders/listByBox?box_number=" +
                        this.boxNumber,
                      this.options,
                    )
                    .subscribe((response) => {
                      if (response.json().status == "ok") {
                        this.thingsInBox = response.json().orders;
                      }
                    });
                }
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.scanParcelAndPrint();
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

  print(): void {
    this.changeDetectorRef.detectChanges();
    this.printContents = document.getElementById("print-section").innerHTML;
    this.popupWin = window.open(
      "",
      "_blank",
      "top=0,left=0,height=100%,width=auto",
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
    this.printLabelCond = false;
  }

  editBoxFunc(boxNum) {
    swal
      .fire({
        title: "Input the weight of box for " + boxNum,
        input: "text",
        /*html: '<div class="form-group">' +
          '<input id="input-field" type="text" class="form-control" [(ngModel)]="weightOfBox" /> <br>' +
          '</div>',*/
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
              GlobalVars.baseUrl +
                "/boxes/edit?weight=" +
                weight +
                "&box_number=" +
                boxNum,
              "",
              this.options,
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  swal.fire({
                    title: "Cancelled",
                    text: "The box is not changed: " + response.json().message,
                    icon: "error",
                    customClass: {
                      confirmButton: "btn btn-info",
                    },
                    buttonsStyling: false,
                  });
                } else {
                  swal.fire({
                    icon: "success",
                    html: "Box is changed",
                    customClass: {
                      confirmButton: "btn btn-success",
                    },
                    buttonsStyling: false,
                  });

                  this.getlistofboxs();
                }
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              },
            );
        } else {
          swal.fire({
            title: "Cancelled",
            text: "The box is not changed!",
            icon: "error",
            customClass: {
              confirmButton: "btn btn-info",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  takeBoxData(searchkey) {
    this.http
      .get(
        GlobalVars.baseUrl + "/orders/cn23?box_number=" + searchkey,
        this.options,
      )
      .subscribe(
        (response) => {
          this.box_number = response.json().box_number;
          this.total_price = response.json().total_price;
          this.total_weight = response.json().total_weight;
          this.receiver_passport = response.json().receiver_passport;
          this.receiver_id = response.json().receiver_id;
          this.company_address = response.json().company_address;
          this.total_amount = response.json().total_amount;
          this.company_name = response.json().company_name;
          this.country_name = response.json().country_name;
          this.print_time = response.json().print_time;
          this.receiver_name = response.json().receiver_name;
          this.receiver_address = response.json().receiver_address;
          this.orders = response.json().orders;
          this.company_index = response.json().company_index;
          this.phone_number = response.json().phone_number;

          this.printButtonCond = true;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  takeBoxData2(searchkey) {
    this.http
      .get(
        GlobalVars.baseUrl + "/orders/cn23ForAdmin?box_number=" + searchkey,
        this.options,
      )
      .subscribe(
        (response) => {
          this.box_number = response.json().box_number;
          this.total_price = response.json().total_price;
          this.total_weight = response.json().total_weight;
          this.receiver_passport = response.json().receiver_passport;
          this.receiver_id = response.json().receiver_id;
          this.company_address = response.json().company_address;
          this.total_amount = response.json().total_amount;
          this.company_name = response.json().company_name;
          this.country_name = response.json().country_name;
          this.print_time = response.json().print_time;
          this.receiver_name = response.json().receiver_name;
          this.receiver_address = response.json().receiver_address;
          this.orders = response.json().orders;
          this.company_index = response.json().company_index;
          this.phone_number = response.json().phone_number;

          this.printButtonCond = true;

          this.printBigDoc();
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  printBigDoc(): void {
    this.changeDetectorRef.detectChanges();
    this.printContents2 = document.getElementById("print-section").innerHTML;
    this.popupWin2 = window.open(
      "",
      "_blank",
      "top=0,left=0,height=100%,width=auto",
    );
    this.popupWin2.document.open();
    this.popupWin2.document.write(`
          <html>
            <head>
              <title>Print tab</title>
              <style>
                body { text-align: center; }

                 td{ border-top: 1px solid #000000; 
                      border-bottom: 1px solid #000000; 
                      border-left: 1px solid #000000;
                      border-right: 1px solid #000000;
                      font-size: 12px;
                      
                    }

                  th{ border-top: 1px solid #000000; 
                      border-bottom: 1px solid #000000; 
                      border-left: 1px solid #000000;
                      border-right: 1px solid #000000;
                      font-size: 12px;
                      
                    }

                  .views-table {
                      color: #000;
                      font-weight: 300;
                      font-size: 12px;
                      
                  }

                  .btnprint    {
                      margin: 12px;
                  }

              </style>
            </head>
        <body onload="window.print(); window.close();  "> 
        ${this.printContents2}
        
        </body>
          </html>`);

    //  font-size: 12px;
    this.popupWin2.document.close();

    this.printButtonCond = false;
  }

  assignSerchBox(boxNum) {
    return this.http
      .get(
        GlobalVars.baseUrl + "/boxes/listForStaff?boxNumber=HM138" + boxNum,
        this.options,
      )
      .subscribe(
        (response) => {
          this.boxes = response.json().boxes;
          // console.log("boxes ", this.boxes);

          //this.total_count = response.json().total_count;
          //this.currentWeight = response.json().total_weight;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );

    //this.boxNumberInSearch = boxNum;
  }

  takeBoxDataForLabel(searchkey) {
    this.http
      .get(
        GlobalVars.baseUrl + "/orders/cn23ForAdmin?box_number=" + searchkey,
        this.options,
      )
      .subscribe(
        (response) => {
          this.box_number = response.json().box_number;
          this.total_price = response.json().total_price;
          this.total_weight = response.json().total_weight;
          this.receiver_passport = response.json().receiver_passport;
          this.receiver_id = response.json().receiver_id;
          this.company_address = response.json().company_address;
          this.total_amount = response.json().total_amount;
          this.company_name = response.json().company_name;
          this.country_name = response.json().country_name;
          this.print_time = response.json().print_time;
          this.receiver_name = response.json().receiver_name;
          this.receiver_address = response.json().receiver_address;
          this.orders = response.json().orders;
          this.company_index = response.json().company_index;
          this.phone_number = response.json().phone_number;

          this.printButtonCond = true;

          this.printLabelDoc();
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  printLabelDoc(): void {
    this.changeDetectorRef.detectChanges();
    this.printContents2 = document.getElementById("print-section2").innerHTML;
    this.popupWin2 = window.open(
      "",
      "_blank",
      "top=0,left=0,height=100%,width=auto",
    );
    this.popupWin2.document.open();
    this.popupWin2.document.write(`
          <html>
            <head>
              <title>Print tab</title>
              <style>
              a.comment-indicator:hover + div.comment { background:#ffd; position:absolute; display:block; border:1px solid black; padding:0.5em }
              a.comment-indicator { background:red; display:inline-block; border:1px solid black; width:0.5em; height:0.5em }
              div.comment { display:none }
              table { border-collapse:collapse; page-break-after:always }
              .gridlines td { border:1px dotted black }
              .gridlines th { border:1px dotted black }
              .b { text-align:center }
              .e { text-align:center }
              .f { text-align:right }
              .inlineStr { text-align:left }
              .n { text-align:right }
              .s { text-align:left }
              td.style0 { vertical-align:bottom; border-bottom:none #000000; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:11pt;  }
              th.style0 { vertical-align:bottom; border-bottom:none #000000; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:11pt; }
              td.style1 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt;  }
              th.style1 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt;  }
              td.style2 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt;  }
              th.style2 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt; }
              td.style3 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;  }
              th.style3 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;  }
              td.style4 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt; }
              th.style4 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt; }
              td.style5 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;  }
              th.style5 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt; }
              td.style6 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;}
              th.style6 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt; }
              td.style7 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style7 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style8 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style8 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style9 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:none #000000; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style9 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:none #000000; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style10 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              th.style10 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              td.style11 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              th.style11 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              td.style12 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style12 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style13 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style13 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style14 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style14 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style15 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:none #000000; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style15 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:none #000000; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style16 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style16 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style17 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:14pt;   }
              th.style17 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:14pt;   }
              td.style18 { vertical-align:middle; text-align:left; padding-left:0px; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style18 { vertical-align:middle; text-align:left; padding-left:0px; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style19 { vertical-align:bottom; text-align:right; padding-right:0px; border-bottom:none #000000; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style19 { vertical-align:bottom; text-align:right; padding-right:0px; border-bottom:none #000000; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style20 { vertical-align:bottom; border-bottom:2px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:11pt;   }
              th.style20 { vertical-align:bottom; border-bottom:2px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:11pt;   }
              td.style21 { vertical-align:bottom; border-bottom:none #000000; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style21 { vertical-align:bottom; border-bottom:none #000000; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style22 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              th.style22 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:none #000000; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              td.style23 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              th.style23 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:10pt;   }
              td.style24 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style24 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style25 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:16pt;   }
              th.style25 { vertical-align:middle; text-align:center; border-bottom:none #000000; border-top:1px solid #000000 !important; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; color:#000000; font-family:'Calibri'; font-size:16pt;   }
              td.style26 { vertical-align:middle; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              th.style26 { vertical-align:middle; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:1px solid #000000 !important; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:12pt;   }
              td.style27 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:none #000000; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:22pt;   }
              th.style27 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:1px solid #000000 !important; border-right:none #000000; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:22pt;   }
              td.style28 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:1px solid #000000 !important; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:22pt;   }
              th.style28 { vertical-align:middle; text-align:center; border-bottom:1px solid #000000 !important; border-top:none #000000; border-left:none #000000; border-right:1px solid #000000 !important; font-weight:bold; color:#000000; font-family:'Calibri'; font-size:22pt;   }
              table.sheet0 col.col0 { width:23.04444418pt }
              table.sheet0 col.col1 { width:147.75555386pt }
              table.sheet0 col.col2 { width:27.78888857pt }
              table.sheet0 col.col3 { width:99.63333219pt }
              table.sheet0 col.col4 { width:25.75555526pt }
              table.sheet0 col.col5 { width:37.27777735pt }
              table.sheet0 tr { height:15pt }
              table.sheet0 tr.row0 { height:26.25pt }
              table.sheet0 tr.row1 { height:58.5pt }
              table.sheet0 tr.row2 { height:60.75pt }
              table.sheet0 tr.row3 { height:51pt }
              table.sheet0 tr.row4 { height:33pt }
              table.sheet0 tr.row5 { height:51pt }
              table.sheet0 tr.row6 { height:24.75pt }
              table.sheet0 tr.row8 { height:32.25pt }

              </style>
            </head>
        <body onload="window.print(); window.close();  "> 
        ${this.printContents2}
        
        </body>
          </html>`);

    //  font-size: 12px;
    this.popupWin2.document.close();

    this.printButtonCond = false;
  }
}
