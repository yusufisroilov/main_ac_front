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
          currentConsignmentPackages.forEach((pkg) => {
            totalPackages++;
            totalItems += pkg.items_count || 0;
            totalWeight += parseFloat(pkg.weight) || 0;
            allBarcodes.push(pkg.barcode);
            allConsignments.add(pkg.consignment);
          });
        } else {
          // Full tied group selection
          group.packages.forEach((pkg) => {
            totalPackages++;
            totalItems += pkg.items_count || 0;
            totalWeight += parseFloat(pkg.weight) || 0;
            allBarcodes.push(pkg.barcode);
            allConsignments.add(pkg.consignment);
          });
        }
      } else if (group.type === "single") {
        // For single/untied packages - each group represents one package
        const pkg = group.packages[0]; // Single packages have only one package in the group
        totalPackages++;
        totalItems += pkg.items_count || 0;
        totalWeight += parseFloat(pkg.weight) || 0;
        allBarcodes.push(pkg.barcode);
        allConsignments.add(pkg.consignment);
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
      totalPackages.toString(),
      allBarcodes,
      totalItems
    );
  }
  printChekYuborish(
    ids,
    name,
    weight,
    counter,
    barcodes: string[] = [],
    totalItems: number = 0
  ) {
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
          swal.fire("Xatolik", "Qutillarni yuklashda xatolik", "error");
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

    // this.http
    //   .post(
    //     GlobalVars.baseUrl + "/deliveries/admin/create",
    //     JSON.stringify(deliveryData),
    //     this.options
    //   )
    //   .subscribe(
    //     (response) => {
    //       const result = response.json();
    //       if (result.status === "success") {
    //         // Prepare print data
    //         this.deliveryBarcode = result.data.delivery_barcode;
    //         this.deliveryTypeText = this.getDeliveryTypeText(this.deliveryType);
    //         this.totalSelectedPackagesForPrint =
    //           this.getTotalSelectedPackages();
    //         this.currentDate = new Date().toLocaleDateString("uz-UZ");

    //         // Collect selected barcodes for printing
    //         const selectedBarcodes = [];
    //         this.customerPackages.forEach((group) => {
    //           if (group.selected) {
    //             if (group.selectionType === "partial") {
    //               const currentConsignmentBarcodes = group.packages
    //                 .filter(
    //                   (pkg) => pkg.consignment === this.selectedConsignmentName
    //                 )
    //                 .map((pkg) => pkg.barcode);
    //               selectedBarcodes.push(...currentConsignmentBarcodes);
    //             } else {
    //               selectedBarcodes.push(...group.package_barcodes);
    //             }
    //           }
    //         });
    //         this.selectedBarcodes = selectedBarcodes.join(", ");

    //         swal
    //           .fire({
    //             icon: "success",
    //             title: "Muvaffaqiyat!",
    //             text: "Yetkazish yaratildi va qutillar yuborildi",
    //             showCancelButton: true,
    //             confirmButtonText: "Chek Chop Etish",
    //             cancelButtonText: "Yopish",
    //             customClass: {
    //               confirmButton: "btn btn-success",
    //               cancelButton: "btn btn-secondary",
    //             },
    //             buttonsStyling: false,
    //           })
    //           .then((result) => {
    //             this.closeDeliveryModal();
    //             // Refresh the consignment data to reflect updated package status
    //             this.getListOfPartyBoxes(this.currentID);
    //           });
    //       } else {
    //         swal.fire(
    //           "Xatolik",
    //           result.message || "Yetkazish yaratishda xatolik",
    //           "error"
    //         );
    //       }
    //       this.creatingDelivery = false;
    //     },
    //     (error) => {
    //       swal.fire("Xatolik", "Yetkazish yaratishda xatolik", "error");
    //       this.creatingDelivery = false;
    //       if (error.status == 403) {
    //         this.authService.logout();
    //       }
    //     }
    //   );
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
