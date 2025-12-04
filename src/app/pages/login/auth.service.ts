import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import { HttpClient } from "@angular/common/http";
import { JwtHelperService } from "@auth0/angular-jwt";

import { from } from "rxjs";
import { GlobalVars } from "src/app/global-vars";

@Injectable()
export class AuthService {
  constructor(private http: HttpClient) {}

  login(credentials: any) {
    return this.http
      .post<any>(GlobalVars.baseUrl + "/login", credentials)
      .map((response) => {
        if (response && response.token) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("id", response.id.toString());
          localStorage.setItem("username", response.username);
          localStorage.setItem("role", response.role);
          localStorage.setItem("first_name", response.first_name);
          localStorage.setItem("last_name", response.last_name);
          //localStorage.setItem("current_party", response.current_party);
          GlobalVars.currentParty = response.current_party;
          return true;
        }
        return false;
      });
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    localStorage.removeItem("editpr");
    localStorage.removeItem("recid");
    // localStorage.removeItem("current_party");
    localStorage.removeItem("current_box");
    localStorage.removeItem("labelsTemp1");
    localStorage.removeItem("labelsTemp2");
    localStorage.removeItem("token_fin");
  }

  isLoggedIn() {
    const helper = new JwtHelperService();
    let ourtoken = localStorage.getItem("token");

    if (!ourtoken) {
      return false;
    }

    const isExpired = helper.isTokenExpired(ourtoken);
    return !isExpired;
  }

  get currentuser() {
    let token = localStorage.getItem("token");
    if (!token) return null;

    // return new JwtHelper().decodeToken(token);
  }

  getRole() {
    return localStorage.getItem("role");
  }
}
