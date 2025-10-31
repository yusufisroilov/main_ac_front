import { ScanParcelUzbComponent } from "./scan-parcel-uzb/scan-parcel-uzb.component";
import { ReceiversListComponent } from "./receivers-list/receivers-list.component";
import { UzParclesListComponent } from "./parcles-list/parcles-list.component";

import { Routes } from "@angular/router";
import { ManagerAuthGuardService } from "../services/manager-auth-guard.service";
import { DeliveriesComponent } from "./deliveries/deliveries.component";
import { AdminAuthGuard } from "../services/admin-auth-guard.service";

export const UzbStaffRoutes: Routes = [
  {
    path: "",

    children: [
      {
        path: "uzparcelslist",
        canActivate: [AdminAuthGuard],
        component: UzParclesListComponent,
      },
      {
        path: "deliveries",
        canActivate: [ManagerAuthGuardService],
        component: DeliveriesComponent,
        data: {
          title: "Yetkazmalar",
        },
      },
      {
        path: "receiverslist",
        component: ReceiversListComponent,
      },
      {
        path: "scanuz",

        component: ScanParcelUzbComponent,
      },
    ],
  },
];
