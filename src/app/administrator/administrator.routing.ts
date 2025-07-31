import { FinanceComponent } from './finance/finance.component';
import { ManagerAuthGuardService } from './../services/manager-auth-guard.service';
import { AllboxesComponent } from './allboxes/allboxes.component';
import { AllconsignmentsComponent } from './allconsignments/allconsignments.component';
import { AllordersComponent } from './allorders/allorders.component';
import { AllreceiversComponent } from './allreceivers/allreceivers.component';
import { UsersListComponent } from './users-list/users-list.component';

import { ForeignStaffAuthGuard } from './../services/foreign-staff-auth-guard.service';

import { Routes } from '@angular/router';
import { AdminAuthGuard } from '../services/admin-auth-guard.service';
import { InfoeachclientComponent } from './infoeachclient/infoeachclient.component';
import { EachboxdocComponent } from './eachboxdoc/eachboxdoc.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { TransactionsComponent } from './transactions/transactions.component';


export const AdminstratorRoutes: Routes = [

    {
        path: '',

        children: [ {
            path: 'allusers',
            canActivate: [ManagerAuthGuardService],
            component: UsersListComponent,
            data: {
                title: 'Mijozlar'
            }            
        }, {
            path: 'allreceivers',
            canActivate: [ManagerAuthGuardService],
            component: AllreceiversComponent,
            data: {
            title: 'Qabul qiluvchilar'
            }
        }, {
            path: 'allorders',
            canActivate: [ManagerAuthGuardService],
            component: AllordersComponent,
            data: {
                title: 'Buyurtmalar'
            }
        }, {
            path: 'allconsignments',
            canActivate: [ManagerAuthGuardService],
            component: AllconsignmentsComponent,
            data: {
                title: 'Partiyalar'
            }
        }, {
            path: 'allboxes',
            canActivate: [ManagerAuthGuardService],
            component: AllboxesComponent            ,
            data: {
                title: 'Partiya Jo\'natmalar'
            }
        },{
            path: 'finance',
            canActivate: [ManagerAuthGuardService],
            component: FinanceComponent,
            data: {
                title: 'Xisob Kitob'
            }
        }
        ,{
            path: 'infoeachclient',
            canActivate: [ManagerAuthGuardService],
            component: InfoeachclientComponent,
            data: {
                title: 'Har bir mijoz'
            }
        }
        ,{
            path: 'eachboxuz',
            canActivate: [ManagerAuthGuardService],
            component: EachboxdocComponent
            ,
            data: {
                title: 'Partiya Hujjati'
            }
        },{
            path: 'expences',
            canActivate: [ManagerAuthGuardService],
            component: ExpensesComponent,
            data: {
                title: 'Xarajatlar'
            }
        },
        {
            path: 'transactions',
            canActivate: [ManagerAuthGuardService],
            component: TransactionsComponent,
            data: {
                title: 'Tranzaksiyalar'
            }
        }
    
    ]
    }
];
