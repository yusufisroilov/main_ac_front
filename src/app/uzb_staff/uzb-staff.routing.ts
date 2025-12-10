import { ScanParcelUzbComponent } from "./scan-parcel-uzb/scan-parcel-uzb.component";
import { ReceiversListComponent } from "./receivers-list/receivers-list.component";
import { UzParclesListComponent } from "./parcles-list/parcles-list.component";

import { Routes } from "@angular/router";
import { ManagerAuthGuardService } from "../services/manager-auth-guard.service";
import { DeliveriesComponent } from "./deliveries/deliveries.component";
import { AdminAuthGuard } from "../services/admin-auth-guard.service";
import { EmployeeAuthGuardService } from "../services/employee-auth-guard.service";
import { EmployeeFinanceComponent } from "./employee-finance/employee-finance.component";
import { DeliveriesListComponent2 } from "./deliveries-list-2/deliveries-list-2.component";
import { InfoeachClientAdminComponent } from "./infoeach-client-admin/infoeach-client-admin.component";

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
        path: "employee-finance",
        canActivate: [EmployeeAuthGuardService],
        component: EmployeeFinanceComponent,
      },
      {
        path: "deliveries-list2",
        canActivate: [EmployeeAuthGuardService],
        component: DeliveriesListComponent2,
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
        path: "each-client-admin",
        component: InfoeachClientAdminComponent,
      },
      {
        path: "scanuz",
        component: ScanParcelUzbComponent,
      },
    ],
  },
];
