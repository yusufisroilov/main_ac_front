import { TableData } from "src/app/md/md-table/md-table.component";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";
import swal from "sweetalert2";
import { HttpClient, HttpHeaders } from "@angular/common/http";
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
  debt_uzs?: number;
  debt_usd?: number;
  has_high_debt?: boolean;
  consignments_with_debt?: string[];
  forDebt?: boolean;
}

@Component({
  selector: "app-infoeachclientv2",
  templateUrl: "./infoeachclientv2.component.html",
  styleUrls: ["./infoeachclientv2.component.css"],
})
export class Infoeachclientv2Component implements OnInit {
  public tableData1: TableData;
  public dataTable: TableData;

  trackingNum: string;
  allData: any;
  allDataBoxes: any;
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

  // Cash accounts for V2 payments
  cashAccounts: any[] = [];

  // Delivery-related properties
  selectedConsignmentId: string = "";
  selectedConsignmentName: string = "";
  selectedConsignmentWeight: string = "";
  selectedConsignmentQuantity: string = "";

  customerPackages: PackageGroup[] = [];
  selectedPackageIdentifiers: string[] = [];
  loadingCustomerPackages: boolean = false;

  deliveryType: string = "";
  customerPhone: string = "";
  deliveryAddress: string = "";
  courierName: string = "";
  courierPhone: string = "";
  deliveryFee: number = 0;
  yandexFee: number = 0;
  deliveryNotes: string = "";

  // Debt tracking
  showDebtWarning: boolean = false;
  packagesWithHighDebt: PackageGroup[] = [];
  debtConsignments: string[] = [];
  totalDebtUzs: number = 0;
  totalDebtUsd: number = 0;

