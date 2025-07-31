import {Injectable, OnInit} from '@angular/core'
import { Http, RequestOptions, Headers } from '@angular/http'
import 'rxjs/add/operator/map'
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from "@auth0/angular-jwt";

import { from } from 'rxjs';

@Injectable()
export class ForeignStaffService implements OnInit{
   
    headers1 = new Headers({'Content-Type': 'application/json'});

    constructor (private http: Http, private httpClient: HttpClient)
    {
      
    
    }

    

    ngOnInit() {
   
    this.headers1.append('Authorization', localStorage.getItem('token'));
    let options = new RequestOptions({ headers: this.headers1 },);

    }

    consignmentList()
    {


    }

    

}