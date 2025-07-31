import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http, RequestOptions, Headers, Response  } from '@angular/http'
import { GlobalVars } from 'src/app/global-vars';
import swal from 'sweetalert2';


declare const $: any;

@Component({
  selector: 'app-checkparcel',
  templateUrl: './checkparcel.component.html',
  styleUrls: ['./checkparcel.component.css']
})

export class CheckparcelComponent implements OnInit, OnDestroy {

  inputValue: string = '';
  phoneNum:string = '';
  registredMessage:string;


  constructor( private router: Router,private http: Http, private httpClient: HttpClient ) {
 
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



    checkDelivery()
    {

      let headers12 = new Headers({'Content-Type': 'application/json'});
            headers12.append('Authorization',localStorage.getItem('token'));
           
    
            let options = new RequestOptions({ headers: headers12 },);




        this.http.post(GlobalVars.baseUrl + '/parcels/check?trackingNumber='+this.phoneNum,"", options)
        .subscribe(response => {
         
            if(response.json().status == "ok")
            {
                this.registredMessage = response.json().message;
                this.showAddNotification('top','center',2);
                return false; 
            } else
            {
                this.registredMessage = response.json().message;
                this.showAddNotification('top','center',4);
            }
        }, error => {
          if (error.status == 400) {
           
            this.registredMessage = error.json().message;
            this.showAddNotification('top','center',4);
           
          }
        }
        
        )


    }

    updateMyValue(phoneNum)
    {
      this.phoneNum = phoneNum;
    }

    
    
    showAddNotification(from: any, align: any, typecome: any) {
      const type = ['', 'info', 'success', 'warning', 'danger', 'rose', 'primary'];

      let cMessage = this.registredMessage;
      const color = Math.floor((Math.random() * 6) + 1);

      $.notify({
          icon: 'notifications',
          message:  cMessage
      }, {
          type: type[typecome],
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
