import { Routes } from "@angular/router";
import { CustomerCreateTicketComponent } from "./create-ticket.component";

export const createTicketRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: CustomerCreateTicketComponent,
        data: {
          title: "Ticket yaratish",
        },
      },
    ],
  },
];
