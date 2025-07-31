import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ManagerAuthGuardService {

  constructor(private router: Router) { }

  canActivate(){

    let isAdmin = localStorage.getItem('role');

    if(isAdmin == "MANAGER" || isAdmin == "UZBSTAFF")
     {
       return true;
      
    } else {


    this.router.navigate(['/dashboard']);
    return false;
  }

  }

}
