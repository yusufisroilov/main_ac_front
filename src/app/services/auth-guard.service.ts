import { AuthService } from './../pages/login/auth.service';
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot){

    if (this.authService.isLoggedIn()==true) { return true; }

    // Save the URL the user was trying to access
    localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['pages/login']);
    return false;

  }
}
