import { TableData } from "src/app/md/md-table/md-table.component";
import { Component, OnInit } from "@angular/core";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-infoeach-client-admin2",
  templateUrl: "./infoeach-client-admin2.component.html",
  styleUrls: ["./infoeach-client-admin2.component.css"],
})
export class InfoeachClientAdmin2Component implements OnInit {
  public tableData1: TableData;
  public dataTable: TableData;

  headers12: any;
  options: any;
  allData: any;
  allDataBoxes: any;
  currentID: any;
  showTheList: any;
  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];

  orderTypeText: string[];
  orderStatusText: string[];
  currentParty: string;

  constructor(
    public authService: AuthService,
    private http: Http,
  ) {
    this.orderTypeText = [];
    this.orderStatusText = [];

    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    this.currentPage = 0;
    this.needPagination = false;
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
  }

  // Get list of consignments (V2 only)
  getListOfPartyBoxes(ownerid) {
    return this.http
      .get(
        GlobalVars.baseUrl + "/consignments/for_client_v2?id=" + ownerid,
        this.options,
      )
      .subscribe(
        (response) => {
          this.allDataBoxes = (response.json().consignments || []).filter(
            (r) => r.quantity !== 0,
          );
          this.currentID = response.json().user_id;
        },
        (error) => {
          swal.fire("Xatolik", `BAD REQUEST: ${error.json().error}. `, "error");
          if (error.status == 403) {
            this.authService.logout();
          }
        },
      );
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.getListOfParcels(this.currentParty);
  }

  openListOfPartLog() {
    this.showTheList = !this.showTheList;
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
        this.options,
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;
          this.showTheList = true;

          for (let index = 0; index < this.allData.length; index++) {
            const element = this.allData[index];
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              element.order_type,
              "uz",
            );
          }

          for (let index = 0; index < this.allData.length; index++) {
            const element1 = this.allData[index];
            this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
              element1.status,
              "uz",
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
        },
      );
  }

  getListOfParcelsWithSearch(searchkey) {
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
          this.options,
        )
        .subscribe(
          (response) => {
            this.allData = response.json().orders;

            for (let index = 0; index < this.allData.length; index++) {
              const element = this.allData[index];
              this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
                element.order_type,
                "uz",
              );
            }

            for (let index = 0; index < this.allData.length; index++) {
              const element1 = this.allData[index];
              this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(
                element1.status,
                "uz",
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
          },
        );
    }
  }

  getInfoOfParcel(me) {
    this.trackingNum2 = me;
  }

  // ── Status helpers ──

  getConsignmentStatusText(status: number): string {
    return { 1: "Kelmagan", 2: "Xitoy omborida", 4: "Xitoy aeroportida", 5: "O'zbekiston aeroportida", 6: "Bojxonada", 7: "Toshkent omborida" }[status] || "Nomalum";
  }

  getConsignmentStatusClass(status: number): string {
    return { 1: "badge-warning", 2: "badge-info", 4: "badge-primary", 5: "badge-info", 6: "badge-success", 7: "badge-success" }[status] || "badge-secondary";
  }

  // ── Delivery helpers ──

  getDeliveryBadgeClass(type: string): string {
    return { "EMU": "badge-info", "Yandex": "badge-warning", "Own-Courier": "badge-primary", "Pick-up": "badge-success" }[type] || "badge-secondary";
  }

  getDeliveryIcon(type: string): string {
    return { "EMU": "local_shipping", "Yandex": "delivery_dining", "Own-Courier": "two_wheeler", "Pick-up": "store" }[type] || "local_shipping";
  }

  getDeliveryTypeLabel(type: string): string {
    return { "EMU": "EMU", "Yandex": "Yandex", "Own-Courier": "Kuryer", "Pick-up": "Mijoz o'zi" }[type] || type;
  }

  getDeliveryStatusLabel(status: string): string {
    return { "created": "Yaratilgan", "sent": "Yuborilgan", "collected": "Olingan", "delivered": "Yetkazilgan", "returned": "Qaytarilgan", "cancelled": "Bekor" }[status] || status;
  }
}
