import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ConsignmentTrackingComponent } from "./consignment-tracking.component";

@NgModule({
  declarations: [ConsignmentTrackingComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: "", component: ConsignmentTrackingComponent },
    ]),
  ],
})
export class ConsignmentTrackingModule {}
