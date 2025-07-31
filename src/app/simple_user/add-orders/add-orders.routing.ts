import { AddOrdersComponent } from "./add-orders.component";
import { Routes } from "@angular/router";

export const addOrdersRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: AddOrdersComponent,
        data: {
          title: "Add order",
        },
      },
    ],
  },
];
