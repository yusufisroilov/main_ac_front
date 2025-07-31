import { AfterViewInit, Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Http, RequestOptions, Headers, Response } from "@angular/http";

import swal from "sweetalert2";
import { GlobalVars, StatusOfOrder, TypesOfOrder } from "src/app/global-vars";
import { Router } from "@angular/router";
import { AuthService } from "src/app/pages/login/auth.service";
import Swal from "sweetalert2";

declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare const $: any;

@Component({
  selector: "app-express-scan",
  templateUrl: "./express-scan.component.html",
  styleUrls: ["./express-scan.component.css"],
})
export class ExpressScanComponent implements OnInit, AfterViewInit {
  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allData: any;
  helloText: string;
  registredMessage: any;

  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;

  hideForManager: boolean = true;

  trackingNum2: string;

  constructor(
    public authService: AuthService,
    private http: Http,
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.headers12 = new Headers({ "Content-Type": "application/json" });
    this.headers12.append("Authorization", localStorage.getItem("token"));
    this.options = new RequestOptions({ headers: this.headers12 });
    this.trackingNum2 = "";

    if (localStorage.getItem("role") == "MANAGER") {
      this.hideForManager = false;
    }

    this.currentPage = 0;
    this.helloText = "hello";
    this.needPagination = false;
    this.isPageNumActive = false;
  }

  ngOnInit() {
    this.dataTable = {
      headerRow: [
        "Owner ID",
        "Chinese name",
        "Tracking Number",
        "Quantity",
        "Type",
        "Status",
        "Actions",
      ],

      dataRows: [],
    };
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

    return this.getListOfParcels();
  }

