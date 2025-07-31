import { Routes } from '@angular/router';

import { RegisterComponent } from './register/register.component';
import { PricingComponent } from './pricing/pricing.component';
import { LockComponent } from './lock/lock.component';
import { LoginComponent } from './login/login.component';
import { CheckparcelComponent } from './checkparcel/checkparcel.component';

export const PagesRoutes: Routes = [

    {
        path: '',
        children: [ 
              
        {
            path: 'lock',
            component: LockComponent
        },
            {
            path: 'login',
            component: LoginComponent
        }, 
      
        {
            path: 'register',
            component: RegisterComponent
        }, 
         {
            path: 'pricing',
            component: PricingComponent
        },{
            path: 'checkdelivery',
            component: CheckparcelComponent
        }
    
    ]
    }
];
