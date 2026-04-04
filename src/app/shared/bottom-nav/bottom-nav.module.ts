import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { BottomNavComponent } from "./bottom-nav.component";

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [BottomNavComponent],
  exports: [BottomNavComponent],
})
export class BottomNavModule {}
