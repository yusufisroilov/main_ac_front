import { Component, OnInit } from "@angular/core";
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
  selector: "app-allreceivers",
  templateUrl: "./allreceivers.component.html",
  styleUrls: ["./allreceivers.component.css"],
})
export class AllreceiversComponent implements OnInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allRecs: any;
  helloText: string;
  registredMessage: any;
  trackingNum2: any;

  currentPage: number;
  totalPages: number;
  pageSize: number = 20;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;

  regions: any[];
  districts: any[];

  modParentID: string;
  modId: string;
  modRegion: string;
  modDistrict: string;
  modStreet: string;

  constructor(
    private http: Http,
    private httpClient: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });

    this.http.get(GlobalVars.baseUrl + "/regions/list", this.options).subscribe(
      (response) => {
        this.regions = response.json().regions;

        // console.log("ssss" + this.regions + " ggg" + this.regions[1].id)
      },
      (error) => {
        if (error.status == 403) {
          this.authService.logout();
        }
      }
    );

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;
  }

  ngOnInit(): void {
    this.dataTable = {
      headerRow: [
        "User ID",
        "Rec ID",
        "Phone number",
        "Full name",
        "Pasport num",
        "Address",
        "Amallar",
      ],

      dataRows: [],
    };
    this.getListOfRecs();
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    document.getElementById("listcard").scrollIntoView();
    this.getListOfRecs();
  }

  getListOfRecs() {
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/receivers/listForStaff?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize,
        this.options
      )
      .subscribe(
        (response) => {
          this.allRecs = response.json().receivers;
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

  editReceiver(
    id,
    parent_id,
    client_name,
    first_name,
    last_name,
    pass_ser,
    pass_num,
    pinfl,
    phone_number,
    region_id,
    district_id,
    street,
    apartment
  ) {
    localStorage.setItem("recid", id);
    localStorage.setItem("recparent_id", parent_id);
    localStorage.setItem("recclient_name", client_name);

    localStorage.setItem("recfirst_name", first_name);
    localStorage.setItem("reclast_name", last_name);
    localStorage.setItem("recpass_ser", pass_ser);
    localStorage.setItem("recpass_num", pass_num);
    localStorage.setItem("recpinfl", pinfl);
    localStorage.setItem("recphone_number", phone_number);
    localStorage.setItem("recregion_id", region_id);
    localStorage.setItem("recdistrict_id", district_id);
    localStorage.setItem("recstreet", street);
    localStorage.setItem("recapartment", apartment);
    localStorage.setItem("recparent_id", parent_id);
    localStorage.setItem("editpr", "edit");

    this.router.navigate(["/addreceivers"]);
  }

  /**
   * Handle page change from pagination component
   */
  onPageChanged(pageIndex: number) {
    this.currentPage = pageIndex;
    document.getElementById("listcard")?.scrollIntoView({ behavior: "smooth" });
    this.getListOfRecs();
  }

  getListOfRecsWithFilter(parentId, passportCont, ownid, status) {
    let filterLink =
      "&parentID=" +
      parentId +
      "&passport=" +
      passportCont +
      "&id=" +
      ownid +
      "&statusQuarter=" +
      status;
    return this.http
      .get(
        GlobalVars.baseUrl +
          "/receivers/listForStaff?page=" +
          this.currentPage +
          "&size=" +
          this.pageSize +
          filterLink,
        this.options
      )
      .subscribe(
        (response) => {
          this.allRecs = response.json().receivers;

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

  /*
  getListOfParcelsWithSearch(searchkey){

    if(searchkey=="")
    {
      this.currentPage=0;

       this.getListOfParcels();
    }else{


      this.http.get(GlobalVars.baseUrl+'/orders/search?tracking_number='+ searchkey, this.options)
      .subscribe(response => {
        this.allData = response.json().orders;

        for (let index = 0; index < this.allData.length; index++) {
          const element = this.allData[index];
          this.orderTypeText[index] = GlobalVars.getDescriptionWithID(element.orderType, "uz");  
        }

        for (let index = 0; index < this.allData.length; index++) {
          const element1 = this.allData[index];
          this.orderStatusText[index] = GlobalVars.getDesOrderStatusWithID(element1.status, "uz");  
        }

        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        }

      })

    }

  } */

  putAdressInfo(
    recidsi,
    modParentID,
    modRegionw,
    modDistrict,
    modStreet,
    appartment
  ) {
    this.modParentID = modParentID;
    this.modId = recidsi;

    this.modRegion = modRegionw;
    for (let i = 0; i < this.regions.length; i++) {
      if (this.regions[i].code == this.modRegion) {
        this.modRegion = this.regions[i].name;
      }
    }

    this.http
      .get(GlobalVars.baseUrl + "/regions/town/" + modRegionw, this.options)
      .subscribe(
        (response) => {
          this.districts = response.json().towns;

          for (let i = 0; i < this.districts.length; i++) {
            if (this.districts[i].code == modDistrict) {
              console.log("Men kirdim");
              this.modDistrict = this.districts[i].name;
            }
          }
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );

    this.modStreet = modStreet + "" + appartment;
  }

  changeStatus(CId, message) {
    swal
      .fire({
        title: "Bu Qabul qiluvchini" + message + " hohlaysizmi?",
        showCancelButton: true,
        confirmButtonText: `Ha, shunday`,
        denyButtonText: `Yo'q`,
      })
      .then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          this.http
            .post(
              GlobalVars.baseUrl + "/receivers/changeStatus?receiver_id=" + CId,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "ok") {
                  this.getListOfRecs();
                } else {
                  swal
                    .fire("Error happaned!", response.json().message, "error")
                    .then((result) => {});
                }
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        } else if (result.isDenied) {
          swal.fire("O'zgarmadi", "", "info");
        }
      });
  }

  changeParentID(iddd) {
    swal
      .fire({
        title: "Asosiy IDsini o'zgartirish",
        text: "Ushbu " + iddd + " RID ning asosiy ID sini o'zgaritish!",
        allowEnterKey: true,
        input: "text",
        confirmButtonText: "Saqlash",
        showCancelButton: true,
        cancelButtonText: "No",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-info",
        },
        buttonsStyling: false,

        preConfirm: (valueB) => {
          this.http
            .post(
              GlobalVars.baseUrl +
                "/receivers/changeParent?receiver_id=" +
                iddd +
                "&parent_id=" +
                valueB,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  swal.fire(
                    "O'zgarmadi!",
                    "Xato: " + response.json().message,
                    "error"
                  );
                  this.getListOfRecs();
                } else {
                  swal.fire(
                    "O'zgartirildi!",
                    "Bu qabul qiluvchi Asosiy IDsi yangilandi!",
                    "success"
                  );
                  this.getListOfRecs();
                }
              },
              (error) => {
                if (error.status == 400) {
                  this.getListOfRecs();
                } else if (error.status == 403) {
                  this.getListOfRecs();
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire(
            "O'zgartirildi!",
            "Bu qabul qiluvchi Asosiy IDsi yangilandi!",
            "success"
          );
          this.getListOfRecs();
        } else {
          swal.fire("O'zgarmadi!", "Xato!", "error");
          this.getListOfRecs();
        }
      });
  }

  deleteRec(iddd) {
    // console.log("RID ", iddd);

    swal
      .fire({
        title: "Ushbu qabul qiluvchini o'chirish",
        text: "Ushbu " + iddd + " RID ni o'chirishni hohlaysizmi?",
        allowEnterKey: true,
        confirmButtonText: "O'chirish",
        showCancelButton: true,
        cancelButtonText: "No",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-info",
        },
        buttonsStyling: false,

        preConfirm: () => {
          this.http
            .post(
              GlobalVars.baseUrl + "/receivers/delete?rid=" + iddd,
              {},
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  swal.fire(
                    "O'chirilmadi!",
                    "Xato: " + response.json().message,
                    "error"
                  );
                  this.getListOfRecs();
                } else {
                  swal.fire(
                    "O'chirilid!",
                    "Bu qabul qiluvchi sistemadan o'chirildi!",
                    "success"
                  );
                  this.getListOfRecs();
                }
              },
              (error) => {
                if (error.status == 400) {
                  this.getListOfRecs();
                } else if (error.status == 403) {
                  this.getListOfRecs();
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire(
            "O'zgartirildi!",
            "Bu qabul qiluvchi sistemadan o'chirildi!",
            "success"
          );
          this.getListOfRecs();
        } else {
          swal.fire("O'zgarmadi!", "Xato!", "error");
          this.getListOfRecs();
        }
      });
  }

  /*
  getInfoOfParcel(me)
  {
    //console.log("ne is"+ me);
    this.trackingNum2 = me;  
  }
*/
  ngAfterViewInit() {
    return this.getListOfRecs();
  }

  takeRegions() {
    let headers1 = new Headers({ "Content-Type": "application/json" });
    headers1.append("Authorization", localStorage.getItem("token"));
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers1 });
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
          console.log("222 " + this.districts);
        },
        (error) => {
          if (error.status == 403) {
            this.authService.logout();
          }
        }
      );
  }
}
