CustomerDashboardComponent;
import { Routes } from "@angular/router";
import { CustomerDashboardComponent } from "./customer-dashboard.component";

export const customerDashboardRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: CustomerDashboardComponent,
        data: {
          title: "Dashboard",
        },
      },
    ],
  },
];
