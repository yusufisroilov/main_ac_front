import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { ConsignmentCalendarModule } from "./consignment-calendar.module";
import { ConsignmentCalendarPageComponent } from "./consignment-calendar-page.component";

const routes: Routes = [
  { path: "", component: ConsignmentCalendarPageComponent },
];

@NgModule({
  imports: [
    CommonModule,
    ConsignmentCalendarModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ConsignmentCalendarPageComponent],
})
export class ConsignmentCalendarPageModule {}