  // Auto-fill tracking
  isEmuDataAutoFilled: boolean = false;
  lastEmuDeliveryId: string = "";
  autoFilledFields = { regionId: false, branchId: false, phone: false };

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
    private httpClient: HttpClient,
    private router: Router,
  ) {
    this.orderTypeText = [];
    this.orderStatusText = [];

    this.currentPage = 0;
    this.needPagination = false;
    this.isPageNumActive = false;

    this.currentParty = "";
    this.showTheList = false;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    });
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
    this.loadCashAccounts();
  }

  // ─── Cash Accounts (V2) ───

  loadCashAccounts() {
    this.httpClient
      .get<any>(GlobalVars.baseUrl + "/finance-v2/cash-accounts?active=true", {
        headers: this.getHeaders(),
      })
      .subscribe(
        (data) => {
          this.cashAccounts = data.accounts || [];
        },
        (error) => {
          console.error("Failed to load cash accounts:", error);
        },
      );
  }

  buildPaymentFieldsHtml(): string {
    let html = '<div class="form-group">';
    for (const acc of this.cashAccounts) {
      html += `<input id="input-acc-${acc.id}" type="number" class="form-control m-2" placeholder="${acc.name} (${acc.currency})" />`;
    }
    html +=
      '<input id="input-izoh" type="text" class="form-control m-2" placeholder="IZOH" />';
    html += "</div>";
    return html;
  }

  getPaymentMethod(type: string, currency: string): string {
    if (type === "CASH" && currency === "USD") return "USD_CASH";
    if (type === "CASH" && currency === "UZS") return "UZS_CASH";
    if (type === "CARD") return "PLASTIC";
    if (type === "BANK") return "BANK";
    return "UZS_CASH";
  }

  buildPaymentsFromDialog(): any[] {
    const payments = [];
    for (const acc of this.cashAccounts) {
      const el = document.getElementById(
        `input-acc-${acc.id}`,
      ) as HTMLInputElement;
      const val = parseFloat(el?.value) || 0;
      if (val > 0) {
        payments.push({
          method: this.getPaymentMethod(acc.type, acc.currency),
          currency: acc.currency,
          amount_original: val,
          cash_account_id: acc.id,
        });
      }
    }
    return payments;
  }

  // ─── Customer Consignment List ───

  getListOfPartyBoxes(ownerid) {
    this.httpClient
      .get<any>(
        GlobalVars.baseUrl + "/consignments/for_client_v2?id=" + ownerid,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (data) => {
          this.allDataBoxes = (data.consignments || []).filter(
            (r) => r.quantity !== 0,
          );
          this.umQarzUSZ = data.debt_uzs_total;
          this.umQarzUSD = data.debt_usd_total;
          this.currentID = data.user_id;
        },
        (error) => {
          swal.fire(
            "Xatolik",
            `BAD REQUEST: ${error.error?.error || error.message}`,
            "error",
          );
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  // ─── Orders List ───

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
    if (this.showTheList == false) return false;
    this.currentParty = partyNum;
  }

  getListOfParcels(partyNum) {
    this.currentParty = partyNum;

    this.httpClient
      .get<any>(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=150&ownerID=" +
          this.currentID +
          "&consignment=" +
          partyNum,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (data) => {
          this.allData = data.orders;
          this.showTheList = true;

          for (let index = 0; index < this.allData.length; index++) {
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              this.allData[index].order_type,
              "uz",
            );
          }

          for (let index = 0; index < this.allData.length; index++) {
            this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
              this.allData[index].status,
              "uz",
            );
          }

          this.currentPage = data.currentPage;
          this.totalPages = data.totalPages;
          if (this.totalPages > 1) {
            this.needPagination = true;
            for (let i = 0; i < this.totalPages; i++) {
              this.mypages[i] = { id: "name" };
            }
          }
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  getListOfParcelsWithSearch(searchkey) {
    if (searchkey == "") {
      this.currentPage = 0;
      this.getListOfParcels(this.currentParty);
    } else {
      this.httpClient
        .get<any>(
          GlobalVars.baseUrl +
            "/orders/list?page=" +
            this.currentPage +
            "&size=50&ownerID=" +
            this.currentID +
            "&consignment=" +
            this.currentParty +
            "&trackingNumber=" +
            searchkey,
          { headers: this.getHeaders() },
        )
        .subscribe(
          (data) => {
            this.allData = data.orders;

            for (let index = 0; index < this.allData.length; index++) {
              this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
                this.allData[index].order_type,
                "uz",
              );
            }

            for (let index = 0; index < this.allData.length; index++) {
              this.orderStatusText[index] =
                GlobalVars.getDesOrderStatusWithID(
                  this.allData[index].status,
                  "uz",
                );
            }

            this.currentPage = data.currentPage;
            this.totalPages = data.totalPages;
            if (this.totalPages > 1) {
              this.needPagination = true;
              for (let i = 0; i < this.totalPages; i++) {
                this.mypages[i] = { id: "name" };
              }
            }
          },
          (error) => {
            if (error.status === 403) this.authService.logout();
          },
        );
    }
  }

  getInfoOfParcel(me) {
    this.trackingNum2 = me;
  }

  // ─── V2 Payment ───

  addFinance(finId, partiya) {
    swal
      .fire({
        title: "Xisob Qo'shish!",
        html: this.buildPaymentFieldsHtml(),
        showCancelButton: true,
        confirmButtonText: "BERDI",
        cancelButtonText: "Bekor",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const payments = this.buildPaymentsFromDialog();
          const izoh = ($("#input-izoh").val() as string) || "";

          if (payments.length === 0) return;

          this.httpClient
            .post<any>(
              GlobalVars.baseUrl + "/finance-v2/pay",
              { finance_id: finId, payments, comment: izoh },
              { headers: this.getHeaders() },
            )
            .subscribe(
              (data) => {
                if (data.status === "error") {
                  swal.fire(
                    "Qo'shilmadi",
                    data.message || data.error,
                    "error",
                  );
                } else {
                  this.getListOfPartyBoxes(this.currentID);
                }
              },
              (error) => {
                if (error.status === 400) {
                  swal.fire(
                    "Qo'shilmadi",
                    `Xato: ${error.error?.message || error.message}`,
                    "error",
                  );
                }
              },
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: "MUVAFFAQIYATLI!",
            customClass: { confirmButton: "btn btn-success" },
            buttonsStyling: false,
          });
        }
      });
  }

  // ─── Navigate to Ledger ───

  goToLedger() {
    if (!this.currentID) return;
    this.router.navigate(["/uzm/transactions"], {
      queryParams: { customer_id: this.currentID },
    });
  }

  // ─── Delivery ───

  openDeliveryCreationDirectly(
    id: string,
    name: string,
    weight: string,
    quantity: string,
  ) {
    this.selectedConsignmentId = id;
    this.selectedConsignmentName = name;
    this.selectedConsignmentWeight = weight;
    this.selectedConsignmentQuantity = quantity;

    this.loadCustomerPackagesForDelivery();
    $("#deliveryCreationModal").modal("show");
  }

  printPaymentReceiptFromModal() {
    if (!this.selectedConsignmentId) {
      swal.fire("Xatolik", "Consignment ma'lumotlari topilmadi", "error");
      return;
    }

    const selectedGroups = this.customerPackages.filter((g) => g.selected);

    if (selectedGroups.length === 0) {
      swal.fire("Xatolik", "Qutillar tanlanmagan", "error");
      return;
    }

    let totalPackages = 0;
    let totalItems = 0;
    let totalWeight = 0;
    const allBarcodes: string[] = [];
    const allConsignments: Set<string> = new Set();

    selectedGroups.forEach((group) => {
      if (group.type === "tied") {
        if (group.selectionType === "partial") {
          const currentConsignmentPackages = group.packages.filter(
            (pkg) => pkg.consignment === this.selectedConsignmentName,
          );
          currentConsignmentPackages.forEach((pkg) => {
            totalPackages++;
            totalItems += parseInt(pkg.items_count) || 0;
            totalWeight += parseFloat(pkg.weight) || 0;
            allBarcodes.push(pkg.barcode);
            allConsignments.add(pkg.consignment);
          });
        } else {
          if (group.packages && group.packages.length > 0) {
            group.packages.forEach((pkg) => {
              totalPackages++;
              totalItems += parseInt(pkg.items_count) || 0;
              totalWeight += parseFloat(pkg.weight) || 0;
              allBarcodes.push(pkg.barcode);
              allConsignments.add(pkg.consignment);
            });
          } else {
            totalPackages += group.total_packages || 0;
            totalItems += group.total_items || 0;
            if (group.weights && Array.isArray(group.weights)) {
              group.weights.forEach((w) => {
                totalWeight += parseFloat(w) || 0;
              });
            }
            if (group.package_barcodes && Array.isArray(group.package_barcodes)) {
              allBarcodes.push(...group.package_barcodes);
            }
            if (group.consignments && Array.isArray(group.consignments)) {
              group.consignments.forEach((c) => allConsignments.add(c));
            }
          }
        }
      } else if (group.type === "single") {
        if (group.packages && group.packages.length > 0) {
          const pkg = group.packages[0];
          totalPackages++;
          totalItems += parseInt(pkg.items_count) || 0;
          totalWeight += parseFloat(pkg.weight) || 0;
          allBarcodes.push(pkg.barcode);
          allConsignments.add(pkg.consignment);
        } else {
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

    let partyNameDisplay = "";
    if (allConsignments.size === 1) {
      partyNameDisplay = Array.from(allConsignments)[0];
    } else {
      partyNameDisplay = Array.from(allConsignments).join(", ");
    }

    this.printChekYuborish(
      this.selectedConsignmentId,
      partyNameDisplay,
      totalWeight.toFixed(2),
      totalItems,
      allBarcodes,
    );
  }

  printChekYuborish(ids, name, weight, counter, barcodes: string[] = []) {
    this.idsChek = this.currentID;
    this.nameChek = name;
    this.weightChek = weight;
    this.counterChek = counter;
    this.izohChek = this.deliveryNotes;

    this.printCondition3 = true;
    this.changeDetectorRef.detectChanges();

    this.printContents = document.getElementById("print-section3-v2").innerHTML;
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
          <style>body { text-align: center; }</style>
        </head>
        <body onload="window.print(); window.close();"> ${this.printContents}</body>
      </html>`);
    this.popupWin.document.close();
    this.printCondition3 = false;
  }

  showDeliveryCreation() {
    $("#chekOptionsModal").modal("hide");
    setTimeout(() => {
      this.loadCustomerPackagesForDelivery();
      $("#deliveryCreationModal").modal("show");
    }, 300);
  }

  loadCustomerPackagesForDelivery() {
    this.loadingCustomerPackages = true;
    this.customerPackages = [];
    this.selectedPackageIdentifiers = [];
    this.showDebtWarning = false;
    this.packagesWithHighDebt = [];
    this.debtConsignments = [];
    this.totalDebtUzs = 0;
    this.totalDebtUsd = 0;

    this.httpClient
      .get<any>(
        GlobalVars.baseUrl + "/deliveries/admin?owner_id=" + this.currentID,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (result) => {
          if (result.status === "success") {
            this.customerPackages = result.data.package_groups || [];
            this.customerPhone = result.data.phone_number;

            this.checkForHighDebt();
            this.customerPackages.forEach((group) => (group.selected = true));
            this.updateSelectedPackages();
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Qutillarni yuklashda xatolik",
              "error",
            );
          }
          this.loadingCustomerPackages = false;
        },
        (error) => {
          this.loadingCustomerPackages = false;
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  checkForHighDebt() {
    this.packagesWithHighDebt = [];
    this.debtConsignments = [];
    this.totalDebtUzs = 0;
    this.totalDebtUsd = 0;

    this.customerPackages.forEach((group) => {
      if (group.has_high_debt) {
        this.packagesWithHighDebt.push(group);
        if (
          group.consignments_with_debt &&
          group.consignments_with_debt.length > 0
        ) {
          group.consignments_with_debt.forEach((consignment) => {
            if (!this.debtConsignments.includes(consignment)) {
              this.debtConsignments.push(consignment);
            }
          });
        }
      }
      this.totalDebtUzs += group.debt_uzs || 0;
      this.totalDebtUsd += group.debt_usd || 0;
    });

    this.showDebtWarning = this.packagesWithHighDebt.length > 0;
  }

  updateSelectedPackages() {
    this.selectedPackageIdentifiers = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        this.selectedPackageIdentifiers.push(group.identifier);
      }
    });
  }

  selectDeliveryType(type: string) {
    this.deliveryType = type;

    if (type === "EMU" && this.currentID) {
      this.getLastEmuDeliveryData(this.currentID);
    }

    if (type !== "EMU") {
      this.selectedRegionId = null;
      this.selectedBranchId = null;
      this.selectedBranchName = "";
      this.branches = [];
    }
    if (type !== "Yandex" && type !== "Own-Courier") {
      this.deliveryAddress = "";
      this.courierName = "";
    }
  }

  areAllPackagesSelected(): boolean {
    if (this.customerPackages.length === 0) return false;
    return this.customerPackages.every((group) => group.selected);
  }

  toggleAllPackages(checked: boolean) {
    this.customerPackages.forEach((group) => {
      group.selected = checked;
      if (!checked) {
        group.selectionType = undefined;
        group.selectedConsignment = undefined;
      }
    });
    this.updateSelectedPackages();
  }

  onPackageSelectionChange(group: PackageGroup) {
    if (!group.selected) {
      group.selectionType = undefined;
      group.selectedConsignment = undefined;
    }
    this.updateSelectedPackages();
  }

  getTotalSelectedPackages(): number {
    return this.customerPackages
      .filter((group) => group.selected)
      .reduce((total, group) => total + group.total_packages, 0);
  }

  hasMultipleConsignments(group: PackageGroup): boolean {
    return (
      group.type === "tied" &&
      group.consignments.length > 1 &&
      group.consignments.includes(this.selectedConsignmentName) &&
      !group.selected
    );
  }

  getPackageCountForConsignment(
    group: PackageGroup,
    consignmentName: string,
  ): number {
    if (group.type === "single") {
      return group.consignments.includes(consignmentName) ? 1 : 0;
    }
    return group.packages.filter((pkg) => pkg.consignment === consignmentName)
      .length;
  }

  selectFullTiedGroup(group: PackageGroup) {
    group.selected = true;
    group.selectionType = "full";
    this.updateSelectedPackages();
  }

  selectOnlyCurrentConsignmentPackages(group: PackageGroup) {
    group.selected = true;
    group.selectionType = "partial";
    group.selectedConsignment = this.selectedConsignmentName;
    this.updateSelectedPackages();

    swal.fire({
      icon: "warning",
      title: "Bog'lanish buziladi",
      text: `Faqat ${this.selectedConsignmentName} qutilari tanlanadi. Boshqa qutillar bog'lanishdan chiqariladi va "collected" holatiga o'tkaziladi.`,
      confirmButtonText: "Tushunarli",
      customClass: { confirmButton: "btn btn-warning" },
      buttonsStyling: false,
    });
  }

  hasTiedPackagesSelected(): boolean {
    return this.customerPackages.some(
      (group) => group.selected && group.type === "tied",
    );
  }

  clearAllSelections() {
    this.customerPackages.forEach((group) => {
      group.selected = false;
      group.selectionType = undefined;
    });
    this.updateSelectedPackages();
  }

  canCreateDelivery(): boolean {
    if (this.selectedPackageIdentifiers.length === 0 || !this.deliveryType) {
      return false;
    }
    const hasUnbypassedDebt = this.customerPackages.some(
      (g) => g.selected && g.debt_uzs > 3000 && !g.forDebt,
    );
    if (hasUnbypassedDebt) return false;
    return true;
  }

  createDelivery() {
    if (!this.canCreateDelivery()) {
      swal.fire("Xatolik", "Barcha majburiy maydonlarni to'ldiring", "error");
      return;
    }

    this.creatingDelivery = true;

    if (this.selectedBranchId) {
      const selectedBranch = this.branches.find(
        (b) => b.id == this.selectedBranchId,
      );
      this.selectedBranchName = selectedBranch ? selectedBranch.name : "";
    }

    const packageIdentifiers = [];
    this.customerPackages.forEach((group) => {
      if (group.selected) {
        if (group.selectionType === "partial") {
          const currentConsignmentBarcodes = group.packages
            .filter((pkg) => pkg.consignment === this.selectedConsignmentName)
            .map((pkg) => pkg.barcode);
          packageIdentifiers.push(...currentConsignmentBarcodes);
        } else {
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
    };

    this.httpClient
      .post<any>(
        GlobalVars.baseUrl + "/deliveries/admin/create",
        deliveryData,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (result) => {
          if (result.status === "success") {
            this.deliveryBarcode = result.data.delivery_barcode;
            this.deliveryTypeText = this.getDeliveryTypeText(this.deliveryType);
            this.totalSelectedPackagesForPrint =
              this.getTotalSelectedPackages();
            this.currentDate = new Date().toLocaleDateString("uz-UZ");

            const selectedBarcodes = [];
            let totalItems = 0;
            let totalWeight = 0;
            const consignmentNames = new Set<string>();

            this.customerPackages.forEach((group) => {
              if (group.selected) {
                if (group.selectionType === "partial") {
                  const barcodes = group.packages
                    .filter(
                      (pkg) =>
                        pkg.consignment === this.selectedConsignmentName,
                    )
                    .map((pkg) => pkg.barcode);
                  selectedBarcodes.push(...barcodes);
                  group.packages
                    .filter(
                      (pkg) =>
                        pkg.consignment === this.selectedConsignmentName,
                    )
                    .forEach((pkg) => {
                      totalItems += parseInt(pkg.items_count) || 0;
                      totalWeight += parseFloat(pkg.weight) || 0;
                      consignmentNames.add(pkg.consignment);
                    });
                } else {
                  selectedBarcodes.push(...group.package_barcodes);
                  totalItems += group.total_items || 0;
                  if (group.packages && group.packages.length > 0) {
                    group.packages.forEach((pkg) => {
                      totalWeight += parseFloat(pkg.weight) || 0;
                    });
                  }
                  group.consignments.forEach((c) => consignmentNames.add(c));
                }
              }
            });

            this.selectedBarcodes = selectedBarcodes.join(", ");
            const consignmentNameDisplay =
              Array.from(consignmentNames).join(", ");

            this.printChekYuborish(
              this.currentID,
              consignmentNameDisplay,
              totalWeight.toFixed(2),
              totalItems,
              selectedBarcodes,
            );

            // Collect nasiya groups BEFORE closing modal
            const nasiyaGroups = this.customerPackages.filter(
              (g) => g.selected && g.forDebt && g.debt_uzs > 0,
            );

            this.closeDeliveryModal();
            this.getListOfPartyBoxes(this.currentID);

            if (nasiyaGroups.length > 0) {
              this.processNasiyaPayments(nasiyaGroups);
            }

            swal.fire({
              icon: "success",
              title: "Muvaffaqiyat!",
              text:
                nasiyaGroups.length > 0
                  ? "Yetkazish muvaffaqiyatli yaratildi. Nasiya to'lovlari qayd etildi."
                  : "Yetkazish muvaffaqiyatli yaratildi",
            });
          } else {
            swal.fire(
              "Xatolik",
              result.message || "Yetkazish yaratishda xatolik",
              "error",
            );
          }
          this.creatingDelivery = false;
        },
        (error) => {
          swal.fire("Xatolik", "Yetkazish yaratishda xatolik", "error");
          this.creatingDelivery = false;
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  // V2 nasiya: record via /finance-v2/deliver (debt remains on ledger)
  processNasiyaPayments(nasiyaGroups: PackageGroup[]) {
    const processedConsignments = new Set<string>();

    nasiyaGroups.forEach((group) => {
      const debtConsignments =
        group.consignments_with_debt && group.consignments_with_debt.length > 0
          ? group.consignments_with_debt
          : group.consignments;

      debtConsignments.forEach((consignmentName) => {
        if (processedConsignments.has(consignmentName)) return;
        processedConsignments.add(consignmentName);

        const consignmentRow = this.allDataBoxes?.find(
          (r) => r.name == consignmentName,
        );

        if (consignmentRow) {
          // V2: mark as delivered via /finance-v2/deliver, debt stays on ledger
          this.httpClient
            .post<any>(
              GlobalVars.baseUrl + "/finance-v2/deliver",
              { finance_id: consignmentRow.id },
              { headers: this.getHeaders() },
            )
            .subscribe(
              () => {
                this.getListOfPartyBoxes(this.currentID);
              },
              (error) => {
                console.error(
                  "Error recording nasiya for " + consignmentName,
                  error,
                );
                swal.fire(
                  "Xatolik",
                  consignmentName +
                    " uchun nasiya qayd etishda xatolik yuz berdi",
                  "error",
                );
              },
            );
        }
      });
    });
  }

  closeDeliveryModal() {
    $("#deliveryCreationModal").modal("hide");
    this.resetDeliveryForm();
  }

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

    this.showDebtWarning = false;
    this.packagesWithHighDebt = [];
    this.debtConsignments = [];
    this.totalDebtUzs = 0;
    this.totalDebtUsd = 0;

    this.isEmuDataAutoFilled = false;
    this.lastEmuDeliveryId = "";
    this.autoFilledFields = { regionId: false, branchId: false, phone: false };
  }

  getDeliveryTypeText(type: string): string {
    const types = {
      EMU: "EMU",
      Yandex: "Yandex",
      "Own-Courier": "Kuryer",
      "Pick-up": "Olib ketish",
    };
    return types[type] || type;
  }

  // ─── EMU ───

  loadRegions() {
    this.httpClient
      .get<any>(GlobalVars.baseUrl + "/regions/emu", {
        headers: this.getHeaders(),
      })
      .subscribe(
        (result) => {
          if (result.status === "success") {
            this.regions = result.data.regions || [];
          }
        },
        (error) => {
          if (error.status === 403) this.authService.logout();
        },
      );
  }

  onRegionSelect(event: any) {
    const regionId = event.target.value;

    if (this.autoFilledFields.regionId) {
      this.autoFilledFields.regionId = false;
    }
    this.selectedRegionId = regionId ? parseInt(regionId) : null;
    this.selectedBranchId = null;
    this.selectedBranchName = "";
    this.branches = [];

    if (regionId) {
      this.httpClient
        .get<any>(
          GlobalVars.baseUrl + "/branches?region_id=" + regionId,
          { headers: this.getHeaders() },
        )
        .subscribe(
          (result) => {
            if (result.status === "success") {
              this.branches = result.data.branches || [];
            }
          },
          (error) => {
            if (error.status === 403) this.authService.logout();
          },
        );
    }
  }

  getLastEmuDeliveryData(ownerId: string) {
    this.httpClient
      .get<any>(
        GlobalVars.baseUrl + "/deliveries/last_emu?owner_id=" + ownerId,
        { headers: this.getHeaders() },
      )
      .subscribe(
        (result) => {
          if (result.status === "success" && result.data) {
            const lastDelivery = result.data;
            this.lastEmuDeliveryId = lastDelivery.delivery_id || "";

            if (lastDelivery.region_id) {
              this.selectedRegionId = lastDelivery.region_id;
              this.autoFilledFields.regionId = true;

              this.httpClient
                .get<any>(
                  GlobalVars.baseUrl +
                    "/branches?region_id=" +
                    lastDelivery.region_id,
                  { headers: this.getHeaders() },
                )
                .subscribe(
                  (branchResult) => {
                    if (branchResult.status === "success") {
                      this.branches = branchResult.data.branches || [];
                      if (lastDelivery.emu_branch_id) {
                        this.selectedBranchId = lastDelivery.emu_branch_id;
                        this.autoFilledFields.branchId = true;
                        const selectedBranch = this.branches.find(
                          (b) => b.id == lastDelivery.emu_branch_id,
                        );
                        this.selectedBranchName = selectedBranch
                          ? selectedBranch.name
                          : "";
                      }
                    }
                  },
                  (error) => {
                    if (error.status === 403) this.authService.logout();
                  },
                );
            }

            if (lastDelivery.customer_phone) {
              this.customerPhone = lastDelivery.customer_phone;
              this.autoFilledFields.phone = true;
            }

            this.isEmuDataAutoFilled = true;

            swal.fire({
              icon: "info",
              title: "Ma'lumot",
              html: `
                <p>Oxirgi EMU yetkazishdan ma'lumotlar avtomatik to'ldirildi:</p>
                <ul style="text-align: left;">
                  ${lastDelivery.region_name ? `<li><b>Viloyat:</b> ${lastDelivery.region_name}</li>` : ""}
                  ${lastDelivery.branch_name ? `<li><b>Filial:</b> ${lastDelivery.branch_name}</li>` : ""}
                  ${lastDelivery.customer_phone ? `<li><b>Telefon:</b> ${lastDelivery.customer_phone}</li>` : ""}
                </ul>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
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
          if (error.status === 403) this.authService.logout();
        },
      );
  }

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
}
