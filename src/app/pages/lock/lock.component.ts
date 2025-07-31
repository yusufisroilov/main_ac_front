import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http, RequestOptions, Headers, Response  } from '@angular/http'
import { GlobalVars } from 'src/app/global-vars';
import swal from 'sweetalert2';


declare const $: any;

@Component({
    selector: 'app-lock-cmp',
    templateUrl: './lock.component.html'
})

export class LockComponent implements OnInit, OnDestroy {

  inputValue: string = '';
  trackingNum:string = '';
  registredMessage:string;

  orderStatusDescriptionRU:string;
  orderStatusDescriptionUZ:string;
  trackingNumber:string;
  erMessage: string;
  comemessage: boolean;
  boxNumber: string;
  in_foreign_warehouse_date: string;
  in_foreign_airport_date: string;
  in_uzb_airport_date: string;
  in_uzb_warehouse_date: string;

  constructor( private router: Router,private http: Http, private httpClient: HttpClient ) {
    
    this.comemessage = false;

  }

    test: Date = new Date();
    ngOnInit() {
      const body = document.getElementsByTagName('body')[0];
      body.classList.add('lock-page');
      body.classList.add('off-canvas-sidebar');
      const card = document.getElementsByClassName('card')[0];
        setTimeout(function() {
            // after 1000 ms we add the class animated to the login/register card
            card.classList.remove('card-hidden');
        }, 700);
    }


    ngOnDestroy(){
      const body = document.getElementsByTagName('body')[0];
      body.classList.remove('lock-page');
      body.classList.remove('off-canvas-sidebar');

    }

    addPrefix(event) {
      this.inputValue = `998`
    }


    checkParcel(){

      this.comemessage = false;
      this.orderStatusDescriptionRU = '';
      this.orderStatusDescriptionUZ = '';
      this.trackingNumber = '';
      this.boxNumber = '';
      this.in_foreign_warehouse_date ='';
      this.in_foreign_airport_date = '';
      this.in_uzb_airport_date = '';
      this.in_uzb_warehouse_date = '';



      this.http.get(GlobalVars.baseUrl+'/orders/find?trackingNumber='+ this.trackingNum)
        .subscribe(response => {

          if(response.json().status == "ok") {
            
            this.comemessage = true;
            this.orderStatusDescriptionRU = response.json().orderStatusDescriptionRU;
            this.orderStatusDescriptionUZ = response.json().orderStatusDescriptionUZ;
            this.trackingNumber = response.json().trackingNumber;
            this.boxNumber = response.json().boxNumber;
            this.in_foreign_warehouse_date = response.json().in_foreign_warehouse_date;
            this.in_foreign_airport_date = response.json().in_foreign_airport_date;
            this.in_uzb_airport_date = response.json().in_uzb_airport_date;
            this.in_uzb_warehouse_date = response.json().in_uzb_warehouse_date;

          } else {
            this.comemessage = true;
            this.trackingNumber = response.json().message;

          }
         
        //  this.currentID = response.json().user_id;
        }, error => {
          
      })

     // console.log("me is + " + this.orderStatusDescriptionRU);

    }

   

    // sendSms()
    // {

    //   let headers12 = new Headers({'Content-Type': 'application/json'});
    //         headers12.append('Authorization',localStorage.getItem('token'));
           
    
    //         let options = new RequestOptions({ headers: headers12 },);




    //     this.http.post(GlobalVars.baseUrl + '/forgot_password?phone_number='+this.phoneNum,"", options)
    //     .subscribe(response => {
         
    //         if(response.json().status == "ok")
    //         {
    //             this.registredMessage = response.json().message;
    //             this.showAddNotification('top','center');

    //             this.router.navigate(['/pages/login']);
    //             return false; 
    //         } else
    //         {
    //             this.registredMessage = response.json().message;
    //             this.showAddNotification('top','center');
    //         }
    //     }, error => {
    //       if (error.status == 400) {
           
    //         this.registredMessage = error.json().message;
    //         this.showAddNotification('top','center');
           
    //       }
    //     }
        
    //     )


    // }

    updateMyValue(phoneNum)
    {
      this.trackingNum = phoneNum;
    }

    
    
    showAddNotification(from: any, align: any) {
      const type = ['', 'info', 'success', 'warning', 'danger', 'rose', 'primary'];

      let cMessage = this.registredMessage;
      const color = Math.floor((Math.random() * 6) + 1);

      $.notify({
          icon: 'notifications',
          message:  cMessage
      }, {
          type: type[2],
          timer: 3000,
          placement: {
              from: from,
              align: align
          },
          template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0} alert-with-icon" role="alert">' +
            '<button mat-raised-button type="button" aria-hidden="true" class="close" data-notify="dismiss">  <i class="material-icons">close</i></button>' +
            '<i class="material-icons" data-notify="icon">notifications</i> ' +
            '<span data-notify="title">{1}</span> ' +
            '<span data-notify="message">{2}</span>' +
            '<div class="progress" data-notify="progressbar">' +
              '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
            '</div>' +
            '<a href="{3}" target="{4}" data-notify="url"></a>' +
          '</div>'
      });
  }


}
