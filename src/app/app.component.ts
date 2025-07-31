
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Http, RequestOptions, Headers, Response } from '@angular/http'
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { GlobalVars } from './global-vars';
import { Title } from '@angular/platform-browser';
import { filter, map } from "rxjs/operators";

@Component({
    selector: 'app-my-app',
    templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {
  private _router: Subscription;
  
  headers12: any;
  options: any;
  typeOfOrder: any[] = [];
  statusOfOrder: any[] = [];

  constructor( private router: Router,private http: Http, private httpClient: HttpClient, private activatedRoute: ActivatedRoute, private titleService: Title ) {

    this.typeOfOrder = [];
    this.statusOfOrder = [];

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
          let child = this.activatedRoute.firstChild;
          while (child) {
              if (child.firstChild) {
                  child = child.firstChild;
              } else if (child.snapshot.data &&    child.snapshot.data['title']) {
                  return child.snapshot.data['title'];
              } else {
                  return null;
              }
          }
          return null;
      })
  ).subscribe( (data: any) => {
      if (data) {
          this.titleService.setTitle(data + ' | AC');
      }
  });


      this.headers12 = new Headers({ 'Content-Type': 'application/json' });
      this.options = new RequestOptions({ headers: this.headers12 },);
     
      this.http.get(GlobalVars.baseUrl+'/order_types/list', this.options)
       .subscribe(response => {
      
           this.typeOfOrder = response.json().order_types;
           GlobalVars.orderTypes = response.json().order_types;
  
       })

       this.http.get(GlobalVars.baseUrl+'/order_status/list', this.options)
       .subscribe(response => {
      
           this.statusOfOrder = response.json().order_status;
           GlobalVars.orderStatus = response.json().order_status;
   
       })

  }

    ngOnInit() {
      this._router = this.router.events.filter(event => event instanceof NavigationEnd).subscribe((event: NavigationEnd) => {
        const body = document.getElementsByTagName('body')[0];
        const modalBackdrop = document.getElementsByClassName('modal-backdrop')[0];
        if (body.classList.contains('modal-open')) {
          body.classList.remove('modal-open');
          modalBackdrop.remove();
        }
      });
    }
}
