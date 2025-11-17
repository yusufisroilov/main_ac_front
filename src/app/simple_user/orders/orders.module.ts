import { OrdersComponent } from "./orders.component";
import { ordersRoutes } from "./orders.routing";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { FormsModule, NgModel, ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from "src/app/app.module";
import { MdModule } from "src/app/md/md.module";
import { PaginationModule } from "src/app/shared/pagination/pagination.module";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ordersRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    PaginationModule,
  ],
  declarations: [OrdersComponent],
})
export class OrdersModule {}
