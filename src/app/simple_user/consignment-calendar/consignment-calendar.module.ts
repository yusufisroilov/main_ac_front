import { ConsignmentCalendarComponent } from "./consignment-calendar.component";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from "src/app/app.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
  ],
  declarations: [ConsignmentCalendarComponent],
  exports: [ConsignmentCalendarComponent],
})
export class ConsignmentCalendarModule {}
