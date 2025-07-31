
import {AfterViewInit, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {UntypedFormControl, FormGroupDirective, NgForm, Validators, UntypedFormGroup } from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import 'rxjs/add/operator/map'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http, RequestOptions, Headers, Response  } from '@angular/http'
import { GlobalVars } from 'src/app/global-vars';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../pages/login/auth.service';


declare const $: any;

export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
      const isSubmitted = form && form.submitted;
      return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
  }
  
  @Component({
    selector: 'app-user-cmp',
    templateUrl: 'user.component.html'
})
export class UserComponent {

    type : UntypedFormGroup;
    id = localStorage.getItem('id');
    username = localStorage.getItem('username');
    firstname = localStorage.getItem('first_name');
    lastname = localStorage.getItem('last_name');
    matcher = new MyErrorStateMatcher();

    registredMessage: string;

    constructor(public authService: AuthService,private formBuilder: UntypedFormBuilder,private router: Router,private http: Http, private httpClient: HttpClient){

       
    }


    ngOnInit() {

        this.type = this.formBuilder.group({
            // To add a validator, we must first convert the string value into an array. The first item in the array is the default value if any, then the next item in the array is the validator. Here we are adding a required validator meaning that the firstName attribute must have a value in it.
            firstname: [null, Validators.required],
            lastname: [null, Validators.required],
            password: [null, Validators.required]
    
           });

    }

    changeUserInfo(credentials: any){

        let headers12 = new Headers({'Content-Type': 'application/json'});
            headers12.append('Authorization',localStorage.getItem('token'));
           
    
            let options = new RequestOptions({ headers: headers12 },);


        if(credentials.password=="") {



        this.http.post(GlobalVars.baseUrl + '/profile/edit?first_name='+ credentials.firstname + "&last_name="+ credentials.lastname, credentials ,options)
        .subscribe(response => {
         
            if(response.json().status == "ok")
            {
                this.registredMessage = response.json().message;
                this.showAddNotification('top','center');
                localStorage.setItem('first_name', credentials.firstname);
                localStorage.setItem('last_name', credentials.lastname);  

                this.router.navigate(['/dashboard']);
                return false; 
            }
        }, error => {
            if (error.status == 403) {
    
              this.authService.logout();
              
            }
        })
    } else{

        this.http.post(GlobalVars.baseUrl + '/profile/edit?first_name='+ credentials.firstname + "&last_name="+ credentials.lastname + "&password=" + credentials.password, credentials ,options)
        .subscribe(response => {
         
            if(response.json().status == "ok")
            {
                this.registredMessage = response.json().message;
                this.showAddNotification('top','center');
                localStorage.setItem('first_name', credentials.firstname);
                localStorage.setItem('last_name', credentials.lastname);  

                this.router.navigate(['/dashboard']);
                return false; 
            }
        }, error => {
            if (error.status == 403) {
    
              this.authService.logout();
              
            }
        })

    }

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
