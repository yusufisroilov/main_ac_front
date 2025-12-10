import { Routes } from "@angular/router";
import { CustomerTicketDetailComponent } from "./ticket-detail.component";

export const customerTicketDetailRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        component: CustomerTicketDetailComponent,
        data: {
          title: "Ticket Detail",
        },
      },
      {
        path: ":ticketNumber",
        component: CustomerTicketDetailComponent,
        data: {
          title: "Ticket Detail",
        },
      },
    ],
  },
];
