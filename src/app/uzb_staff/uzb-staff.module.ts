import { ScanParcelUzbComponent } from "./scan-parcel-uzb/scan-parcel-uzb.component";
import { UzParclesListComponent } from "./parcles-list/parcles-list.component";
import { BoxesListComponent } from "./boxes-list/boxes-list.component";

import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "../app.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UzbStaffRoutes } from "./uzb-staff.routing";
import { DeliveriesComponent } from "./deliveries/deliveries.component";
import { EmployeeFinanceComponent } from "./employee-finance/employee-finance.component";
import { DeliveriesListComponent2 } from "./deliveries-list-2/deliveries-list-2.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(UzbStaffRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
  ],
  declarations: [
    BoxesListComponent,
    UzParclesListComponent,
    ScanParcelUzbComponent,
    DeliveriesComponent,
    EmployeeFinanceComponent,
    DeliveriesListComponent2,
  ],
})
export class UzbStaffModule {}
