import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { PaginationComponent } from "./pagination.component";
import { FormsModule } from "@angular/forms";

@NgModule({
  imports: [RouterModule, CommonModule, FormsModule],
  declarations: [PaginationComponent],
  exports: [PaginationComponent],
})
export class PaginationModule {}
