import { AuthService } from './../pages/login/auth.service';
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router  ) { }

  canActivate(){

    if (this.authService.isLoggedIn()==true) { return true; }

    this.router.navigate(['pages/login']);
    return false;

  }
}
