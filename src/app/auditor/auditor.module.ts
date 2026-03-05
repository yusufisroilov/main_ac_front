import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MaterialModule } from "../app.module";
import { PaginationModule } from "../shared/pagination/pagination.module";
import { AuditorRoutes } from "./auditor.routing";
import { AuditPendingComponent } from "./pending-payments/pending-payments.component";
import { AuditApprovedComponent } from "./approved-payments/approved-payments.component";
import { AuditSuspiciousComponent } from "./suspicious-payments/suspicious-payments.component";
import { AuditRejectedComponent } from "./rejected-payments/rejected-payments.component";

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuditorRoutes),
    FormsModule,
    MaterialModule,
    PaginationModule,
  ],
  declarations: [
    AuditPendingComponent,
    AuditApprovedComponent,
    AuditSuspiciousComponent,
    AuditRejectedComponent,
  ],
})
export class AuditorModule {}
