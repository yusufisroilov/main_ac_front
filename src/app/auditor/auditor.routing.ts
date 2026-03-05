import { Routes } from "@angular/router";
import { AuditorAuthGuardService } from "../services/auditor-auth-guard.service";
import { AuditPendingComponent } from "./pending-payments/pending-payments.component";
import { AuditApprovedComponent } from "./approved-payments/approved-payments.component";
import { AuditSuspiciousComponent } from "./suspicious-payments/suspicious-payments.component";
import { AuditRejectedComponent } from "./rejected-payments/rejected-payments.component";

export const AuditorRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "pending-payments",
        canActivate: [AuditorAuthGuardService],
        component: AuditPendingComponent,
        data: { title: "Kutilayotgan To'lovlar" },
      },
      {
        path: "approved-payments",
        canActivate: [AuditorAuthGuardService],
        component: AuditApprovedComponent,
        data: { title: "Tasdiqlangan To'lovlar" },
      },
      {
        path: "suspicious-payments",
        canActivate: [AuditorAuthGuardService],
        component: AuditSuspiciousComponent,
        data: { title: "Shubhali To'lovlar" },
      },
      {
        path: "rejected-payments",
        canActivate: [AuditorAuthGuardService],
        component: AuditRejectedComponent,
        data: { title: "Rad Etilgan To'lovlar" },
      },
    ],
  },
];
