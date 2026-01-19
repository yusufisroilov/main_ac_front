import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MaterialModule } from "src/app/app.module";
import { customerDashboardRoutes } from "./customer-dashboard.routing";
import { CustomerDashboardComponent } from "./customer-dashboard.component";
import { ConsignmentCalendarModule } from "../consignment-calendar/consignment-calendar.module";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(customerDashboardRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    ConsignmentCalendarModule,
  ],
  declarations: [CustomerDashboardComponent],
})
export class customerDashboardModule {}
