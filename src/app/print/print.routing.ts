import { LabelComponent } from './label/label.component';
import { ForeignStaffAuthGuard } from './../services/foreign-staff-auth-guard.service';

import { Routes } from '@angular/router';
import { AdminAuthGuard } from '../services/admin-auth-guard.service';
import { PrintLayoutComponent } from './print-layout/print-layout.component';


export const PrintRoutes: Routes = [

    {

    path: '',
    //component: PrintLayoutComponent,
    children: [ {
        path: 'label',
        component: LabelComponent,
        
    }]
       
    }
];