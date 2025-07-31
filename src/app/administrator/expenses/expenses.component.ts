
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalVars, StatusOfOrder, TypesOfOrder } from 'src/app/global-vars';
import swal from 'sweetalert2';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http, RequestOptions, Headers, Response } from '@angular/http'
import { AuthService } from 'src/app/pages/login/auth.service';

declare interface DataTable {
  headerRow: string[];
  dataRows: string[][];
}

declare const $: any;

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {

  public dataTable: DataTable;
  trackingNum: string;
  headers12: any;
  options: any;
  allExpenses: any;
  helloText: string;
  registredMessage: any;
  trackingNum2: any;
  
  currentPage: number;
  totalPages: number;
  needPagination: boolean;
  mypages = [];
  isPageNumActive: boolean;



  constructor(private http: Http, private httpClient: HttpClient,private router: Router,public authService: AuthService) { 

  
    this.headers12 = new Headers({ 'Content-Type': 'application/json' });
    this.headers12.append('Authorization', localStorage.getItem('token'));
    this.options = new RequestOptions({ headers: this.headers12 },);
    

    this.currentPage = 0;
    this.helloText = "hello"
    this.needPagination = false;
    this.isPageNumActive = false;


  }



  ngOnInit(): void {
    this.dataTable = {
      headerRow: [ 'User ID', 'Rec ID', 'Phone number', 'Full name', 'Pasport num','Address', 'Amallar'],

      dataRows: [  ]
    };
  }


  pagebyNum(ipage){

    this.currentPage = ipage;
    this.isPageNumActive = true;
    document.getElementById("listcard").scrollIntoView();
    this.getListOfExpenses();

  }
  
  getListOfExpenses(){
   

    return  this.http.get(GlobalVars.baseUrl+'/expenses/list?page='+ this.currentPage+'&size=200', this.options)
      .subscribe(response => {
        this.allExpenses = response.json().expenses;
        this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        } 

      }, error => {
        if (error.status == 403) {

          this.authService.logout();
          
        }
    })
  }


  getListOfRecsWithFilter(parentId, partiya){
    

   let filterLink = '&customerID='+parentId+"&consignment="+partiya;
    return  this.http.get(GlobalVars.baseUrl+'/expenses/list?page'+ this.currentPage+'&size=100'+filterLink, this.options)
      .subscribe(response => {
        this.allExpenses = response.json().expenses;
       this.currentPage = response.json().currentPage;
        this.totalPages = response.json().totalPages;
        if (this.totalPages > 1) {
          this.needPagination = true;

          for(let i=0; i<this.totalPages;i++){
            this.mypages[i] = {id: "name"};

          }
        }

      }, error => {
        if (error.status == 403) {

          this.authService.logout();
          
        }
    })
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


  addExpense()
  {

    swal.fire({
      title: 'Qaytarilgan Xarajat qo\'shish!',
      html: '<div class="form-group">' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Mijoz:</label><input id="input-customerid" type="text" class="form-control m-2" placeholder="ID si" /> </div>' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Plastik:</label><input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIK" /> </div>' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Naqd:</label><input  id="input-cash" type="text" class="form-control m-2" placeholder="NAQD" /> </div> ' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">USD $:</label>  <input  id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORDA" /> </div>' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Partiya:</label>  <input  id="input-cons" type="text" class="form-control m-2" placeholder="PARTIYA" /> </div>' + 
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Izoh:</label> <input  id="input-comment" type="text" class="form-control m-2" placeholder="Izoh" /> </div> ' + 
        '</div>',
      showCancelButton: true,
      confirmButtonText: "Qo'shish",
      cancelButtonText: "No",
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger',
      },
      buttonsStyling: false,
      didOpen: () => {
       
 
     
        // var options = [];
        // for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
        //     options.push('<option value="',
        //     GlobalVars.orderTypes[i].id, '">',
        //     GlobalVars.orderTypes[i].descriptionEn, '</option>');
        // } 
        // $("#types").html(options.join(''));
     
        // $('#types').val(orderType);

        
      },
      preConfirm: (result) => {

        

        let userid = $('#input-customerid').val();
        let usd2 = $('#input-usd').val();
        let cash2 = $('#input-cash').val();
        let card2 = $('#input-card').val();
        let comment = $('#input-comment').val();
        let consignment = $('#input-cons').val();

        this.http.post(GlobalVars.baseUrl + '/expenses/add?customerID=' + userid + '&plastic=' + card2 + '&cash=' + cash2 + '&usd=' + usd2 + '&consignment=' + consignment + '&comment=' + comment  , "", this.options)
          .subscribe(response => {

            if (response.json().status == 'error') {

              this.registredMessage = response.json().message;
              // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
              swal.fire('Not Added', this.registredMessage, 'error').then((result) => {
                if (result.isConfirmed) {
                
                }
              }
              )
            } else {

              this.getListOfExpenses();
              return false;
            }

          }, error => {
            if (error.status == 400) {
              swal.fire('Not Added', "BAD REQUEST: WRONG TYPE OF INPUT", 'error').then((result) => {
                if (result.isConfirmed) {
             
                }
              }
              )
            }
          }
          )
      }
    }).then((result) => {
      if (result.isConfirmed) {
        swal.fire({
          icon: 'success',
          html: $('#input-trnum').val() +' is SUCCESSFULLY CHANGED!',
          customClass: {
            confirmButton: 'btn btn-success',
          },
          buttonsStyling: false
        });


      }

    });
  }

  
  editExpense(idd,customerid,card,cash,usd,cons,comment)
  {

    swal.fire({
      title: 'Qaytarilgan Xarajat qo\'shish!',
      html: '<div class="form-group">' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Mijoz:</label><input id="input-customerid" type="text" class="form-control m-2" placeholder="ID si" /> </div>' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Plastik:</label><input id="input-card" type="text" class="form-control m-2" placeholder="PLASTIK" /> </div>' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Naqd:</label><input  id="input-cash" type="text" class="form-control m-2" placeholder="NAQD" /> </div> ' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">USD $:</label>  <input  id="input-usd" type="text" class="form-control m-2" placeholder="DOLLORDA" /> </div>' +
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Partiya:</label>  <input  id="input-cons" type="text" class="form-control m-2" placeholder="PARTIYA" /> </div>' + 
        '<div class="form-group" style="display: block ruby;"><label for="input-card">Izoh:</label> <input  id="input-comment" type="text" class="form-control m-2" placeholder="Izoh" /> </div> ' + 
        '</div>',
      showCancelButton: true,
      confirmButtonText: "Qo'shish",
      cancelButtonText: "No",
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger',
      },
      buttonsStyling: false,
      didOpen: () => {
       
        $('#input-customerid').val(customerid);
        $('#input-usd').val(usd);
        $('#input-cash').val(cash);
        $('#input-card').val(card);
        $('#input-cons').val(cons);
        $('#input-comment').val(comment);
     
        // var options = [];
        // for (var i = 0; i < GlobalVars.orderTypes.length; i++) {
        //     options.push('<option value="',
        //     GlobalVars.orderTypes[i].id, '">',
        //     GlobalVars.orderTypes[i].descriptionEn, '</option>');
        // } 
        // $("#types").html(options.join(''));
     
        // $('#types').val(orderType);

        
      },
      preConfirm: (result) => {

        

        let userid = $('#input-customerid').val();
        let usd2 = $('#input-usd').val();
        let cash2 = $('#input-cash').val();
        let card2 = $('#input-card').val();
        let comment = $('#input-comment').val();
        let consignment = $('#input-cons').val();

        this.http.post(GlobalVars.baseUrl + '/expenses/edit?&id='+idd+'&customerID=' + userid + '&plastic=' + card2 + '&cash=' + cash2 + '&usd=' + usd2 + '&consignment=' + consignment + '&comment=' + comment  , "", this.options)
          .subscribe(response => {

            if (response.json().status == 'error') {

              this.registredMessage = response.json().message;
              // swal.showValidationMessage('Not Added, check: ' + this.registredMessage);
              swal.fire('Not Added', this.registredMessage, 'error').then((result) => {
                if (result.isConfirmed) {
                
                }
              }
              )
            } else {

              this.getListOfExpenses();
              return false;
            }

          }, error => {
            if (error.status == 400) {
              swal.fire('Not Added', "BAD REQUEST: WRONG TYPE OF INPUT", 'error').then((result) => {
                if (result.isConfirmed) {
             
                }
              }
              )
            }
          }
          )
      }
    }).then((result) => {
      if (result.isConfirmed) {
        swal.fire({
          icon: 'success',
          html: $('#input-trnum').val() +' is SUCCESSFULLY CHANGED!',
          customClass: {
            confirmButton: 'btn btn-success',
          },
          buttonsStyling: false
        });


      }

    });
  }

  //DELETE READY
  deletetExpense(rowid){

    swal.fire({
      title: 'Bu Xarajat nomer: ' + rowid + 'ni o\'chirishni hohlaysizmi?',
      showCancelButton: true,
      confirmButtonText: `Ha, shunday`,
      denyButtonText: `Yo'q`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {

        this.http.post(GlobalVars.baseUrl + '/expenses/delete?id='+rowid,'', this.options)
        .subscribe(response => {
    
          if(response.json().status == "ok")
          {
    
            swal.fire('O\'chirildi', '', 'success');
              this.getListOfExpenses();
    
          }else {
    
            swal.fire('Error happaned!', response.json().message, 'error').then((result) => { } );
          }
    
        }, error => {
          if (error.status == 403) {
  
            this.authService.logout();
            
          }
      })

      } else if (result.isDenied) {
        swal.fire('O\'zgarmadi', '', 'info')
      }
    })

   


  }


  ngAfterViewInit()
  {
      return this.getListOfExpenses();
  }
  

}
