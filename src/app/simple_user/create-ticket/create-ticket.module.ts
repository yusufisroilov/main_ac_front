import { AddReceiversComponent } from "../add-receivers/add-receivers.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { createTicketRoutes } from "./create-ticket.routing";
import { FormsModule } from "@angular/forms";
import { MaterialModule } from "src/app/app.module";
import { MdModule } from "src/app/md/md.module";
import { ReactiveFormsModule } from "@angular/forms";
import { NouisliderModule } from "ng2-nouislider";
import { TagInputModule } from "ngx-chips";
import { CustomerCreateTicketComponent } from "./create-ticket.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(createTicketRoutes),
    FormsModule,
    ReactiveFormsModule,
    NouisliderModule,
    TagInputModule,
    MaterialModule,
  ],
  declarations: [CustomerCreateTicketComponent],
})
export class CustomerCreateTicketModule {}
