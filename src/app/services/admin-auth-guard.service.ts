import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {

  constructor(
    private router: Router
  ) { }

  canActivate(){

    let isAdmin = localStorage.getItem('role');

    if(isAdmin == "ADMIN")
     {
       return true;
      
    }

    this.router.navigate(['/dashboard']);
    return false;

  }
}
