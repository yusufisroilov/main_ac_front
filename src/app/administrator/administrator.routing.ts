import { FinanceComponent } from "./finance/finance.component";
import { ManagerAuthGuardService } from "./../services/manager-auth-guard.service";
import { AllboxesComponent } from "./allboxes/allboxes.component";
import { AllconsignmentsComponent } from "./allconsignments/allconsignments.component";
import { AllordersComponent } from "./allorders/allorders.component";
import { AllreceiversComponent } from "./allreceivers/allreceivers.component";
import { UsersListComponent } from "./users-list/users-list.component";

import { ForeignStaffAuthGuard } from "./../services/foreign-staff-auth-guard.service";

import { Routes } from "@angular/router";
import { AdminAuthGuard } from "../services/admin-auth-guard.service";
import { InfoeachclientComponent } from "./infoeachclient/infoeachclient.component";
import { EachboxdocComponent } from "./eachboxdoc/eachboxdoc.component";
import { ExpensesComponent } from "./expenses/expenses.component";
import { TransactionsComponent } from "./transactions/transactions.component";
import { CustomerRequestsComponent } from "./customer-requests/customer-requests.component";
import { AdminRequestHandlerComponent } from "./admin-request-handler/admin-request-handler.component";
import { WarehouseInventoryComponent } from "../uzb_staff/warehouse-inventory/warehour-inventory.component";
import { DeliveriesListComponent } from "./deliveries-list/deliveries-list.component";
import { EmployerDeliveryComponent } from "../uzb_staff/employer-delivery/employer-delivery.component";
import { EmployeeAuthGuardService } from "../services/employee-auth-guard.service";
import { AdminTicketListComponent } from "./admin-ticket-list/admin-ticket-list.component";
import { AdminTicketDetailComponent } from "./admin-ticket-detail/admin-ticket-detail.component";
import { InternalNotesComponent } from "./internal-notes/internal-notes.component";
import { MessageThreadComponent } from "./message-thread/message-thread.component";
import { ReplyBoxComponent } from "./reply-box/reply-box.component";
import { AdminTicketDashboardComponent } from "./ticket-dashboard/admin-ticket-dashboard";

export const AdminstratorRoutes: Routes = [
  {
    path: "",

    children: [
      {
        path: "allusers",
        canActivate: [AdminAuthGuard],
        component: UsersListComponent,
        data: {
          title: "Mijozlar",
        },
      },
      {
        path: "allreceivers",
        canActivate: [AdminAuthGuard],
        component: AllreceiversComponent,
        data: {
          title: "Qabul qiluvchilar",
        },
      },
      {
        path: "allorders",
        canActivate: [EmployeeAuthGuardService],
        component: AllordersComponent,
        data: {
          title: "Buyurtmalar",
        },
      },
      {
        path: "allconsignments",
        canActivate: [AdminAuthGuard],
        component: AllconsignmentsComponent,
        data: {
          title: "Partiyalar",
        },
      },
      {
        path: "allboxes",
        canActivate: [AdminAuthGuard],
        component: AllboxesComponent,
        data: {
          title: "Partiya Jo'natmalar",
        },
      },
      {
        path: "finance",
        canActivate: [ManagerAuthGuardService],
        component: FinanceComponent,
        data: {
          title: "Xisob Kitob",
        },
      },
      {
        path: "infoeachclient",
        canActivate: [ManagerAuthGuardService],
        component: InfoeachclientComponent,
        data: {
          title: "Har bir mijoz",
        },
      },
      {
        path: "eachboxuz",
        canActivate: [AdminAuthGuard],
        component: EachboxdocComponent,
        data: {
          title: "Partiya Hujjati",
        },
      },
      {
        path: "expences",
        canActivate: [ManagerAuthGuardService],
        component: ExpensesComponent,
        data: {
          title: "Xarajatlar",
        },
      },
      {
        path: "transactions",
        canActivate: [ManagerAuthGuardService],
        component: TransactionsComponent,
        data: {
          title: "Tranzaksiyalar",
        },
      },
      {
        path: "delivery-requests",
        component: CustomerRequestsComponent,
        data: {
          title: "Yetkazib Berish So'rov",
        },
      },
      {
        path: "admin-del-requests",
        component: AdminRequestHandlerComponent,
        data: {
          title: "Delivery Requests",
        },
      },
      {
        path: "warehouse-inventory",
        component: WarehouseInventoryComponent,
        data: {
          title: "Warehouse Inventories",
        },
      },

      {
        path: "deliveries-list",
        component: DeliveriesListComponent,
        data: {
          title: "Deliveries List",
        },
      },
      // TICKETS COMPONENTS
      {
        path: "tickets-list",
        component: AdminTicketListComponent,
        data: {
          title: "Tickets list",
        },
      },
      {
        path: "ticket-detail",
        children: [
          {
            path: "",
            component: AdminTicketDetailComponent,
            data: {
              title: "Tickets Detail",
            },
          },
          {
            path: ":ticketNumber",
            component: AdminTicketDetailComponent,
            data: {
              title: "Tickets Detail",
            },
          },
        ],
      },
      {
        path: "ticket-notes",
        component: InternalNotesComponent,
        data: {
          title: "Tickets Internal Notes",
        },
      },
      {
        path: "message-thread",
        component: MessageThreadComponent,
        data: {
          title: "Message Thread",
        },
      },

      {
        path: "reply-box",
        component: ReplyBoxComponent,
        data: {
          title: "Reply Box",
        },
      },

      {
        path: "ticket-dashboard",
        component: AdminTicketDashboardComponent,
        data: {
          title: "Tickets Dashboard",
        },
      },
      {
        path: "deliveriesEmp",
        component: EmployerDeliveryComponent,
        data: {
          title: "Deliveries List Employer",
        },
      },
    ],
  },
];
