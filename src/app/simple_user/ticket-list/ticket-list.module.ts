import { AddReceiversComponent } from "../add-receivers/add-receivers.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { FormsModule } from "@angular/forms";
import { MaterialModule } from "src/app/app.module";
import { MdModule } from "src/app/md/md.module";
import { ReactiveFormsModule } from "@angular/forms";
import { NouisliderModule } from "ng2-nouislider";
import { TagInputModule } from "ngx-chips";
import { customerTicketListRoutes } from "./ticket-detail.routing";
import { CustomerTicketListComponent } from "./ticket-list.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(customerTicketListRoutes),
    FormsModule,
    ReactiveFormsModule,
    NouisliderModule,
    TagInputModule,
    MaterialModule,
  ],
  declarations: [CustomerTicketListComponent],
})
export class CustometTicketsListModule {}