  getListOfParcels() {
    return this.http
      .get(GlobalVars.baseUrl + "/parcels/list", this.options)
      .subscribe(
        (response) => {
          this.allData = response.json().parcels;

          this.currentPage = response.json().currentPage;
          this.totalPages = response.json().totalPages;
          if (this.totalPages > 1) {
            this.needPagination = true;
            this.mypages = [""];
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

  getListOfParcelsWithSearch(searchkey: string) {
    if (searchkey == "") {
      this.currentPage = 0;
      this.getListOfParcels();
    } else {
      if (searchkey.length > 3) {
        this.http
          .get(
            GlobalVars.baseUrl + "/parcels/list?trackingNumber=" + searchkey,
            this.options
          )
          .subscribe(
            (response) => {
              this.allData = response.json().parcels;

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
  }

  getInfoOfParcel(me) {
    // console.log("ne is"+ me);
    this.trackingNum2 = me;
  }

  recordParcel() {
    // Swal.fire('Any fool can use a computer');

    swal
      .fire({
        title: "Scan the parcel",
        text: "Scan the parcel for registring in the system!",
        allowEnterKey: true,
        input: "text",
        showConfirmButton: false,
        //confirmButtonText: "Print",
        position: "top",
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        preConfirm: (valueB) => {
          this.http
            .post(
              GlobalVars.baseUrl + "/parcels/add?trackingNumber=" + valueB,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                this.getListOfParcels();
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          this.recordParcel();
        } else {
          swal.fire({
            icon: "warning",
            html: "FINISHED",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });

    /*
   
    Swal.fire({
      title: 'Scan the parcel',
    
      allowEnterKey: true,
      allowEscapeKey: true,
      showCancelButton: false,
      focusConfirm: true,
      html: '<div class="form-group">' +
        '<input id="input-trnum" type="text" class="form-control m-2" placeholder="Tracking Number" />' +
        '</div>',
      
      customClass: {
        confirmButton: 'btn btn-success',
      },
      
      buttonsStyling: false,
    
      preConfirm: (result) => {

        let trackingNum2 = $('#input-trnum').val();


        this.http.post(GlobalVars.baseUrl + '/parcels/add?trackingNumber=' + trackingNum2 , "", this.options)
          .subscribe(response => {

            if (response.json().status == 'error') {

              this.registredMessage = response.json().message;
              // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
              swal.fire('Not Added', this.registredMessage, 'error').then((result) => {
                if (result.isConfirmed) {
                  this.recordParcel();
                }
              }
              )
            } else {


              this.getListOfParcels();
              this.recordParcel();
            
            }
            this.recordParcel();
          }, error => {
            if (error.status == 400) {
              swal.fire('Not Added', "BAD REQUEST: WRONG TYPE OF INPUT", 'error').then((result) => {
                if (result.isConfirmed) {
                  this.recordParcel();
                }
              }
              )
            }

              if (error.status == 403) {
      
                this.authService.logout();
                
              }
          


          }
          )
      }
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.recordParcel();

      }
     // this.recordParcel();
    }); */
  }

  pagebyNum(ipage) {
    this.currentPage = ipage;
    this.isPageNumActive = true;
    this.getListOfParcels();
  }

  editParcel(trackingNumber, ownerID, foreignName, quantity, orderType) {
    swal
      .fire({
        title: "Edit the parcel",
        html:
          '<div class="form-group">' +
          '<input id="input-trnum" type="text" class="form-control m-2" readonly placeholder="Tracking Number" />' +
          '<input id="input-cnname" type="text" class="form-control m-2" placeholder="Name in Chinese" />' +
          '<div style="display:flex;"> <input  id="input-owid" type="text" class="form-control m-2" placeholder="Owner ID" />' +
          '<input  id="input-qnty" type="text" class="form-control m-2" placeholder="Quantity" />' +
          " </div>" +
          '<select class="custom-select m-2" id="types" name="types"> </select> ' +
          "</div>",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
        didOpen: () => {
          $("#input-trnum").val(trackingNumber);
          $("#input-cnname").val(foreignName);
          $("#input-owid").val(ownerID);
          $("#input-qnty").val(quantity);

          var options = [];
          for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
            options.push(
              '<option value="',
              GlobalVars.orderTypes[i].id,
              '">',
              GlobalVars.orderTypes[i].description_en,
              "</option>"
            );
          }
          $("#types").html(options.join(""));

          $("#types").val(orderType);
        },
        preConfirm: (result) => {
          let chineseName = $("#input-cnname").val();
          let ownerId = $("#input-owid").val();
          let quantityOfPar = $("#input-qnty").val();
          let typeOfParcel = $("#types").val();

          this.http
            .post(
              GlobalVars.baseUrl +
                "/orders/edit?tracking_number=" +
                trackingNumber +
                "&name_cn=" +
                chineseName +
                "&owner_id=" +
                ownerId +
                "&quantity=" +
                quantityOfPar +
                "&type=" +
                typeOfParcel,
              "",
              this.options
            )
            .subscribe(
              (response) => {
                if (response.json().status == "error") {
                  this.registredMessage = response.json().message;
                  // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
                  swal
                    .fire("Not Added", this.registredMessage, "error")
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                } else {
                  this.getListOfParcels();
                  return false;
                }
              },
              (error) => {
                if (error.status == 400) {
                  swal
                    .fire(
                      "Not Added",
                      "BAD REQUEST: WRONG TYPE OF INPUT",
                      "error"
                    )
                    .then((result) => {
                      if (result.isConfirmed) {
                      }
                    });
                }

                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          swal.fire({
            icon: "success",
            html: $("#input-trnum").val() + " is SUCCESSFULLY CHANGED!",
            customClass: {
              confirmButton: "btn btn-success",
            },
            buttonsStyling: false,
          });
        }
      });
  }

  deleteParcel(trNum) {
    swal
      .fire({
        title: "Are you sure to delete?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        confirmButtonText: "Yes, delete it!",
        buttonsStyling: false,
      })
      .then((result) => {
        if (result.value) {
          this.http
            .delete(
              GlobalVars.baseUrl + "/orders/delete?tracking_number=" + trNum,
              this.options
            )
            .subscribe(
              (response) => {
                swal.fire({
                  title: "Deleted!",
                  text: "Your file has been deleted.",
                  icon: "success",
                  customClass: {
                    confirmButton: "btn btn-success",
                  },
                  buttonsStyling: false,
                });

                this.getListOfParcels();
              },
              (error) => {
                if (error.status == 403) {
                  this.authService.logout();
                }
              }
            );
        }
      });
  }
}
