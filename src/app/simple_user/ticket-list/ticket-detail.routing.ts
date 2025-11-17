import { Routes } from "@angular/router";

import { CustomerTicketListComponent } from "./ticket-list.component";

export const customerTicketListRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: CustomerTicketListComponent,
        data: {
          title: "Ticket Detail",
        },
      },
    ],
  },
];
