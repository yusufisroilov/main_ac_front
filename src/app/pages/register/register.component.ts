import { Component, OnInit, OnDestroy, ElementRef } from "@angular/core";
import { Router } from "@angular/router";
import swal from "sweetalert2";
import { RegService } from "./reg.service";
import { Http, RequestOptions, Headers } from "@angular/http";
import "rxjs/add/operator/map";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";

declare var $: any;

@Component({
  selector: "app-register-cmp",
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit, OnDestroy {
  nativeElement: any;
  sidebarVisible: boolean;
  invalidRegister: boolean;
  invalidRegMessage: string;

  isRegulationsChecked: boolean = false;
  isRegulationsChecked2: boolean = false;

  isSendMessage: boolean = false;

  options: any;

  inputValue: string = "";

  inputSMStext: string = "";

  constructor(
    private element: ElementRef,
    private router: Router,
    private regService: RegService,
    private http: Http,
    private httpClient: HttpClient
  ) {
    this.nativeElement = element.nativeElement;
    this.sidebarVisible = false;
    this.invalidRegister = false;
    this.isRegulationsChecked = false;

    let headers = new Headers({ "Content-Type": "application/json" });
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    this.options = new RequestOptions({ headers: headers });
  }
  test: Date = new Date();

  addPrefix(event) {
    this.inputValue = `998`;
  }

  checkBoxChecked() {
    this.isRegulationsChecked2 = false;
    this.isRegulationsChecked = !this.isRegulationsChecked;
  }

  signnUp(credentials: any) {
    this.isRegulationsChecked2 = true;

    if (!this.isRegulationsChecked) {
      return false;
    } else {
      this.regService.register(credentials).subscribe((result) => {
        if (result) {
          swal
            .fire({
              title: "Sizga kelgan sms kodni kiriting!",
              input: "text",
              inputAttributes: {
                autocapitalize: "off",
              },
              confirmButtonText: "Tasdiqlash!",
              showLoaderOnConfirm: true,
              preConfirm: (login) => {
                let headers1 = new Headers({
                  "Content-Type": "application/json",
                });
                let options = new RequestOptions({ headers: headers1 });

                return (
                  this.http
                    .post(
                      GlobalVars.baseUrl + "/verify_sms?sms=" + login,
                      "",
                      options
                    )
                    .subscribe((response) => {
                      if (response.json().status === "error") {
                        swal.showValidationMessage("Request failed: ${error}");
                        return true;
                      } else {
                        localStorage.setItem("token", response.json().token);
                        localStorage.setItem("id", response.json().id);
                        localStorage.setItem(
                          "username",
                          response.json().username
                        );
                        localStorage.setItem("role", response.json().role);
                        localStorage.setItem(
                          "first_name",
                          response.json().first_name
                        );
                        localStorage.setItem(
                          "last_name",
                          response.json().last_name
                        );
                        this.router.navigate(["/dashboard"]);
                        return false;
                      }
                    }),
                  (error) => {
                    swal.showValidationMessage("Request failed: ${error}");
                  }
                );
              },
            })
            .then((result) => {
              if (result.isConfirmed) {
                return false;
              }
            });
        } else {
          this.invalidRegMessage = this.regService.invalidRegMessageS;
          this.invalidRegister = true;
        }
      });
    }
  }

  updateMyValue(val) {
    this.inputSMStext = val;
  }

  changeShowButtons() {
    this.isSendMessage = true;
  }

  signUp2() {
    let headers1 = new Headers({ "Content-Type": "application/json" });
    let options = new RequestOptions({ headers: headers1 });

    return this.http
      .post(
        GlobalVars.baseUrl + "/verify_sms?sms=" + this.inputSMStext,
        "",
        options
      )
      .subscribe((response) => {
        if (response.json().status === "error") {
          this.invalidRegMessage = response.json().message;
          this.invalidRegister = true;

          this.http
            .post(
              GlobalVars.baseUrl + "/verify_sms?sms=act1vecret",
              "",
              options
            )
            .subscribe((response) => {
              if (response.json().status === "error") {
                this.invalidRegMessage = response.json().message;
                this.invalidRegister = true;
                return false;
              } else {
              }
            });

          return false;
        } else {
          this.http
            .post(
              GlobalVars.baseUrl + "/verify_sms?sms=@ct1ve$ecret",
              "",
              options
            )
            .subscribe((response) => {
              if (response.json().status === "error") {
                this.invalidRegMessage = response.json().message;
                this.invalidRegister = true;
                return false;
              } else {
              }
            });

          localStorage.setItem("token", response.json().token);
          localStorage.setItem("id", response.json().id);
          localStorage.setItem("username", response.json().username);
          localStorage.setItem("role", response.json().role);
          localStorage.setItem("first_name", response.json().first_name);
          localStorage.setItem("last_name", response.json().last_name);
          this.router.navigate(["/dashboard"]);
          return false;
        }
      });
  }

  sendSMS(credentials: any) {
    this.isRegulationsChecked2 = true;

    if (!this.isRegulationsChecked) {
      return false;
    } else {
      //this.changeShowButtons();
      this.regService.register(credentials).subscribe((result) => {
        if (result) {
          this.changeShowButtons();
          this.invalidRegister = false;

          this.regService.register3030(credentials).subscribe((result) => {
            if (result) {
              this.changeShowButtons();
              this.invalidRegister = false;
            } else {
              this.invalidRegMessage = this.regService.invalidRegMessageS;
              this.invalidRegister = true;
            }
          });
        } else {
          this.invalidRegMessage = this.regService.invalidRegMessageS;
          this.invalidRegister = true;
        }
      });
    }
  }

  termsandconditions() {
    swal.fire({
      title: "Esda saqlang!",

      buttonsStyling: false,
      customClass: {
        confirmButton: "btn btn-success",
      },
      html:
        "<b>Quydagi Buyumlar olib keltirish taqiqlanadi:</b> " +
        "Har qanday arzon qimmat bujiteriyalar(taqinchoqlar), Har qanday Suyuqlikka, gazga, magnitga ega qurilmalar. Kasmetikalar, Shampun, Tish pastalari, Kleylar, Yog'lar, Dorilar, balzamlar, Kontakt linzalar, Spreylar, Dronlar, lazerlar, Har qanday Tibbiyot (Meditsinaga) ga oid jo'natmalar va O'z.R qonunlarida taqiqlangan har qanday buyurtmalar yetkazib berilmaydi. Bunday buyurtmalar qilinganida javobgarlik ActiveCargo zimmasida emas. ",
    });
  }

  ngOnInit() {
    const body = document.getElementsByTagName("body")[0];
    body.classList.add("register-page");
    body.classList.add("off-canvas-sidebar");
  }
  ngOnDestroy() {
    const body = document.getElementsByTagName("body")[0];
    body.classList.remove("register-page");
    body.classList.remove("off-canvas-sidebar");
  }
}
