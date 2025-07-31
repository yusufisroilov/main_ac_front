import { Router } from "@angular/router";
import { Component, OnInit, ElementRef, OnDestroy } from "@angular/core";
import { Http, RequestOptions } from "@angular/http";
import { GlobalVars } from "src/app/global-vars";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "src/app/pages/login/auth.service";
import { DeliveryService } from "./delivery.service";
import { ActivatedRoute } from "@angular/router";
import Swal from "sweetalert2";

declare var $: any;

@Component({
  selector: "app-delivery",
  templateUrl: "./delivery.component.html",
  styleUrls: ["./delivery.component.css"],
})
export class DeliveryComponent implements OnInit, OnDestroy {
  invalidLogin: boolean;
  ozimolibketaman: boolean;
  fargo: boolean;
  bts: boolean;
  yandex: boolean;
  taksidan: boolean;
  inputValue: string = "";
  yandexRegion: string = "Tashkent";

  registredMessage: string;

  financeId: string;
  ownerQuID: string;

  headers12: any;
  options: any;
  typeOfDel: any[] = [];
  lat = 41.2545746;
  lng = 69.1998216;
  allDataDone: any;

  test: Date = new Date();
  private toggleButton: any;
  private sidebarVisible: boolean;
  private nativeElement: Node;

  constructor(
    private routeQuery: ActivatedRoute,
    public authService: AuthService,
    private element: ElementRef,
    private addDelService: DeliveryService,
    private router: Router,
    private http: Http,
    private httpClient: HttpClient
  ) {
    this.nativeElement = element.nativeElement;
    this.sidebarVisible = false;
    this.invalidLogin = false;

    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.options = new RequestOptions({ headers: this.headers12 });

    this.http
      .get(GlobalVars.baseUrl + "/delivery_type/list", this.options)
      .subscribe((response) => {
        this.typeOfDel = response.json().delivery_types;
      });

    this.http
      .get(GlobalVars.baseUrl + "/delivery/list", this.options)
      .subscribe((response) => {
        this.allDataDone = response.json().deliviries;
        console.log(this.allDataDone[1].additionalPhoneNumber);
        // for (let index = 0; index < this.allData.length; index++) {
        //   const element = this.allData[index];
        //   this.orderTypeText[index] = GlobalVars.getDescriptionWithID(element.orderType, "uz");
        // }
      });
  }

  holdChange(event) {
    if (event == "1") {
      this.ozimolibketaman = true;
      this.fargo = false;
      this.bts = false;
      this.yandex = false;
      this.taksidan = false;
    } else if (event == "2") {
      this.fargo = false;
      this.bts = false;
      this.ozimolibketaman = false;
      this.yandex = true;
      this.taksidan = false;
    } else if (event == "3") {
      this.fargo = true;
      this.bts = false;
      this.ozimolibketaman = false;
      this.yandex = false;
      this.taksidan = false;
    } else if (event == "4") {
      this.fargo = false;
      this.bts = true;
      this.ozimolibketaman = false;
      this.yandex = false;
      this.taksidan = false;
    } else if (event == "5") {
      this.fargo = false;
      this.bts = false;
      this.ozimolibketaman = false;
      this.yandex = false;
      this.taksidan = true;
    }
  }

  submitDelivery(credentials: any) {
    // console.log(credentials);

    // console.log("ID is" + credentials.ownerID)

    let linkPls =
      "?ownerID=" +
      credentials.ownerID +
      "&additionalPhoneNumber=" +
      credentials.additionalPhoneNumber +
      "&financeID=" +
      credentials.financeID +
      "&deliveryType=" +
      credentials.deliveryType +
      "&region=" +
      credentials.region +
      "&town=" +
      credentials.town;

    this.http
      .post(GlobalVars.baseUrl + "/delivery/add" + linkPls, "", this.options)
      .subscribe(
        (response) => {
          if (response.json().status == "ok") {
            Swal.fire(
              "Saqlandi!",
              "Sizga tez orada xizmat ko'rsatamiz!",
              "success"
            );

            this.router.navigate(["/pages/login"]);
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );

    // this.addDelService.addDelivery(credentials)
    // .subscribe(result => {

    //        this.registredMessage = this.addDelService.registredMessageS;
    //        this.showNotification('top','center');
    //        this.router.navigate(['/pages/login']);

    //         return false;

    // }, error => {
    //     if (error.status == 403) {

    //       this.authService.logout();

    //     }
    // });
  }

  ngOnInit() {
    var navbar: HTMLElement = this.element.nativeElement;
    this.toggleButton = navbar.getElementsByClassName("navbar-toggle")[0];
    const body = document.getElementsByTagName("body")[0];
    body.classList.add("login-page");
    body.classList.add("off-canvas-sidebar");
    const card = document.getElementsByClassName("card")[0];
    setTimeout(function () {
      // after 1000 ms we add the class animated to the login/register card
      card.classList.remove("card-hidden");
    }, 700);

    this.routeQuery.queryParams.subscribe((params) => {
      console.log(params); // { orderby: "price" }
      this.financeId = params.finance;
      this.ownerQuID = params.owner;
    });
  }
  sidebarToggle() {
    var toggleButton = this.toggleButton;
    var body = document.getElementsByTagName("body")[0];
    var sidebar = document.getElementsByClassName("navbar-collapse")[0];
    if (this.sidebarVisible == false) {
      setTimeout(function () {
        toggleButton.classList.add("toggled");
      }, 500);
      body.classList.add("nav-open");
      this.sidebarVisible = true;
    } else {
      this.toggleButton.classList.remove("toggled");
      this.sidebarVisible = false;
      body.classList.remove("nav-open");
    }
  }
  ngOnDestroy() {
    const body = document.getElementsByTagName("body")[0];
    body.classList.remove("login-page");
    body.classList.remove("off-canvas-sidebar");
  }

  showNotification(from: any, align: any) {
    const type = [
      "",
      "info",
      "success",
      "warning",
      "danger",
      "rose",
      "primary",
    ];

    const color = 2;

    $.notify(
      {
        icon: "notifications",
        message: this.registredMessage,
      },
      {
        type: type[4],
        timer: 3000,
        placement: {
          from: from,
          align: align,
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
