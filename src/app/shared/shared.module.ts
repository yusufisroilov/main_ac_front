import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PrintCheckComponent } from "./print-check/print-check.component";
import { TzDatePipe } from "./pipes/tz-date.pipe";

@NgModule({
  declarations: [PrintCheckComponent, TzDatePipe],
  imports: [CommonModule],
  exports: [PrintCheckComponent, TzDatePipe], // Export so other modules can use it
})
export class SharedModule {}
