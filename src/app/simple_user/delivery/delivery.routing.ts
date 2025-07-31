import { Routes } from "@angular/router";
import { DeliveryComponent } from "./delivery.component";

export const deliveryRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: DeliveryComponent,
        data: {
          title: "Delivery",
        },
      },
    ],
  },
];
