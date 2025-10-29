import { OrderBoxesComponent } from "./order-boxes.component";
import { Routes } from "@angular/router";

export const orderBoxesRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: OrderBoxesComponent,
        data: {
          title: "Jo'natmalar",
        },
      },
    ],
  },
];
