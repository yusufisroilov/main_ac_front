import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PrintCheckComponent } from "./print-check/print-check.component";

@NgModule({
  declarations: [PrintCheckComponent],
  imports: [CommonModule],
  exports: [PrintCheckComponent], // Export so other modules can use it
})
export class SharedModule {}
