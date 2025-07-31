import { ExpressScanComponent } from "./express-scan/express-scan.component";
import { ManifestComponent } from "./manifest/manifest.component";
import { ForeignStaffAuthGuard } from "./../services/foreign-staff-auth-guard.service";

import { ParclesListComponent } from "./parcels-list/parcles-list.component";
import { DocPrintComponent } from "./doc-print/doc-print.component";
import { ConsignmentListComponent } from "./consignment-list/consignment-list.component";
import { Routes } from "@angular/router";
import { AdminAuthGuard } from "../services/admin-auth-guard.service";
import { ManagerAuthGuardService } from "../services/manager-auth-guard.service";
import { BigBoxesComponent } from "./big-boxes/big-boxes.component";

export const ForeignStaffRoutes: Routes = [
  {
    path: "",

    children: [
      {
        path: "consignmentlist",
        canActivate: [ForeignStaffAuthGuard],
        component: ConsignmentListComponent,
        data: {
          title: "Parties",
        },
      },
      {
        path: "docprint",
        canActivate: [ForeignStaffAuthGuard],
        component: DocPrintComponent,
        data: {
          title: "Doc Print",
        },
      },
      {
        path: "allparcelslist",
        canActivate: [ForeignStaffAuthGuard],
        component: ParclesListComponent,
        data: {
          title: "All Parcels",
        },
      },
      {
        path: "expressscan",
        canActivate: [ForeignStaffAuthGuard],
        component: ExpressScanComponent,
        data: {
          title: "Express Scan",
        },
      },
      {
        path: "manifestprint",
        canActivate: [ForeignStaffAuthGuard],
        component: ManifestComponent,
      },
      {
        path: "bigboxes",
        canActivate: [ForeignStaffAuthGuard],
        component: BigBoxesComponent,
      },
    ],
  },
];
