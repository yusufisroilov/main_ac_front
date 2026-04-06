
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
    showPassword: boolean = false;
    showConfirmPassword: boolean = false;

    constructor(public authService: AuthService,private formBuilder: UntypedFormBuilder,private router: Router,private http: Http, private httpClient: HttpClient){

       
    }


    ngOnInit() {

        this.type = this.formBuilder.group({
            password: [null],
            confirmPassword: [null],
           });

    }

    changeUserInfo(credentials: any){

        if (!credentials.password || credentials.password.trim() === "") {
            $.notify({
                icon: 'notifications',
                message: 'Yangi parolni kiriting!'
            }, { type: 'warning', timer: 3000, placement: { from: 'top', align: 'center' } });
            return;
        }

        if (credentials.password !== credentials.confirmPassword) {
            $.notify({
                icon: 'notifications',
                message: 'Parollar mos kelmaydi!'
            }, { type: 'danger', timer: 3000, placement: { from: 'top', align: 'center' } });
            return;
        }

        let headers12 = new Headers({'Content-Type': 'application/json'});
        headers12.append('Authorization', localStorage.getItem('token'));
        let options = new RequestOptions({ headers: headers12 });

        this.http.post(GlobalVars.baseUrl + '/profile/edit?password=' + credentials.password, '', options)
        .subscribe(response => {
            if(response.json().status == "ok") {
                this.registredMessage = response.json().message;
                this.showAddNotification('top','center');
                this.router.navigate(['/dashboard']);
            } else {
                $.notify({
                    icon: 'notifications',
                    message: response.json().message || 'Xatolik yuz berdi'
                }, { type: 'danger', timer: 3000, placement: { from: 'top', align: 'center' } });
            }
        }, error => {
            if (error.status == 403) {
                this.authService.logout();
            } else {
                const msg = error.json?.()?.message || 'Parolni o\'zgartirishda xatolik';
                $.notify({ icon: 'notifications', message: msg }, { type: 'danger', timer: 3000, placement: { from: 'top', align: 'center' } });
            }
        });
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
