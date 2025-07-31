import { ChildrenItems } from "./../../sidebar/sidebar.component";
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
  selector: "app-allconsignments",
  templateUrl: "./allconsignments.component.html",
  styleUrls: ["./allconsignments.component.css"],
})
export class AllconsignmentsComponent implements OnInit {
  public tableData1: TableData;
  receivers: any[];
  deleteMessage: string;
  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];

  constructor(
    private router: Router,
    private http: Http,
    private httpClient: HttpClient,
    public authService: AuthService
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
          "5",
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
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  ngOnInit(): void {
    this.getlistofrecs();

    this.tableData1 = {
      headerRow: ["ID", "FIO", "Telefon nomer", "Passport Number", "Manzil"],
      dataRows: [["Dakota Rice", "998977200821", "Oud-Turnhout", "$36,738"]],
    };
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
}
