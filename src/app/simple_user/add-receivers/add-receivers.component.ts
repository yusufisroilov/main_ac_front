import { AddReceiversService } from "./add-receivers.service";
import {
  AfterViewInit,
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import {
  UntypedFormControl,
  FormGroupDirective,
  NgForm,
  Validators,
  UntypedFormGroup,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { UntypedFormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import "rxjs/add/operator/map";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { GlobalVars } from "src/app/global-vars";
import { FormsModule } from "@angular/forms";
import { AuthService } from "src/app/pages/login/auth.service";
import { FormBuilder, FormGroup } from "@angular/forms";

declare const $: any;
interface FileReaderEventTarget extends EventTarget {
  result: string;
}

interface FileReaderEvent extends Event {
  target: EventTarget;
  getMessage(): string;
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: UntypedFormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: "app-add-receivers",
  templateUrl: "./add-receivers.component.html",
  styleUrls: ["add-receivers.component.css"],
})
export class AddReceiversComponent implements OnInit, OnChanges, AfterViewInit {
  regions: any[];
  districts: any[];
  selected: any;
  editOr: any;

  checkPassport: boolean;
  checkPassportMessage: string;
  registredMessage: string;

  edFirstName: string;
  edLastName: string;
  edPassSer: string;
  edPassNum: string;
  edPhoneNumber: string;
  pinfl: string;
  edRegion: any;
  edDistrict: any;
  edStreet: any;
  edAppartmantNum: any;
  parentIDval: any;

  inputPhoneNumValue: string = "";

  showOnlyForManagers: boolean = false;

  matcher = new MyErrorStateMatcher();

  type: FormGroup;
  constructor(
    public authService: AuthService,
    private fb: FormBuilder,
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private addRegService: AddReceiversService,
    private http: Http,
    private httpClient: HttpClient
  ) {
    this.editOr = localStorage.getItem("editpr");

    this.checkPassport = false;

    if (this.editOr == "edit") {
      this.parentIDval = localStorage.getItem("recparent_id");
      this.edFirstName = localStorage.getItem("recfirst_name");
      this.edLastName = localStorage.getItem("reclast_name");
      this.edPassSer = localStorage.getItem("recpass_ser");
      this.edPassNum = localStorage.getItem("recpass_num");
      this.edPhoneNumber = localStorage.getItem("recphone_number");
      this.pinfl = localStorage.getItem("recpinfl");
      this.edRegion = localStorage.getItem("recregion_id");
      this.edDistrict = localStorage.getItem("recdistrict_id");
      this.edStreet = localStorage.getItem("recstreet");
      this.edAppartmantNum = localStorage.getItem("recapartment");
    } else {
      this.edFirstName = "";
      this.edLastName = "";
      this.edPassSer = "";
      this.edPassNum = "";
      this.edPhoneNumber = "";
      this.pinfl = "";
      this.edRegion = "";
      this.edDistrict = "";
      this.edStreet = "";
      this.edAppartmantNum = "";
    }

    this.checkPassport = false;

    if (localStorage.getItem("role") == "MANAGER") {
      this.showOnlyForManagers = true;
    }
  }

  addReceivers(credentials: any) {
    this.editOr = localStorage.getItem("editpr");

    if (this.editOr == "edit") {
      console.log(" kirdim edit ga");

      let headers12 = new Headers({ "Content-Type": "application/json" });
      headers12.append("Authorization", localStorage.getItem("token"));

      let options = new RequestOptions({ headers: headers12 });

      let idOfC = localStorage.getItem("recid");
      this.parentIDval = localStorage.getItem("id");

      this.http
        .put(
          GlobalVars.baseUrl + "/receivers/edit/" + idOfC,
          credentials,
          options
        )
        .subscribe(
          (response) => {
            this.registredMessage = response.json().message;
            localStorage.removeItem("editpr");
            localStorage.removeItem("recid");
            this.editOr = "N";
            this.showAddNotification("top", "center");
            this.router.navigate(["/uzm/allreceivers"]); //line 157
            return false;
          },
          (error) => {
            if (error.status == 403) {
              this.authService.logout();
            }
          }
        );
    } else {
      this.addRegService.addReceivers(credentials).subscribe(
        (result) => {
          if (result) {
            this.registredMessage = this.addRegService.registredMessageS;
            this.showAddNotification("top", "center");
            this.router.navigate(["uzm/allreceivers"]);

            return false;
          } else {
            this.checkPassport = true;
            this.checkPassportMessage =
              this.addRegService.checkPassportMessageS;
            return false;
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

  addPrefix(event) {
    this.edPhoneNumber = `998`;
  }

  ngOnInit() {
    const elemMainPanel = <HTMLElement>document.querySelector(".main-panel");

    this.type = this.fb.group({
      parentID: [
        [this.parentIDval],
        [Validators.required, Validators.maxLength(5)],
      ],
      first_name: [this.edFirstName, Validators.required],
      last_name: [this.edLastName, Validators.required],
      pass_ser: [
        this.edPassSer,
        [Validators.required, Validators.maxLength(2)],
      ],
      pass_num: [
        this.edPassNum,
        [Validators.required, Validators.maxLength(7)],
      ],
      pinfl: [this.pinfl, [Validators.required, Validators.maxLength(14)]],
      phone_number: [
        this.edPhoneNumber,
        [Validators.required, Validators.maxLength(12)],
      ],
      region_id: [this.edRegion, Validators.required],
      district_id: [
        this.edDistrict
          ? this.edDistrict
          : this.districts && this.districts.length > 0
          ? this.districts[0].code
          : null,
      ],
      street: [this.edStreet],
      apartment: [this.edAppartmantNum],
    });

    // Code for the Validator
    const $validator = $(".card-wizard form").validate({
      rules: {
        first_name: {
          required: true,
          minlength: 3,
        },
        last_name: {
          required: true,
          minlength: 3,
        },
        pass_ser: {
          required: true,
          minlength: 2,
          maxlength: 2,
        },
        pass_num: {
          required: true,
          minlength: 7,
          maxlength: 7,
        },
        phone_number: {
          required: true,
          minlength: 3,
        },
        pinfl: {
          required: true,
          minlength: 13,
          maxlength: 14,
        },
      },

      highlight: function (element) {
        $(element)
          .closest(".form-group")
          .removeClass("has-success")
          .addClass("has-danger");
      },
      success: function (element) {
        $(element)
          .closest(".form-group")
          .removeClass("has-danger")
          .addClass("has-success");
      },
      errorPlacement: function (error, element) {
        $(element).append(error);
      },
    });

    // Wizard Initialization
    $(".card-wizard").bootstrapWizard({
      tabClass: "nav nav-pills",
      nextSelector: ".btn-next",
      previousSelector: ".btn-previous",

      onNext: function (tab, navigation, index) {
        var $valid = $(".card-wizard form").valid();
        if (!$valid) {
          $validator.focusInvalid();
          return false;
        }
      },

      onInit: function (tab: any, navigation: any, index: any) {
        // Check number of tabs and fill the entire row
        let $total = navigation.find("li").length;
        let $wizard = navigation.closest(".card-wizard");

        let $first_li = navigation.find("li:first-child a").html();
        let $moving_div = $('<div class="moving-tab">' + $first_li + "</div>");
        $(".card-wizard .wizard-navigation").append($moving_div);

        $total = $wizard.find(".nav li").length;
        let $li_width = 100 / $total;

        let total_steps = $wizard.find(".nav li").length;
        let move_distance = $wizard.width() / total_steps;
        let index_temp = index;
        let vertical_level = 0;

        let mobile_device = $(document).width() < 600 && $total > 3;

        if (mobile_device) {
          move_distance = $wizard.width() / 2;
          index_temp = index % 2;
          $li_width = 50;
        }

        $wizard.find(".nav li").css("width", $li_width + "%");

        let step_width = move_distance;
        move_distance = move_distance * index_temp;

        let $current = index + 1;

        if ($current == 1 || (mobile_device == true && index % 2 == 0)) {
          move_distance -= 8;
        } else if (
          $current == total_steps ||
          (mobile_device == true && index % 2 == 1)
        ) {
          move_distance += 8;
        }

        if (mobile_device) {
          let x: any = index / 2;
          vertical_level = parseInt(x);
          vertical_level = vertical_level * 38;
        }

        $wizard.find(".moving-tab").css("width", step_width);
        $(".moving-tab").css({
          transform:
            "translate3d(" + move_distance + "px, " + vertical_level + "px, 0)",
          transition: "all 0.5s cubic-bezier(0.29, 1.42, 0.79, 1)",
        });
        $(".moving-tab").css("transition", "transform 0s");
      },

      onTabClick: function (tab: any, navigation: any, index: any) {
        const $valid = $(".card-wizard form").valid();

        if (!$valid) {
          return false;
        } else {
          return true;
        }
      },

      onTabShow: function (tab: any, navigation: any, index: any) {
        let $total = navigation.find("li").length;
        let $current = index + 1;
        elemMainPanel.scrollTop = 0;
        const $wizard = navigation.closest(".card-wizard");

        // If it's the last tab then hide the last button and show the finish instead
        if ($current >= $total) {
          $($wizard).find(".btn-next").hide();
          $($wizard).find(".btn-finish").show();
        } else {
          $($wizard).find(".btn-next").show();
          $($wizard).find(".btn-finish").hide();
        }

        const button_text = navigation
          .find("li:nth-child(" + $current + ") a")
          .html();

        setTimeout(function () {
          $(".moving-tab").text(button_text);
        }, 150);

        const checkbox = $(".footer-checkbox");

        if (index !== 0) {
          $(checkbox).css({
            opacity: "0",
            visibility: "hidden",
            position: "absolute",
          });
        } else {
          $(checkbox).css({
            opacity: "1",
            visibility: "visible",
          });
        }
        $total = $wizard.find(".nav li").length;
        let $li_width = 100 / $total;

        let total_steps = $wizard.find(".nav li").length;
        let move_distance = $wizard.width() / total_steps;
        let index_temp = index;
        let vertical_level = 0;

        let mobile_device = $(document).width() < 600 && $total > 3;

        if (mobile_device) {
          move_distance = $wizard.width() / 2;
          index_temp = index % 2;
          $li_width = 50;
        }

        $wizard.find(".nav li").css("width", $li_width + "%");

        let step_width = move_distance;
        move_distance = move_distance * index_temp;

        $current = index + 1;

        if ($current == 1 || (mobile_device == true && index % 2 == 0)) {
          move_distance -= 8;
        } else if (
          $current == total_steps ||
          (mobile_device == true && index % 2 == 1)
        ) {
          move_distance += 8;
        }

        if (mobile_device) {
          let x: any = index / 2;
          vertical_level = parseInt(x);
          vertical_level = vertical_level * 38;
        }

        $wizard.find(".moving-tab").css("width", step_width);
        $(".moving-tab").css({
          transform:
            "translate3d(" + move_distance + "px, " + vertical_level + "px, 0)",
          transition: "all 0.5s cubic-bezier(0.29, 1.42, 0.79, 1)",
        });
      },
    });

    // Prepare the preview for profile picture
    $("#wizard-picture").change(function () {
      const input = $(this);

      if (input[0].files && input[0].files[0]) {
        const reader = new FileReader();

        reader.onload = function (e: any) {
          $("#wizardPicturePreview")
            .attr("src", e.target.result)
            .fadeIn("slow");
        };
        reader.readAsDataURL(input[0].files[0]);
      }
    });

    $('[data-toggle="wizard-radio"]').click(function () {
      const wizard = $(this).closest(".card-wizard");
      wizard.find('[data-toggle="wizard-radio"]').removeClass("active");
      $(this).addClass("active");
      $(wizard).find('[type="radio"]').removeAttr("checked");
      $(this).find('[type="radio"]').attr("checked", "true");
    });

    $('[data-toggle="wizard-checkbox"]').click(function () {
      if ($(this).hasClass("active")) {
        $(this).removeClass("active");
        $(this).find('[type="checkbox"]').removeAttr("checked");
      } else {
        $(this).addClass("active");
        $(this).find('[type="checkbox"]').attr("checked", "true");
      }
    });

    $(".set-full-height").css("height", "auto");

    this.editOr = localStorage.getItem("editpr");

    if (this.editOr == "edit") {
      let headers1 = new Headers({ "Content-Type": "application/json" });
      headers1.append("Authorization", localStorage.getItem("token"));
      // headers.append('Content-Type', 'text/plain');
      // I didn't understand if you need this append.

      let options = new RequestOptions({ headers: headers1 });

      let idOfC = localStorage.getItem("recid");

      return this.http
        .get(GlobalVars.baseUrl + "/receivers/list/" + idOfC, options)
        .subscribe(
          (response) => {
            this.edFirstName = response.json().first_name;
            this.edLastName = response.json().last_name;
            this.edPassSer = response.json().pass_ser;
            this.edPassNum = response.json().pass_num;
            this.pinfl = response.json().pinfl;
            this.edPhoneNumber = response.json().phone_number;
            this.edRegion = response.json().region_id;
            this.takeRegions();

            this.takeDistrictsEdit(this.edRegion);
            this.edDistrict = response.json().district_id;
            this.edStreet = response.json().street;
            this.edAppartmantNum = response.json().apartment;
            this.parentIDval = response.json().parent_id; // line 508
            //localStorage.removeItem('editpr');
            //localStorage.removeItem('recid');
            // this.regions = response.json().regions;
          },
          (error) => {
            if (error.status == 403) {
              this.authService.logout();
            }
          }
        );
    }

    this.takeRegions();
  }

  takeRegions() {
    let headers1 = new Headers({ "Content-Type": "application/json" });
    headers1.append("Authorization", localStorage.getItem("token"));
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers1 });

    return this.http
      .get(GlobalVars.baseUrl + "/regions/list", options)
      .subscribe(
        (response) => {
          this.regions = response.json().regions;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  showAddNotification(from: any, align: any) {
    const type = [
      "",
      "info",
      "success",
      "warning",
      "danger",
      "rose",
      "primary",
    ];

    let cMessage = this.registredMessage;
    const color = Math.floor(Math.random() * 6 + 1);

    $.notify(
      {
        icon: "notifications",
        message: cMessage,
      },
      {
        type: type[2],
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

  takeDistricts(post: any) {
    let headers1 = new Headers({ "Content-Type": "application/json" });
    headers1.append("Authorization", localStorage.getItem("token"));
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers1 });

    return this.http
      .get(GlobalVars.baseUrl + "/regions/town/" + post.value, options)
      .subscribe(
        (response) => {
          this.districts = response.json().towns;
          //   console.log("districts ", this.districts);
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  takeDistrictsEdit(regID) {
    let headers1 = new Headers({ "Content-Type": "application/json" });
    headers1.append("Authorization", localStorage.getItem("token"));
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers1 });

    let val: string = regID;

    return this.http
      .get(GlobalVars.baseUrl + "/regions/town/" + val, options)
      .subscribe(
        (response) => {
          this.districts = response.json().towns;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    const input = $(this);

    if (input[0].files && input[0].files[0]) {
      const reader: any = new FileReader();

      reader.onload = function (e: any) {
        $("#wizardPicturePreview").attr("src", e.target.result).fadeIn("slow");
      };
      reader.readAsDataURL(input[0].files[0]);
    }
  }
  ngAfterViewInit() {
    $(window).resize(() => {
      $(".card-wizard").each(function () {
        setTimeout(() => {
          const $wizard = $(this);
          const index = $wizard.bootstrapWizard("currentIndex");
          let $total = $wizard.find(".nav li").length;
          let $li_width = 100 / $total;

          let total_steps = $wizard.find(".nav li").length;
          let move_distance = $wizard.width() / total_steps;
          let index_temp = index;
          let vertical_level = 0;

          let mobile_device = $(document).width() < 600 && $total > 3;
          if (mobile_device) {
            move_distance = $wizard.width() / 2;
            index_temp = index % 2;
            $li_width = 50;
          }

          $wizard.find(".nav li").css("width", $li_width + "%");

          let step_width = move_distance;
          move_distance = move_distance * index_temp;

          let $current = index + 1;

          if ($current == 1 || (mobile_device == true && index % 2 == 0)) {
            move_distance -= 8;
          } else if (
            $current == total_steps ||
            (mobile_device == true && index % 2 == 1)
          ) {
            move_distance += 8;
          }

          if (mobile_device) {
            let x: any = index / 2;
            vertical_level = parseInt(x);
            vertical_level = vertical_level * 38;
          }

          $wizard.find(".moving-tab").css("width", step_width);
          $(".moving-tab").css({
            transform:
              "translate3d(" +
              move_distance +
              "px, " +
              vertical_level +
              "px, 0)",
            transition: "all 0.5s cubic-bezier(0.29, 1.42, 0.79, 1)",
          });

          $(".moving-tab").css({
            transition: "transform 0s",
          });
        }, 500);
      });
    });
  }
}
