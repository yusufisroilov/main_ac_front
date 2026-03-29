import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { MaterialModule } from "../../app.module";
import { CustomerServicesComponent } from "./customer-services.component";

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  declarations: [CustomerServicesComponent],
  exports: [CustomerServicesComponent],
})
export class CustomerServicesModule {}
