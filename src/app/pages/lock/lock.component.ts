import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { GlobalVars } from "src/app/global-vars";
import swal from "sweetalert2";

declare const $: any;

@Component({
  selector: "app-lock-cmp",
  templateUrl: "./lock.component.html",
  styleUrls: ["./lock.component.css"],
})
export class LockComponent implements OnInit, OnDestroy {
  // Form data
  trackingNum: string = "";

  // Loading states
  isLoading: boolean = false;
  showResults: boolean = false;
  showError: boolean = false;

  // Response data
  orderStatusDescriptionRU: string;
  orderStatusDescriptionUZ: string;
  trackingNumber: string;
  errorMessage: string;
  boxNumber: string;
  in_foreign_warehouse_date: string;
  in_foreign_airport_date: string;
  in_uzb_airport_date: string;
  in_uzb_warehouse_date: string;
  orderNameRu: string;

  constructor(
    private router: Router,
    private http: Http,
    private httpClient: HttpClient
  ) {}

  ngOnInit() {
    const body = document.getElementsByTagName("body")[0];
    body.classList.add("lock-page");
    body.classList.add("off-canvas-sidebar");

    const card = document.getElementsByClassName("card")[0];
    setTimeout(function () {
      card.classList.remove("card-hidden");
    }, 0);
  }

  ngOnDestroy() {
    const body = document.getElementsByTagName("body")[0];
    body.classList.remove("lock-page");
    body.classList.remove("off-canvas-sidebar");
  }

  checkParcel() {
    if (!this.trackingNum || this.trackingNum.trim() === "") {
      this.showNotification("Please enter a tracking number", "warning");
      return;
    }

    // Reset previous states
    this.resetResults();
    this.isLoading = true;

    this.http
      .get(
        GlobalVars.baseUrl +
          "/orders/find?trackingNumber=" +
          this.trackingNum.trim()
      )
      .subscribe(
        (response) => {
          this.isLoading = false;

          if (response.json().status == "ok") {
            console.log("repsonse ", response.json());

            this.showResults = true;
            this.showError = false;
            this.orderNameRu = response.json().nameRu;
            this.orderStatusDescriptionRU =
              response.json().orderStatusDescriptionRU;
            this.orderStatusDescriptionUZ =
              response.json().orderStatusDescriptionUZ;
            this.trackingNumber = response.json().trackingNumber;
            this.boxNumber = response.json().boxNumber;
            this.in_foreign_warehouse_date =
              response.json().in_foreign_warehouse_date;
            this.in_foreign_airport_date =
              response.json().in_foreign_airport_date;
            this.in_uzb_airport_date = response.json().in_uzb_airport_date;
            this.in_uzb_warehouse_date = response.json().in_uzb_warehouse_date;

            this.showNotification(
              "Yuk malumotlari muvaffaqiyatli topildi!",
              "success"
            );
          } else {
            this.showError = true;
            this.showResults = false;
            this.errorMessage = response.json().message || "Parcel not found";
            this.showNotification(this.errorMessage, "warning");
          }
        },
        (error) => {
          this.isLoading = false;
          this.showError = true;
          this.showResults = false;
          this.errorMessage = "Xatolik, qaytadan urinib ko'ring";
          this.showNotification(this.errorMessage, "danger");
        }
      );
  }

  resetSearch() {
    this.trackingNum = "";
    this.resetResults();
  }

  private resetResults() {
    this.showResults = false;
    this.showError = false;
    this.orderStatusDescriptionRU = "";
    this.orderStatusDescriptionUZ = "";
    this.trackingNumber = "";
    this.boxNumber = "";
    this.errorMessage = "";
    this.in_foreign_warehouse_date = "";
    this.in_foreign_airport_date = "";
    this.in_uzb_airport_date = "";
    this.in_uzb_warehouse_date = "";
  }

  get hasTrackingDates(): boolean {
    return !!(
      this.in_foreign_warehouse_date ||
      this.in_foreign_airport_date ||
      this.in_uzb_airport_date ||
      this.in_uzb_warehouse_date
    );
  }

  private showNotification(message: string, type: string = "info") {
    const typeColors = {
      info: "info",
      success: "success",
      warning: "warning",
      danger: "danger",
      rose: "rose",
      primary: "primary",
    };

    $.notify(
      {
        icon: "notifications",
        message: message,
      },
      {
        type: typeColors[type] || "info",
        timer: 3000,
        placement: {
          from: "top",
          align: "center",
        },
        template:
          '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0} alert-with-icon" role="alert">' +
          '<button mat-raised-button type="button" aria-hidden="true" class="close" data-notify="dismiss">  <i class="material-icons">close</i></button>' +
          '<i class="material-icons" data-notify="icon">notifications</i> ' +
          '<span data-notify="title">{1}</span> ' +
          '<span data-notify="message">{2}</span>' +
          '<div class="progress" data-notify="progressbar">' +
          '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
          "</div>" +
          '<a href="{3}" target="{4}" data-notify="url"></a>' +
          "</div>",
      }
    );
  }
}
