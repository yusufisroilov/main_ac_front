import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';

declare var $: any;

@Component({
    selector: 'app-login-cmp',
    templateUrl: './login.component.html'
})

export class LoginComponent implements OnInit, OnDestroy {
   
    invalidLogin: boolean;

    inputValue: string = '';

    test: Date = new Date();
    private toggleButton: any;
    private sidebarVisible: boolean;
    private nativeElement: Node;

    constructor(private element: ElementRef, private router: Router, private authService: AuthService) {
        this.nativeElement = element.nativeElement;
        this.sidebarVisible = false;    
        this.invalidLogin = false;
    }

    addPrefix(event) {
        this.inputValue = `998`;
      }


    signIn(credentials: any)
    {
        this.authService.login(credentials)
        .subscribe( result => {
            if (result) {
                this.router.navigate(['/dashboard']);
                this.authService.isLoggedIn();
                return false;
             
                
                //sdsdsds
            }
            else {
               // this.showNotification('top','center');

                this.invalidLogin = true;
            } 
        }, error => {
            if (error.status == 403) {
                
               // this.showNotification('bottom','center');
                this.invalidLogin = true;
                setTimeout(() => {
                    this.invalidLogin = false;
               }, 4000)
                
                //sdsdsds
            }
        }
        
        
        );
    }


    ngOnInit() {
        var navbar : HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];
        const body = document.getElementsByTagName('body')[0];
        body.classList.add('login-page');
        body.classList.add('off-canvas-sidebar');
        const card = document.getElementsByClassName('card')[0];
        setTimeout(function() {
            // after 1000 ms we add the class animated to the login/register card
            card.classList.remove('card-hidden');
        }, 700);
    }
    sidebarToggle() {
        var toggleButton = this.toggleButton;
        var body = document.getElementsByTagName('body')[0];
        var sidebar = document.getElementsByClassName('navbar-collapse')[0];
        if (this.sidebarVisible == false) {
            setTimeout(function() {
                toggleButton.classList.add('toggled');
            }, 500);
            body.classList.add('nav-open');
            this.sidebarVisible = true;
        } else {
            this.toggleButton.classList.remove('toggled');
            this.sidebarVisible = false;
            body.classList.remove('nav-open');
        }
    }
    ngOnDestroy(){
      const body = document.getElementsByTagName('body')[0];
      body.classList.remove('login-page');
      body.classList.remove('off-canvas-sidebar');
    }

    showNotification(from: any, align: any) {
        const type = ['', 'info', 'success', 'warning', 'danger', 'rose', 'primary'];

        const color = Math.floor((Math.random() * 6) + 1);

        $.notify({
            icon: 'notifications',
            message: 'Siz Noto\'g\'ri login yoki parol kiritdingiz.'
        }, {
            type: type[4],
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
