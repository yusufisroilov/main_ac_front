import { ChildrenItems } from "./../../sidebar/sidebar.component";
import { ReceiverService } from "./receivers.service";
import {
  AfterViewInit,
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { TableData } from "../../md/md-table/md-table.component";
import { Http, RequestOptions, Headers } from "@angular/http";
import "rxjs/add/operator/map";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import swal from "sweetalert2";
import { Router } from "@angular/router";
import { GlobalVars } from "src/app/global-vars";
import { AuthService } from "src/app/pages/login/auth.service";

declare var $: any;

declare interface Task {
  title: string;
  checked: boolean;
}

@Component({
  selector: "app-receivers",
  templateUrl: "./receivers.component.html",
  styleUrls: ["./receivers.component.css"],
})
export class ReceiversComponent implements OnInit {
  public tableData1: TableData;
  receivers: any[];
  deleteMessage: string;
  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];

  constructor(
    public authService: AuthService,
    private recService: ReceiverService,
    private router: Router,
    private http: Http,
    private httpClient: HttpClient
  ) {
    this.currentPage = 0;
    this.needPagination = false;
  }

  getlistofrecs() {
    let headers1 = new Headers({ "Content-Type": "application/json" });
    headers1.append("Authorization", localStorage.getItem("token"));
    let options = new RequestOptions({ headers: headers1 });

    return this.http
      .get(
        GlobalVars.baseUrl +
          "/receivers/list?page=" +
          this.currentPage +
          "&size=" +
          "50",
        options
      )
      .subscribe(
        (response) => {
          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          if (this.totalPages > 1) {
            this.needPagination = true;

            for (let i = 0; i < this.totalPages; i++) {
              this.mypages[i] = { id: "name" };
            }
          }

          this.receivers = response.json().receivers;
          // console.log("receivers ", this.receivers);
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
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

  deleteReceivers(receiver) {
    swal
      .fire({
        title: "DIQQAT!",
        text: "Ushbu qabul qiluvchini o'chirish uchun Admin bilan bog'laning! Admin telegramda +998990099048 raqamida!",
        icon: "warning",
        showCancelButton: false,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        confirmButtonText: "Tushinarli!",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          // this.deleteReceiverHttp(receiver);

          swal.fire({
            title: "Tushingangizdan mamnunmiz",

            icon: "success",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  deleteReceiverHttp(receiver) {
    let headers1 = new Headers({ "Content-Type": "text/plain" });
    headers1.append("Authorization", localStorage.getItem("token"));
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers1 });

    return this.http
      .delete(GlobalVars.baseUrl + "/receivers/delete/" + receiver.id, options)
      .subscribe(
        (response) => {
          this.deleteMessage = response.json().message;
          this.showDelNotification("top", "center");
          this.getlistofrecs();
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  editReceiver(receiver) {
    swal
      .fire({
        title: "DIQQAT!",
        text: "Ushbu qabul qiluvchini o'zgartirish uchun Admin bilan bog'laning! Admin telegramda +998990099048 raqamida!",
        icon: "warning",
        showCancelButton: false,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        confirmButtonText: "Tushinarli!",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          // this.deleteReceiverHttp(receiver);

          swal.fire({
            title: "Tushingangizdan mamnunmiz",

            icon: "success",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });

    //  localStorage.setItem('recid', receiverId.id);
    // localStorage.setItem('editpr', 'edit');
    //  this.router.navigate(['/addreceivers']);
  }

  pagebyNum(pageNum) {
    this.currentPage = pageNum;
    this.getlistofrecs();
  }

  showDelNotification(from: any, align: any) {
    const type = [
      "",
      "info",
      "success",
      "warning",
      "danger",
      "rose",
      "primary",
    ];
    let juju = this.deleteMessage;
    const color = Math.floor(Math.random() * 6 + 1);

    $.notify(
      {
        icon: "notifications",
        message: juju,
      },
      {
        type: type[1],
        timer: 2500,
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

  ngOnInit() {
    localStorage.removeItem("editpr");
    localStorage.removeItem("recid");

    this.getlistofrecs();

    this.tableData1 = {
      headerRow: ["RID", "FIO", "Telefon nomer", "Passport Number", "Manzil"],
      dataRows: [["Dakota Rice", "998977200821", "Oud-Turnhout", "$36,738"]],
    };
  }
}
