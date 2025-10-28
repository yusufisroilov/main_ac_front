import { AfterViewInit, Component, OnInit } from "@angular/core";
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
  selector: "app-archive-orders",
  templateUrl: "./archive-orders.component.html",
  styleUrls: ["./archive-orders.component.css"],
})
export class ArchiveOrdersComponent implements OnInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  helloText: string;
  registredMessage: any;

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

  constructor(
    public authService: AuthService,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.orderTypeText = [];
    this.orderStatusText = [];

    this.orderTypesList = GlobalVars.orderTypes;
    this.orderStatusTypeList = GlobalVars.orderStatus;
    if (this.orderStatusTypeList == null) {
      this.router.navigate(["/dashboard"]);
    }

    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;
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
    this.getListOfParcels();
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    this.getListOfParcels();
  }

  getListOfParcels() {
    let ownerid = localStorage.getItem("id");

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=50" +
          "&ownerID=" +
          ownerid +
          "&status=9",
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;
          // console.log("orders list archive ", this.allData);

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

  getListOfParcelsWithFilter(status, type, ownerid) {
    ownerid = localStorage.getItem("id");

    let filterLink =
      "&status=" + status + "&orderType=" + type + "&ownerID=" + ownerid;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/list?page=" +
          this.currentPage +
          "&size=50" +
          filterLink,
        this.options
      )
      .subscribe(
        (response) => {
          this.allData = response.json().orders;

          for (let index = 0; index < this.allData.length; index++) {
            const element = this.allData[index];
            this.orderTypeText[index] = GlobalVars.getDescriptionWithID(
              element.orderType,
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
    if (searchkey == "") {
      this.currentPage = 0;
      this.getListOfParcels();
    } else {
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
                element.orderType,
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

  ngAfterViewInit() {
    return this.getListOfParcels();
  }
}
