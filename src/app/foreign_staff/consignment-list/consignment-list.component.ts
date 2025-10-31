import { GlobalVars } from "./../../global-vars";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
} from "@angular/core";
import { TableData } from "src/app/md/md-table/md-table.component";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers } from "@angular/http";

import swal from "sweetalert2";

import { AuthService } from "src/app/pages/login/auth.service";

declare const $: any;

@Component({
  selector: "app-consignment-list",
  templateUrl: "./consignment-list.component.html",
  styleUrls: ["./consignment-list.component.css"],
})
export class ConsignmentListComponent implements OnInit {
  public tableData1: TableData;
  consignments: any[];
  options: any;
  showOnlyManagers: boolean;
  showOnlyManagers631: boolean = false;

  manifestData: any;
  totalWeight: string = "";
  totalPrice: string = "";
  consingmentName: string = "";
  activeConsignment = "";

  printContents;
  popupWin;

  printManifestCond: boolean;

  showOnlyForManagers: boolean = false;

  registredMessage: string;

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
    public authService: AuthService
  ) {
    if (
      localStorage.getItem("role") == "MANAGER" ||
      localStorage.getItem("role") == "ADMIN"
    ) {
      this.showOnlyForManagers = true;
    } else if (localStorage.getItem("role") == "UZBSTAFF") {
      this.showOnlyManagers631 = true;
    }

    let headers1 = new Headers({ "Content-Type": "application/json" });
    headers1.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: headers1 });
    this.printManifestCond = false;

    //this.activeConsignment = localStorage.getItem('current_party');
    this.activeConsignment = GlobalVars.currentParty;
  }

  ngOnInit() {
    this.http
      .get(GlobalVars.baseUrl + "/consignments/list", this.options)
      .subscribe((response) => {
        this.consignments = response.json().consignments;
      });

    this.tableData1 = {
      headerRow: [
        "Party number",
        "Open date",
        "Air waybill",
        "Real Weight",
        "Volume Weight",
      ],
      dataRows: [["CU1001", "2021-01-17", "250-50798182", "158kg", "160kg"]],
    };
  }

  loadConsignments() {
    this.http
      .get(GlobalVars.baseUrl + "/consignments/list", this.options)
      .subscribe((response) => {
        this.consignments = response.json().consignments;
      });
  }

  editParty(conid: any) {
    swal
      .fire({
        title: "Change Consignment Details",
        html:
          '<div class="form-group">' +
          '<input  id="airWayBill" type="text" class="form-control m-2" placeholder="Air Waybill Number: " autofocus />' +
          '<div style="display:flex;"> <input  id="volumeWeight" type="text" class="form-control m-2" placeholder="Volume Weight: " />' +
          '<input  id="realWeight" type="text" class="form-control m-2" placeholder="Real Weight:" />' +
          " </div> </div>",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          var ele = $("input[id=input-trnum]").filter(":visible").focus();
        },
        preConfirm: (result) => {
          let airWayBill = $("#airWayBill").val();
          let volumeWeight = $("#volumeWeight").val();
          let realWeight = $("#realWeight ").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/edit?name=" +
                conid +
                "&volume=" +
                volumeWeight +
                "&mass=" +
                realWeight +
                "&airway_bill=" +
                airWayBill,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  this.registredMessage = response.json().message;
                  swal
                    .fire("Error happaned!", this.registredMessage, "error")
                    .then((result) => {});
                }

                this.http
                  .get(GlobalVars.baseUrl + "/consignments/list", this.options)
                  .subscribe((response) => {
                    this.consignments = response.json().consignments;
                  });
              },
              (error) => {
                if (error.status == 400) {
                  swal
                    .fire(
                      "Error happaned!",
                      "BAD REQUEST: WRONG TYPE OF INPUT",
                      "error"
                    )
                    .then((result) => {});
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
            html: "Changed!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  joinConsignments() {
    swal
      .fire({
        title: "Partiyalarni birlashtirish",
        text: "Partiya nomerlarini kiriting: 'CU101,CU102' kabi. Iltimos extiyot bo'ling!",
        input: "text",
        confirmButtonText: "Saqlash",
        cancelButtonText: "No",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-info",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,

        preConfirm: (valueB) => {
          this.http
            .post(
              GlobalVars.baseUrl + "/consignments/merge?consignments=" + valueB,
              "",
              this.options
            )
            .subscribe((response) => {
              swal.fire("O'zgartirildi", "", "success");
            });
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.http
            .get(GlobalVars.baseUrl + "/consignments/list", this.options)
            .subscribe((response) => {
              this.consignments = response.json().consignments;
            });
        }
      });
  }

  takeSNK(partyNum: any) {
    window.open(
      GlobalVars.baseUrl + "/consignments/generate_snk?consignment=" + partyNum,
      "_blank"
    );
    // this.http.get(GlobalVars.baseUrl + '/consignments/generate_snk?consignment=' + partyNum, this.options)
    // .subscribe(response => {
    // // this.consignments=response.json().consignments;
    // })
  }

  takePackingcList(partyNum: any) {
    window.open(
      GlobalVars.baseUrl + "/consignments/packing_list?consignment=" + partyNum,
      "_blank"
    );
    // this.http.get(GlobalVars.baseUrl + '/consignments/packing_list?consignment=' + partyNum, this.options)
    //  .subscribe(response => {
    // this.consignments=response.json().consignments;
    // })
  }

  receiversReport(partyNum: any) {
    window.open(
      GlobalVars.baseUrl +
        "/consignments/receiversReport?consignment=" +
        partyNum,
      "_blank"
    );
    // this.http.get(GlobalVars.baseUrl + '/consignments/packing_list?consignment=' + partyNum, this.options)
    //  .subscribe(response => {
    // this.consignments=response.json().consignments;
    // })
  }

  takeManifestExcel(partyNum: any) {
    window.open(
      GlobalVars.baseUrl + "/consignments/manifest?consignment=" + partyNum,
      "_blank"
    );
    // this.http.get(GlobalVars.baseUrl + '/consignments/packing_list?consignment=' + partyNum, this.options)
    //  .subscribe(response => {
    // this.consignments=response.json().consignments;
    // })
  }

  tranc(openDate) {
    let date = openDate as string;
    return date.substr(0, 16);
  }

  takeManifestData(consNum) {
    this.http
      .get(
        GlobalVars.baseUrl + "/consignments/manifest?consignment=" + consNum,
        this.options
      )
      .subscribe(
        (response) => {
          this.manifestData = response.json().boxes;
          this.totalPrice = response.json().total_price;
          this.totalWeight = response.json().gross_weight;
          this.printManifestCond = true;
          this.consingmentName = consNum;
          this.changeDetectorRef.detectChanges();
          this.printContents =
            document.getElementById("print-section").innerHTML;
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
          this.printManifestCond = false;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  reOpenParty(consignmentName) {
    this.http
      .post(
        GlobalVars.baseUrl +
          "/consignments/reopen?consignment=" +
          consignmentName,
        "",
        this.options
      )
      .subscribe(
        (response) => {
          if (response.json().status == "ok") {
            //localStorage.setItem("current_party", consignmentName);
            GlobalVars.currentParty = consignmentName;
            this.activeConsignment = GlobalVars.currentParty;

            this.http
              .get(GlobalVars.baseUrl + "/consignments/list", this.options)
              .subscribe((response) => {
                this.consignments = response.json().consignments;
              });
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
  }

  reOpenFinance(consignmentName, rate) {
    swal
      .fire({
        title: "KURS KIRITING",
        allowEnterKey: true,
        html:
          '<div class="form-group">' +
          '<input id="input-rate" type="text" class="form-control m-2" placeholder="kurs" />' +
          "</div>",
        confirmButtonText: "KIRITISH",
        customClass: {
          confirmButton: "btn btn-info",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-rate").val(rate);
        },
        preConfirm: (valueB) => {
          let newRate = $("#input-rate").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/refinance?consignment=" +
                consignmentName +
                "&rate=" +
                newRate,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options
                    )
                    .subscribe((response) => {
                      localStorage.setItem("current_party", consignmentName);
                      this.consignments = response.json().consignments;
                    });
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
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire("OMADLI!", "O'zgartirildi", "success");
        }
      });
  }

  makeHKparty(consignmentName, rate) {
    swal
      .fire({
        title: "BU reysni HONG KONG qimoqchimisiz?",
        allowEnterKey: true,
        html:
          '<div class="form-group">' +
          '<input id="input-rate" type="text" class="form-control m-2" placeholder="Tarif" />' +
          "</div>",
        confirmButtonText: "KIRITISH",
        customClass: {
          confirmButton: "btn btn-info",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-rate").val(rate);
        },
        preConfirm: (valueB) => {
          let newRate = $("#input-rate").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/makeHK?consignment=" +
                consignmentName +
                "&hongKongRate=" +
                newRate,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options
                    )
                    .subscribe((response) => {
                      this.consignments = response.json().consignments;
                    });
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
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire("OMADLI!", "O'zgartirildi", "success");
        }
      });
  }

  undoHKparty(consignmentName) {
    swal
      .fire({
        title: "Bu HK Partiyani oddiy qilishni xoxlaysizmi?",
        showCancelButton: true,
        confirmButtonText: `Ha, oddiy`,
        denyButtonText: `NO`,
      })
      .then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/undoHK?consignment=" +
                consignmentName,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options
                    )
                    .subscribe((response) => {
                      swal.fire("O'zgardi!", "", "success");
                      this.consignments = response.json().consignments;
                    });
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

  changeStatusParty(consignmentName, status) {
    swal
      .fire({
        title: "Partiya   statusini o'zgartirishni hohlaysizmi?",
        showCancelButton: true,
        confirmButtonText: `Save`,
        denyButtonText: `Don't save`,
      })
      .then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/consignments/updateConsignment?consignment=" +
                consignmentName +
                "&status=" +
                status,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.http
                    .get(
                      GlobalVars.baseUrl + "/consignments/list",
                      this.options
                    )
                    .subscribe((response) => {
                      swal.fire("O'zgardi!", "", "success");
                      this.consignments = response.json().consignments;
                    });
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

  printManifest(partyNum) {
    // console.log("c n " + partyNum);
    this.takeManifestData(partyNum);
  }
}
