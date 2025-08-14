import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { DatePipe } from "@angular/common";
import { GlobalVars } from "src/app/global-vars";
import { Router } from "@angular/router";

import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";
import { AuthService } from "src/app/pages/login/auth.service";

@Component({
  selector: "app-eachboxdoc",
  templateUrl: "./eachboxdoc.component.html",
  styleUrls: ["./eachboxdoc.component.css"],
  providers: [DatePipe],
})
export class EachboxdocComponent implements OnInit {
  myDate: any = new Date();

  boxNumInput: string;
  boxData: any;

  headers12: any;
  options: any;

  printContents;
  popupWin;
  printCondition: boolean;

  box_number: string;
  total_price: string;
  total_weight: string;
  receiver_passport: string;
  receiver_id: string;
  company_address: string;
  total_amount: string;
  company_name: string;
  country_name: string;
  print_time: string;
  receiver_name: string;
  receiver_address: string;
  orders: any;
  company_index: string;

  printButtonCond: boolean;

  constructor(
    public authService: AuthService,
    private datePipe: DatePipe,
    private changeDetectorRef: ChangeDetectorRef,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.myDate = this.datePipe.transform(this.myDate, "yyyy-MM-dd");
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    this.box_number = "";
    this.total_price = "";
    this.total_weight = "";
    this.receiver_passport = "";
    this.receiver_id = "";
    this.company_address = "";
    this.total_amount = "";
    this.company_name = "";
    this.country_name = "";
    this.print_time = "";
    this.receiver_name = "";
    this.receiver_address = "";

    this.printButtonCond = false;

    //this.orders;
    this.company_index = "";
  }

  ngOnInit(): void {}

  takeBoxData(searchkey) {
    this.http
      .get(
        GlobalVars.baseUrl + "/orders/cn23ForAdmin?box_number=CU" + searchkey,
        this.options
      )
      .subscribe(
        (response) => {
          this.box_number = response.json().box_number;
          this.total_price = response.json().total_price;
          this.total_weight = response.json().total_weight;
          this.receiver_passport = response.json().receiver_passport;
          this.receiver_id = response.json().receiver_id;
          this.company_address = response.json().company_address;
          this.total_amount = response.json().total_amount;
          this.company_name = response.json().company_name;
          this.country_name = response.json().country_name;
          this.print_time = response.json().print_time;
          this.receiver_name = response.json().receiver_name;
          this.receiver_address = response.json().receiver_address;
          this.orders = response.json().orders;
          this.company_index = response.json().company_index;

          this.printButtonCond = true;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  takeBoxData2(searchkey) {
    this.http
      .get(
        GlobalVars.baseUrl + "/orders/cn23ForAdmin?box_number=CU" + searchkey,
        this.options
      )
      .subscribe(
        (response) => {
          this.box_number = response.json().box_number;
          this.total_price = response.json().total_price;
          this.total_weight = response.json().total_weight;
          this.receiver_passport = response.json().receiver_passport;
          this.receiver_id = response.json().receiver_id;
          this.company_address = response.json().company_address;
          this.total_amount = response.json().total_amount;
          this.company_name = response.json().company_name;
          this.country_name = response.json().country_name;
          this.print_time = response.json().print_time;
          this.receiver_name = response.json().receiver_name;
          this.receiver_address = response.json().receiver_address;
          this.orders = response.json().orders;
          this.company_index = response.json().company_index;

          this.printButtonCond = true;
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }

  print(): void {
    this.changeDetectorRef.detectChanges();
    this.printContents = document.getElementById("print-section").innerHTML;
    this.popupWin = window.open(
      "",
      "_blank",
      "top=0,left=0,height=100%,width=auto"
    );
    this.popupWin.document.open();
    this.popupWin.document.write(`
          <html>
            <head>
              <title>Print tab</title>
              <style>
                body { text-align: center; }

                 td{ border-top: 1px solid #000000; 
                      border-bottom: 1px solid #000000; 
                      border-left: 1px solid #000000;
                      border-right: 1px solid #000000;
                      font-size: 12px;
                      
                    }

                  th{ border-top: 1px solid #000000; 
                      border-bottom: 1px solid #000000; 
                      border-left: 1px solid #000000;
                      border-right: 1px solid #000000;
                      font-size: 12px;
                      
                    }

                  .views-table {
                      color: #000;
                      font-weight: 300;
                      font-size: 12px;
                      
                  }

                  .btnprint    {
                      margin: 12px;
                  }

              </style>
            </head>
        <body onload="window.print(); window.close();  "> 
        ${this.printContents}
        
        </body>
          </html>`);

    //  font-size: 12px;
    this.popupWin.document.close();
  }

  print2(): void {
    this.changeDetectorRef.detectChanges();
    this.printContents = document.getElementById("print-section2").innerHTML;
    this.popupWin = window.open(
      "",
      "_blank",
      "top=0,left=0,height=100%,width=auto"
    );
    this.popupWin.document.open();
    this.popupWin.document.write(`
          <html>
            <head>
              <title>Print tab</title>
              <style>
                body { text-align: center; }

                 td{ border-top: 1px solid #000000; 
                      border-bottom: 1px solid #000000; 
                      border-left: 1px solid #000000;
                      border-right: 1px solid #000000;
                      font-size: 12px;
                      
                    }

                  th{ border-top: 1px solid #000000; 
                      border-bottom: 1px solid #000000; 
                      border-left: 1px solid #000000;
                      border-right: 1px solid #000000;
                      font-size: 12px;
                      
                    }

                  .views-table {
                      color: #000;
                      font-weight: 300;
                      font-size: 12px;
                      
                  }

                  .btnprint    {
                      margin: 12px;
                  }

              </style>
            </head>
        <body onload="window.print(); window.close();  "> 
        ${this.printContents}
        
        </body>
          </html>`);

    //  font-size: 12px;
    this.popupWin.document.close();
  }
}
