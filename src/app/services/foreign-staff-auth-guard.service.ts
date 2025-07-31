import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ForeignStaffAuthGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(){

    let isAdmin = localStorage.getItem('role');

    if(isAdmin == "CHINASTAFF" || isAdmin == "ADMIN" || isAdmin == "MANAGER"  || isAdmin == "UZBSTAFF" )
     {

       return true;
      
    }


    this.router.navigate(['/dashboard']);
    return false;

  }
}
