import { GlobalVars } from "src/app/global-vars";
import { Injectable } from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import "rxjs/add/operator/map";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable()
export class DeliveryService {
  checkPassportMessageS: string;
  registredMessageS: string; // This is for storing message came from server when someone adds receiver

  constructor(private http: Http, private httpClient: HttpClient) {}

  //  private options = { headers: new HttpHeaders().set('Content-Type', 'application/json') };

  addDelivery(credentials) {
    let headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Authorization", localStorage.getItem("token"));
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers });

    // return this.http.post(GlobalVars.baseUrl + '/delivery/add',
    // JSON.stringify(credentials), options)
    // .map(response =>{
    //     let result = response.json();
    //     if(result.status == 'error')
    //     {
    //         this.checkPassportMessageS = result.message;
    //         return false;
    //     }
    //     else if (result )
    //     {
    //         //localStorage.setItem('bizgaxat', result.message);
    //         this.registredMessageS = result.message;

    //         return true;
    //     }
    //     return false;

    // });

    //}
  }
}
