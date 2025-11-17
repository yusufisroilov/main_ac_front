import { Routes } from "@angular/router";
import { AdminAuthGuard } from "src/app/services/admin-auth-guard.service";

import { OrdersComponent } from "./orders.component";

export const ordersRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: OrdersComponent,
        data: {
          title: "Buyurtmalar",
        },
      },
    ],
  },
];
