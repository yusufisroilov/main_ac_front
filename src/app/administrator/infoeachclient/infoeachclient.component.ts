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

interface PackageGroup {
  type: "tied" | "single";
  identifier: string;
  tie_group_id?: string;
  total_packages: number;
  total_items: number;
  consignments: string[];
  package_barcodes: string[];
  packages: any[];
  weights: any[];
  selected?: boolean;
  selectionType?: "full" | "partial";
  selectedConsignment?: string;
}

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

  // Original properties
  trackingNum: string;
  headers12: any;
  options: any;
  headers22: any;
  options2: any;
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

  // New delivery-related properties
  selectedConsignmentId: string = "";
  selectedConsignmentName: string = "";
  selectedConsignmentWeight: string = "";
  selectedConsignmentQuantity: string = "";

  // Customer packages data
  customerPackages: PackageGroup[] = [];
  selectedPackageIdentifiers: string[] = [];
  loadingCustomerPackages: boolean = false;

  // Delivery form data
  deliveryType: string = "";
  customerPhone: string = "";
  deliveryAddress: string = "";
  courierName: string = "";
  courierPhone: string = "";
  deliveryFee: number = 0;
  yandexFee: number = 0;
  deliveryNotes: string = "";

  // NEW: Auto-fill tracking properties
  isEmuDataAutoFilled: boolean = false;
  lastEmuDeliveryId: string = "";
  autoFilledFields: {
    regionId: boolean;
    branchId: boolean;
    phone: boolean;
  } = {
    regionId: false,
    branchId: false,
    phone: false,
  };

  // EMU data
  regions: any[] = [];
  branches: any[] = [];
  selectedRegionId: number | null = null;
  selectedBranchId: number | null = null;
  selectedBranchName: string = "";

  // Delivery creation state
  creatingDelivery: boolean = false;

  // Print delivery receipt
  printConditionDelivery: boolean = false;
  deliveryBarcode: string = "";
  deliveryTypeText: string = "";
  totalSelectedPackagesForPrint: number = 0;
  currentDate: string = "";
  selectedBarcodes: string = "";

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

    this.headers22 = new Headers({ "Content-Type": "application/json" });
    this.headers22.append(
      "Authorization",
      "Bearer " + localStorage.getItem("token_fin")
    );
    this.options2 = new RequestOptions({ headers: this.headers22 });

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;

    this.currentParty = "";
    this.showTheList = false;
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

    this.loadRegions();
  }

  // Original methods (unchanged)
  getListOfPartyBoxes(ownerid) {
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
          '<input id="input-bank-acc" type="text" class="form-control m-2" placeholder="Terminalda (Uzum/PayMe QR) BERDI" />' +
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
          let bankacc = $("#input-bank-acc").val();
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
                "&bank_account=" +
                bankacc +
                "&comment=" +
                izohh,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
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
                    .fire("Not Added", `Xato: ${error.json().message}`, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                }
              }
            );

          //start of xisob post request
          var NewUserId = this.currentID.toString();
          if (usd == "") usd = 0;
          if (cash == "") cash = 0;
          if (cash == "") card = 0;
          if (bankacc == "") card = 0;

          let usd2: number = +usd;
          const cash2: number = +cash;
          const card2: number = +cash;
          const bankacc2: number = +bankacc;

          this.http
            .post(
              "http://185.196.213.248:3018/api/income",
              {
                part_num: partiya,
                userId: NewUserId,
                usd_cash: usd2,
                uzs_cash: cash2,
                card: card2,
                account: bankacc2,
                admin_id: 22,
                comment: izohh,
                category_id: "1",
              },
              this.options2
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

          //end of xisob post request
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
          '<input id="input-bank-acc" type="text" class="form-control m-2" placeholder="Terminalda (Uzum/PayMe QR) BERDI" />' +
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

  // ADD this new method to replace the removed ones:
  openDeliveryCreationDirectly(
    id: string,
    name: string,
    weight: string,
    quantity: string
  ) {
    // Store consignment details for payment receipt
    this.selectedConsignmentId = id;
    this.selectedConsignmentName = name;
    this.selectedConsignmentWeight = weight;
    this.selectedConsignmentQuantity = quantity;

    // Directly open delivery creation modal
    this.loadCustomerPackagesForDelivery();
    $("#deliveryCreationModal").modal("show");
  }

  // ADD this new method for printing payment receipt from modal
  printPaymentReceiptFromModal() {
    if (!this.selectedConsignmentId) {
      swal.fire("Xatolik", "Consignment ma'lumotlari topilmadi", "error");
      return;
    }

    // Collect selected package information
    const selectedGroups = this.customerPackages.filter(
      (group) => group.selected
    );

    if (selectedGroups.length === 0) {
      swal.fire("Xatolik", "Qutillar tanlanmagan", "error");
      return;
    }

    // Calculate totals and gather data
    let totalPackages = 0;
    let totalItems = 0;
    let totalWeight = 0;
    const allBarcodes: string[] = [];
    const allConsignments: Set<string> = new Set();

    selectedGroups.forEach((group) => {
      if (group.type === "tied") {
        // For tied packages
        if (group.selectionType === "partial") {
          // Partial selection - only current consignment packages
          const currentConsignmentPackages = group.packages.filter(
            (pkg) => pkg.consignment === this.selectedConsignmentName
          );

          // Use actual values from each package
          currentConsignmentPackages.forEach((pkg) => {
            totalPackages++;
            totalItems += parseInt(pkg.items_count) || 0;
            totalWeight += parseFloat(pkg.weight) || 0;
            allBarcodes.push(pkg.barcode);
            allConsignments.add(pkg.consignment);
          });
        } else {
          // Full tied group selection - use group totals or iterate through all packages
          if (group.packages && group.packages.length > 0) {
            group.packages.forEach((pkg) => {
              totalPackages++;
              totalItems += parseInt(pkg.items_count) || 0;

              totalWeight += parseFloat(pkg.weight) || 0;
              allBarcodes.push(pkg.barcode);
              allConsignments.add(pkg.consignment);
            });
          } else {
            // Fallback to group totals if packages array is empty
            totalPackages += group.total_packages || 0;
            totalItems += group.total_items || 0;

            // Calculate weight from weights array if available
            if (group.weights && Array.isArray(group.weights)) {
              group.weights.forEach((w) => {
                totalWeight += parseFloat(w) || 0;
              });
            }

            // Add barcodes
            if (
              group.package_barcodes &&
              Array.isArray(group.package_barcodes)
            ) {
              allBarcodes.push(...group.package_barcodes);
            }

            // Add consignments
            if (group.consignments && Array.isArray(group.consignments)) {
              group.consignments.forEach((c) => allConsignments.add(c));
            }
          }
        }
      } else if (group.type === "single") {
        // For single/untied packages
        if (group.packages && group.packages.length > 0) {
          const pkg = group.packages[0];

          totalPackages++;

          totalItems += parseInt(pkg.items_count) || 0;
          totalWeight += parseFloat(pkg.weight) || 0;
          allBarcodes.push(pkg.barcode);
          allConsignments.add(pkg.consignment);
        } else {
          // Fallback to group totals
          totalPackages += group.total_packages || 0;
          totalItems += group.total_items || 0;

          if (group.weights && group.weights.length > 0) {
            totalWeight += parseFloat(group.weights[0]) || 0;
          }

          if (group.package_barcodes && group.package_barcodes.length > 0) {
            allBarcodes.push(group.package_barcodes[0]);
          }

          if (group.consignments && group.consignments.length > 0) {
            allConsignments.add(group.consignments[0]);
          }
        }
      }
    });

    // Determine party name to display
    let partyNameDisplay = "";
    if (allConsignments.size === 1) {
      // Single consignment
      partyNameDisplay = Array.from(allConsignments)[0];
    } else {
      // Multiple consignments - show all with barcodes
      partyNameDisplay = Array.from(allConsignments).join(", ");
    }

    // Call the print function with collected data
    this.printChekYuborish(
      this.selectedConsignmentId,
      partyNameDisplay,
      totalWeight,
      totalItems,
      allBarcodes
    );
  }
  printChekYuborish(ids, name, weight, counter, barcodes: string[] = []) {
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

      // ✅ FIX 1: Allow input focus
      focusConfirm: false,

      // ✅ FIX 2: Don't close on backdrop click
      allowOutsideClick: false,

      // ✅ FIX 3: Don't close on escape key
      allowEscapeKey: true,

      didOpen: () => {
        $("#input-party").val(name);
        $("#input-id").val(this.currentID);
        $("#input-weight").val(weight);
        $("#input-counter").val(counter);

        // ✅ FIX 4: Auto-focus on izoh field for convenience
        setTimeout(() => {
          $("#input-izoh").focus();
        }, 100);
      },
      preConfirm: (result) => {
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

        this.popupWin.document.close();
        this.printCondition3 = false;
      },
    });

    this.printCondition3 = false;
  }

  // printChekYuborish(
  //   ids: string,
  //   name: string,
  //   weight: number,
  //   counter: string
  // ) {
  //   swal.fire({
  //     html:
  //       "<style>" +
  //       ".inline-label {" +
  //       "display: inline-block;" +
  //       "width: auto;" +
  //       "margin-right: 5px;" +
  //       "text-align: right;" +
  //       "vertical-align: right;" +
  //       "}" +
  //       ".inline-input {" +
  //       "display: inline-block;" +
  //       "width: auto;" +
  //       "vertical-align: right;" +
  //       "}" +
  //       "</style>" +
  //       '<div class="form-group">' +
  //       '<label for="input-party" class="inline-label">Partiya:</label> ' +
  //       '<input id="input-party" type="text" class="form-control m-2 inline-input" />' +
  //       '<br><label for="input-id" class="inline-label">ID:</label>' +
  //       '<input id="input-id" type="text" class="form-control m-2 inline-input" />' +
  //       '<br><label for="input-weight" class="inline-label">Og\'irligi:</label>' +
  //       '<input id="input-weight" type="text" class="form-control m-2 inline-input" /> kg' +
  //       '<br><label for="input-counter" class="inline-label">Soni:</label>' +
  //       '<input id="input-counter" type="text" class="form-control m-2 inline-input" /> ta' +
  //       '<br><label for="input-izoh" class="inline-label">Izoh:</label>' +
  //       '<input id="input-izoh" type="text" class="form-control m-2 inline-input" />' +
  //       "</div>",
  //     showCancelButton: true,
  //     confirmButtonText: "Print",
  //     customClass: {
  //       confirmButton: "btn btn-success",
  //       cancelButton: "btn btn-danger",
  //     },
  //     buttonsStyling: false,
  //     didOpen: () => {
  //       $("#input-party").val(name);
  //       $("#input-id").val(this.currentID);
  //       $("#input-weight").val(weight);
  //       $("#input-counter").val(counter);
  //       $("#input-izoh").prop("disabled", false); // ✅ Force enable
  //     },
  //     preConfirm: (result) => {
  //       this.idsChek = $("#input-id").val();
  //       this.nameChek = $("#input-party").val();
  //       this.weightChek = $("#input-weight").val();
  //       this.counterChek = $("#input-counter").val();
  //       this.izohChek = $("#input-izoh").val();

  //       this.printCondition3 = true;
  //       this.changeDetectorRef.detectChanges();

  //       // Update print section to include items and barcodes
  //       const printContent = `
  //       --- ⭐ Yuk Z ⭐ ---
  //       <div>
  //         <span style="font-size: 36px"><strong>K${this.idsChek}</strong></span>
  //       </div>
  //       <div></div>
  //       <div>Partiyasi: ${this.nameChek}</div>
  //       <div style="margin: 2px 2px">
  //         Soni: <strong>${this.counterChek}</strong> ta quti
  //       </div>
  //       <div style="margin: 2px 2px">
  //         Og'irligi: <strong>${this.weightChek}</strong> kg
  //       </div>
  //       <div>
  //         <i>
  //           Izoh: <span>${this.izohChek}</span>
  //         </i>
  //       </div>
  //       <br />
  //     `;

  //       this.popupWin = window.open(
  //         "",
  //         "_blank",
  //         "top=0,left=0,height=100%,width=auto"
  //       );
  //       this.popupWin.document.open();
  //       this.popupWin.document.write(`
  //       <html>
  //         <head>
  //           <title>To'lov Cheki</title>
  //           <style>
  //             body { text-align: center; font-family: monospace; }
  //           </style>
  //         </head>
  //         <body onload="window.print(); window.close();">${printContent}</body>
  //       </html>
  //     `);
  //       this.popupWin.document.close();
  //       this.printCondition3 = false;
  //     },
  //   });
  // }

  // NEW: Show delivery creation modal
  showDeliveryCreation() {
    $("#chekOptionsModal").modal("hide");

    setTimeout(() => {
      this.loadCustomerPackagesForDelivery();
      $("#deliveryCreationModal").modal("show");
    }, 300);
  }

  // NEW: Load customer packages for delivery
  loadCustomerPackagesForDelivery() {
    this.loadingCustomerPackages = true;
    this.customerPackages = [];
    this.selectedPackageIdentifiers = [];

    this.http
      .get(
        GlobalVars.baseUrl + "/deliveries/admin?owner_id=" + this.currentID,
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            this.customerPackages = result.data.package_groups || [];
            // console.log("customer packages ", this.customerPackages);

            this.customerPhone = result.data.phone_number;
            this.customerPackages.forEach((group) => (group.selected = false));
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni yuklashda xatolik",
              "error"
            );
          }
          this.loadingCustomerPackages = false;
        },
        (error) => {
          this.loadingCustomerPackages = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // NEW: Update selected packages
  updateSelectedPackages() {
    this.selectedPackageIdentifiers = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        this.selectedPackageIdentifiers.push(group.identifier);
      }
    });
  }

  // NEW: Get total selected packages
  getTotalSelectedPackages(): number {
    return this.customerPackages
      .filter((group) => group.selected)
      .reduce((total, group) => total + group.total_packages, 0);
  }

  // NEW: Get styling for package rows
  getPackageRowClass(group: PackageGroup): string {
    if (group.consignments.includes(this.selectedConsignmentName)) {
      return group.selected ? "table-primary" : "table-light";
    }
    return group.selected ? "table-warning" : "";
  }

  // NEW: Check if tied groups have multiple consignments including current one
  hasMultipleConsignments(group: PackageGroup): boolean {
    return (
      group.type === "tied" &&
      group.consignments.length > 1 &&
      group.consignments.includes(this.selectedConsignmentName) &&
      !group.selected
    );
  }

  // NEW: Get package count for specific consignment in a group
  getPackageCountForConsignment(
    group: PackageGroup,
    consignmentName: string
  ): number {
    if (group.type === "single") {
      return group.consignments.includes(consignmentName) ? 1 : 0;
    }

    // For tied groups, count packages belonging to the consignment
    return group.packages.filter((pkg) => pkg.consignment === consignmentName)
      .length;
  }

  // NEW: Select full tied group
  selectFullTiedGroup(group: PackageGroup) {
    group.selected = true;
    group.selectionType = "full";
    this.updateSelectedPackages();
  }

  // NEW: Select only packages from current consignment
  selectOnlyCurrentConsignmentPackages(group: PackageGroup) {
    group.selected = true;
    group.selectionType = "partial";
    group.selectedConsignment = this.selectedConsignmentName;
    this.updateSelectedPackages();

    // Show confirmation
    swal.fire({
      icon: "warning",
      title: "Bog'lanish buziladi",
      text: `Faqat ${this.selectedConsignmentName} qutilari tanlanadi. Boshqa qutillar bog'lanishdan chiqariladi va "collected" holatiga o'tkaziladi.`,
      confirmButtonText: "Tushunarli",
      customClass: {
        confirmButton: "btn btn-warning",
      },
      buttonsStyling: false,
    });
  }

  // NEW: Check if tied packages are selected
  hasTiedPackagesSelected(): boolean {
    return this.customerPackages.some(
      (group) => group.selected && group.type === "tied"
    );
  }

  // NEW: Get selected tied groups
  getSelectedTiedGroups(): PackageGroup[] {
    return this.customerPackages.filter(
      (group) => group.selected && group.type === "tied"
    );
  }

  // NEW: Get count from current consignment
  getSelectedFromCurrentConsignment(): number {
    return this.customerPackages
      .filter(
        (group) =>
          group.selected &&
          group.consignments.includes(this.selectedConsignmentName)
      )
      .reduce((total, group) => {
        if (group.selectionType === "partial") {
          return (
            total +
            this.getPackageCountForConsignment(
              group,
              this.selectedConsignmentName
            )
          );
        }
        return total + group.total_packages;
      }, 0);
  }

  // NEW: Get count from other consignments
  getSelectedFromOtherConsignments(): number {
    return (
      this.customerPackages
        .filter(
          (group) =>
            group.selected &&
            !group.consignments.includes(this.selectedConsignmentName)
        )
        .reduce((total, group) => total + group.total_packages, 0) +
      this.customerPackages
        .filter(
          (group) =>
            group.selected &&
            group.selectionType === "partial" &&
            group.consignments.includes(this.selectedConsignmentName)
        )
        .reduce(
          (total, group) =>
            total +
            (group.total_packages -
              this.getPackageCountForConsignment(
                group,
                this.selectedConsignmentName
              )),
          0
        )
    );
  }

  // NEW: Load regions for EMU
  loadRegions() {
    this.http.get(GlobalVars.baseUrl + "/regions/emu", this.options).subscribe(
      (response) => {
        const result = response.json();
        if (result.status === "success") {
          this.regions = result.data.regions || [];
        }
      },
      (error) => {
        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );
  }
  // Add to infoeachclient.component.ts

  clearAllSelections() {
    this.customerPackages.forEach((group) => {
      group.selected = false;
      group.selectionType = undefined;
    });
    this.updateSelectedPackages();
  }

  // NEW: Load branches when region selected
  onRegionSelect(event: any) {
    const regionId = event.target.value;

    // ADD THESE 3 LINES:
    if (this.autoFilledFields.regionId) {
      this.autoFilledFields.regionId = false;
      this.autoFilledFields.branchId = false;
    }
    this.selectedRegionId = regionId ? parseInt(regionId) : null;
    this.selectedBranchId = null;
    this.selectedBranchName = "";
    this.branches = [];

    if (regionId) {
      this.http
        .get(
          GlobalVars.baseUrl + "/branches?region_id=" + regionId,
          this.options
        )
        .subscribe(
          (response) => {
            const result = response.json();
            if (result.status === "success") {
              this.branches = result.data.branches || [];
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

  // NEW: Delivery type change handler
  onDeliveryTypeChange() {
    this.selectedRegionId = null;
    this.selectedBranchId = null;
    this.selectedBranchName = "";
    this.branches = [];
    this.deliveryAddress = "";
    this.courierName = "";
    this.courierPhone = "";
    this.yandexFee = 0;
    this.isEmuDataAutoFilled = false;
    this.lastEmuDeliveryId = "";
    this.autoFilledFields = {
      regionId: false,
      branchId: false,
      phone: false,
    };

    // ADD THIS: Trigger auto-fill for EMU
    if (this.deliveryType === "EMU" && this.currentID) {
      this.getLastEmuDeliveryData(this.currentID);
    }
  }

  // NEW: Validation for delivery creation
  canCreateDelivery(): boolean {
    if (this.selectedPackageIdentifiers.length === 0 || !this.deliveryType) {
      return false;
    }

    if (this.deliveryType === "EMU" && !this.selectedBranchId) {
      return false;
    }

    return true;
  }

  // NEW: Create delivery with enhanced package selection logic
  createDelivery() {
    if (!this.canCreateDelivery()) {
      swal.fire("Xatolik", "Barcha majburiy maydonlarni to'ldiring", "error");
      return;
    }

    this.creatingDelivery = true;

    // Find selected branch name for printing
    if (this.selectedBranchId) {
      const selectedBranch = this.branches.find(
        (b) => b.id == this.selectedBranchId
      );
      this.selectedBranchName = selectedBranch ? selectedBranch.name : "";
    }

    // Prepare package identifiers with selection type info
    const packageIdentifiers = [];

    this.customerPackages.forEach((group) => {
      if (group.selected) {
        if (group.selectionType === "partial") {
          // For partial tied group selection, send specific package barcodes
          const currentConsignmentPackages = group.packages
            .filter((pkg) => pkg.consignment === this.selectedConsignmentName)
            .map((pkg) => pkg.barcode);
          packageIdentifiers.push(...currentConsignmentPackages);
        } else {
          // For full selection, send the group identifier
          packageIdentifiers.push(group.identifier);
        }
      }
    });

    const deliveryData = {
      owner_id: this.currentID,
      delivery_type: this.deliveryType,
      package_identifiers: packageIdentifiers,
      customer_phone: this.customerPhone,
      delivery_address: this.deliveryAddress || null,
      emu_branch_id: this.selectedBranchId || null,
      yandex_fee: this.yandexFee || null,
      courier_name: this.courierName || null,
      courier_phone: this.courierPhone || null,
      delivery_fee: this.deliveryFee || 0,
      notes: this.deliveryNotes || null,
      admin_created_by: localStorage.getItem("username") || null,
      // Add flag to indicate if there are partial tied group selections
      has_partial_tied_selections: this.customerPackages.some(
        (g) => g.selected && g.selectionType === "partial"
      ),
    };

    this.http
      .post(
        GlobalVars.baseUrl + "/deliveries/admin/create",
        JSON.stringify(deliveryData),
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success") {
            // Prepare print data
            this.deliveryBarcode = result.data.delivery_barcode;
            this.deliveryTypeText = this.getDeliveryTypeText(this.deliveryType);
            this.totalSelectedPackagesForPrint =
              this.getTotalSelectedPackages();
            this.currentDate = new Date().toLocaleDateString("uz-UZ");

            // Collect selected barcodes for printing
            const selectedBarcodes = [];
            this.customerPackages.forEach((group) => {
              if (group.selected) {
                if (group.selectionType === "partial") {
                  const currentConsignmentBarcodes = group.packages
                    .filter(
                      (pkg) => pkg.consignment === this.selectedConsignmentName
                    )
                    .map((pkg) => pkg.barcode);
                  selectedBarcodes.push(...currentConsignmentBarcodes);
                } else {
                  selectedBarcodes.push(...group.package_barcodes);
                }
              }
            });
            this.selectedBarcodes = selectedBarcodes.join(", ");

            swal
              .fire({
                icon: "success",
                title: "Muvaffaqiyat!",
                text: "Yetkazish yaratildi va qutillar yuborildi",
                showCancelButton: true,
                confirmButtonText: "Chek Chop Etish",
                cancelButtonText: "Yopish",
                customClass: {
                  confirmButton: "btn btn-success",
                  cancelButton: "btn btn-secondary",
                },
                buttonsStyling: false,
              })
              .then((result) => {
                if (result.isConfirmed) {
                  // Print the delivery receipt when user clicks "Chek Chop Etish"
                  this.printPaymentReceiptFromModal();
                }
                this.closeDeliveryModal();
                // Refresh the consignment data to reflect updated package status
                this.getListOfPartyBoxes(this.currentID);
              });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Yetkazish yaratishda xatolik",
              "error"
            );
          }
          this.creatingDelivery = false;
        },
        (error) => {
          swal.fire("Xatolik", "Yetkazish yaratishda xatolik", "error");
          this.creatingDelivery = false;
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // NEW: Close delivery modal
  closeDeliveryModal() {
    $("#deliveryCreationModal").modal("hide");
    this.resetDeliveryForm();
  }

  // NEW: Reset delivery form
  resetDeliveryForm() {
    this.customerPackages = [];
    this.selectedPackageIdentifiers = [];
    this.deliveryType = "";
    this.customerPhone = "";
    this.deliveryAddress = "";
    this.courierName = "";
    this.courierPhone = "";
    this.deliveryFee = 0;
    this.yandexFee = 0;
    this.deliveryNotes = "";
    this.selectedRegionId = null;
    this.selectedBranchId = null;
    this.selectedBranchName = "";
    this.branches = [];

    // ADD THESE LINES:
    this.isEmuDataAutoFilled = false;
    this.lastEmuDeliveryId = "";
    this.autoFilledFields = {
      regionId: false,
      branchId: false,
      phone: false,
    };
  }

  // NEW: Helper method for delivery type display
  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU",
      Yandex: "Yandex",
      "Own-Courier": "Kuryer",
      "Pick-up": "Olib ketish",
    };
    return types[type] || type;
  }

  // NEW: Fetch last EMU delivery data for customer
  getLastEmuDeliveryData(ownerId: string) {
    this.http
      .get(
        GlobalVars.baseUrl + "/deliveries/last_emu?owner_id=" + ownerId,
        this.options
      )
      .subscribe(
        (response) => {
          const result = response.json();
          if (result.status === "success" && result.data) {
            const lastDelivery = result.data;

            this.lastEmuDeliveryId = lastDelivery.delivery_id || "";

            if (lastDelivery.region_id) {
              this.selectedRegionId = lastDelivery.region_id;
              this.autoFilledFields.regionId = true;

              this.http
                .get(
                  GlobalVars.baseUrl +
                    "/branches?region_id=" +
                    lastDelivery.region_id,
                  this.options
                )
                .subscribe(
                  (branchResponse) => {
                    const branchResult = branchResponse.json();
                    if (branchResult.status === "success") {
                      this.branches = branchResult.data.branches || [];

                      if (lastDelivery.emu_branch_id) {
                        this.selectedBranchId = lastDelivery.emu_branch_id;
                        this.autoFilledFields.branchId = true;

                        const selectedBranch = this.branches.find(
                          (b) => b.id == lastDelivery.emu_branch_id
                        );
                        this.selectedBranchName = selectedBranch
                          ? selectedBranch.name
                          : "";
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

            if (lastDelivery.customer_phone) {
              this.customerPhone = lastDelivery.customer_phone;
              this.autoFilledFields.phone = true;
            }

            this.isEmuDataAutoFilled = true;

            const branchName = lastDelivery.branch_name || "noma'lum filial";
            swal.fire({
              icon: "info",
              title: "Ma'lumot",
              html: `
              <p>Oxirgi EMU yetkazishdan ma'lumotlar avtomatik to'ldirildi:</p>
              <ul style="text-align: left;">
                ${
                  lastDelivery.region_name
                    ? `<li><b>Viloyat:</b> ${lastDelivery.region_name}</li>`
                    : ""
                }
                ${
                  lastDelivery.branch_name
                    ? `<li><b>Filial:</b> ${lastDelivery.branch_name}</li>`
                    : ""
                }
                ${
                  lastDelivery.customer_phone
                    ? `<li><b>Telefon:</b> ${lastDelivery.customer_phone}</li>`
                    : ""
                }
              </ul>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                <i class="material-icons" style="font-size: 14px; vertical-align: middle;">info</i>
                Barcha maydonlarni o'zgartirishingiz mumkin
              </p>
            `,
              timer: 5000,
              timerProgressBar: true,
              showConfirmButton: false,
              toast: true,
              position: "top-end",
            });
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  // NEW: Clear auto-filled data
  clearAutoFilledData() {
    this.selectedRegionId = null;
    this.selectedBranchId = null;
    this.selectedBranchName = "";
    this.customerPhone = "";
    this.branches = [];
    this.isEmuDataAutoFilled = false;
    this.lastEmuDeliveryId = "";
    this.autoFilledFields = {
      regionId: false,
      branchId: false,
      phone: false,
    };

    swal.fire({
      icon: "success",
      title: "Tozalandi",
      text: "Avtomatik to'ldirilgan ma'lumotlar tozalandi",
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }

  // NEW: Track manual changes
  onBranchManualChange() {
    if (this.autoFilledFields.branchId) {
      this.autoFilledFields.branchId = false;
    }
  }

  onPhoneManualChange() {
    if (this.autoFilledFields.phone) {
      this.autoFilledFields.phone = false;
    }
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
}
