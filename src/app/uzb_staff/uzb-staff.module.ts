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

import { FixedpluginModule } from "src/app/shared/fixedplugin/fixedplugin.module";
import { ComponentsModule } from "src/app/components/components.module";
import { PaginationComponent } from "../shared/pagination/pagination.component";
import { PaginationModule } from "../shared/pagination/pagination.module";
import { InfoeachClientAdminComponent } from "./infoeach-client-admin/infoeach-client-admin.component";
import { OwnCourierDeliveriesComponent } from "./own-courier-deliveries/own-courier-deliveries.component";
import { PickupDeliveriesComponent } from "./pickup-deliveries/pickup-deliveries.component";
import { EmuDeliveriesComponent } from "./emu-deliveries/emu-deliveries.component";
import { YandexDeliveriesComponent } from "./yandex-deliveries/yandex-deliveries.component";
import { SharedModule } from "src/app/shared/shared.module";
import { CargoTariffsComponent } from "./cargo-tariffs/cargo-tariffs.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(UzbStaffRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    FixedpluginModule,
    ComponentsModule,
    PaginationModule,
    SharedModule,
  ],
  declarations: [
    BoxesListComponent,
    UzParclesListComponent,
    ScanParcelUzbComponent,
    DeliveriesComponent,
    EmployeeFinanceComponent,
    DeliveriesListComponent2,
    InfoeachClientAdminComponent,
    OwnCourierDeliveriesComponent,
    PickupDeliveriesComponent,
    EmuDeliveriesComponent,
    YandexDeliveriesComponent,
    CargoTariffsComponent,
  ],
})
export class UzbStaffModule {}
