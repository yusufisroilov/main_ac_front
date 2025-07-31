import { RegisterComponent } from "./register.component";
import { Injectable } from "@angular/core";
import { Http, RequestOptions, Headers } from "@angular/http";
import "rxjs/add/operator/map";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GlobalVars } from "src/app/global-vars";

@Injectable()
export class RegService {
  invalidRegMessageS: string;
  invalidRegisterS: boolean;

  constructor(private http: Http, private httpClient: HttpClient) {}

  //  private options = { headers: new HttpHeaders().set('Content-Type', 'application/json') };

  register(credentials) {
    let headers = new Headers({ "Content-Type": "application/json" });
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers });

    return this.http
      .post(
        GlobalVars.baseUrl + "/register",
        JSON.stringify(credentials),
        options
      )
      .map((response) => {
        if (response.json().status == "error") {
          this.invalidRegMessageS = response.json().message;
          this.invalidRegisterS = true;
        } else {
          return true;
        }
      });
  }

  register3030(credentials) {
    let headers = new Headers({ "Content-Type": "application/json" });
    // headers.append('Content-Type', 'text/plain');
    // I didn't understand if you need this append.

    let options = new RequestOptions({ headers: headers });

    return this.http
      .post(
        GlobalVars.baseUrl + "/register",
        JSON.stringify(credentials),
        options
      )
      .map((response) => {
        if (response.json().status == "error") {
          this.invalidRegMessageS = response.json().message;
          this.invalidRegisterS = true;
        } else {
          return true;
        }
      });
  }
}
