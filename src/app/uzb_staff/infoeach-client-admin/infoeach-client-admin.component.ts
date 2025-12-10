import { TableData } from "src/app/md/md-table/md-table.component";
import { Component, OnInit } from "@angular/core";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";
import { Http, RequestOptions, Headers } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-infoeach-client-admin",
  templateUrl: "./infoeach-client-admin.component.html",
  styleUrls: ["./infoeach-client-admin.component.css"],
})
export class InfoeachClientAdminComponent implements OnInit {
  public tableData1: TableData;
  public dataTable: TableData;

  // Core viewing properties
  headers12: any;
  options: any;
  allData: any;
  allDataBoxes: any;
  currentID: any;
  showTheList: any;
  trackingNum2: any;

  // Pagination
  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];

  // Order type and status text
  orderTypeText: string[];
  orderStatusText: string[];
  currentParty: string;

  constructor(
    public authService: AuthService,
    private http: Http
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

  // Get list of consignments (view-only)
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

  // Pagination
  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.getListOfParcels(this.currentParty);
  }

  // Toggle list visibility
  openListOfPartLog() {
    this.showTheList = !this.showTheList;
  }

  // Get list of parcels for a party
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

  // Search parcels by tracking number
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

  // View parcel info in modal
  getInfoOfParcel(me) {
    this.trackingNum2 = me;
  }
}
