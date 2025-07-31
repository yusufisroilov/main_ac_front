import { AllreceiversComponent } from './allreceivers/allreceivers.component';
import { AllordersComponent } from './allorders/allorders.component';
import { AllconsignmentsComponent } from './allconsignments/allconsignments.component';
import { AllboxesComponent } from './allboxes/allboxes.component';
import { UsersListComponent } from './users-list/users-list.component';

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../app.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminstratorRoutes } from './administrator.routing';
import { FinanceComponent } from './finance/finance.component';
import { InfoeachclientComponent } from './infoeachclient/infoeachclient.component';
import { EachboxdocComponent } from './eachboxdoc/eachboxdoc.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { TransactionsComponent } from './transactions/transactions.component';

// import { FlexLayoutModule } from '@angular/flex-layout';



@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminstratorRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
   
  ],
  declarations: [
   UsersListComponent,
   AllboxesComponent,
   AllconsignmentsComponent,
   AllordersComponent,
   AllreceiversComponent,
   FinanceComponent,
   InfoeachclientComponent,
   EachboxdocComponent,
   ExpensesComponent,
   TransactionsComponent

  ]
})

export class AdminstratorModule {}