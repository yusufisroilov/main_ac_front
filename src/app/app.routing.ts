import { AdminAuthGuard } from "./services/admin-auth-guard.service";
import { AuthGuard } from "./services/auth-guard.service";
import { Routes } from "@angular/router";

import { AdminLayoutComponent } from "./layouts/admin/admin-layout.component";
import { AuthLayoutComponent } from "./layouts/auth/auth-layout.component";
import { PrintLayoutComponent } from "./print/print-layout/print-layout.component";
import { LabelComponent } from "./print/label/label.component";
import { DeliveryComponent } from "./simple_user/delivery/delivery.component";

export const AppRoutes: Routes = [
  {
    path: "",
    redirectTo: "pages/login",
    pathMatch: "full",
  },
  {
    path: "delivery",
    component: DeliveryComponent,
    children: [
      {
        path: "",
        loadChildren: () =>
          import("./simple_user/delivery/delivery.module").then(
            (m) => m.deliveryModule
          ),
      },
    ],
  },
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "",
        loadChildren: () =>
          import("./dashboard/dashboard.module").then((m) => m.DashboardModule),
      },
      {
        path: "components",
        loadChildren: () =>
          import("./components/components.module").then(
            (m) => m.ComponentsModule
          ),
      },
      {
        path: "print",
        loadChildren: () =>
          import("./print/print.module").then((m) => m.PrintModule),
      },
      {
        path: "uzs",
        loadChildren: () =>
          import("./uzb_staff/uzb-staff.module").then((m) => m.UzbStaffModule),
      },
      {
        path: "receivers",
        loadChildren: () =>
          import("./simple_user/receivers/receivers.module").then(
            (m) => m.ReceiversModule
          ),
      },
      {
        path: "addreceivers",
        loadChildren: () =>
          import("./simple_user/add-receivers/add-receivers.module").then(
            (m) => m.AddReceiversModule
          ),
      },
      {
        path: "orders",
        loadChildren: () =>
          import("./simple_user/orders/orders.module").then(
            (m) => m.OrdersModule
          ),
      },
      {
        path: "customer-dashboard",
        loadChildren: () =>
          import(
            "./simple_user/customer-dashboard/customer-dashboard.module"
          ).then((m) => m.customerDashboardModule),
      },
      {
        path: "archive",
        loadChildren: () =>
          import("./simple_user/archive-orders/archive-orders.module").then(
            (m) => m.ArchiveOrdersModule
          ),
      },
      {
        path: "orderboxes",
        loadChildren: () =>
          import("./simple_user/order-boxes/order-boxes.module").then(
            (m) => m.OrderBoxesModule
          ),
      },
      {
        path: "addorders",
        loadChildren: () =>
          import("./simple_user/add-orders/add-orders.module").then(
            (m) => m.addOrdersModule
          ),
      },
      {
        path: "customer-tickets",
        loadChildren: () =>
          import("./simple_user/ticket-list/ticket-list.module").then(
            (m) => m.CustometTicketsListModule
          ),
      },
      {
        path: "customer-ticket-detail",
        loadChildren: () =>
          import("./simple_user/ticket-detail/ticket-detail.module").then(
            (m) => m.CustomerTicketDetailModule
          ),
      },
      {
        path: "create-ticket",
        loadChildren: () =>
          import("./simple_user/create-ticket/create-ticket.module").then(
            (m) => m.CustomerCreateTicketModule
          ),
      },
      {
        path: "tables",
        loadChildren: () =>
          import("./tables/tables.module").then((m) => m.TablesModule),
      },
      {
        path: "fs",
        loadChildren: () =>
          import("./foreign_staff/foreign-staff.module").then(
            (m) => m.ForeignStaffModule
          ),
      },
      {
        path: "uzm",
        loadChildren: () =>
          import("./administrator/administrator.module").then(
            (m) => m.AdminstratorModule
          ),
      },
      {
        path: "admin",
        loadChildren: () =>
          import("./uzb_staff/uzb-staff.module").then((m) => m.UzbStaffModule),
      },
      {
        path: "forms",
        loadChildren: () => import("./forms/forms.module").then((m) => m.Forms),
      },
      {
        path: "maps",
        loadChildren: () =>
          import("./maps/maps.module").then((m) => m.MapsModule),
      },
      {
        path: "widgets",
        loadChildren: () =>
          import("./widgets/widgets.module").then((m) => m.WidgetsModule),
      },
      {
        path: "charts",
        loadChildren: () =>
          import("./charts/charts.module").then((m) => m.ChartsModule),
      },
      {
        path: "calendar",
        loadChildren: () =>
          import("./calendar/calendar.module").then((m) => m.CalendarModule),
      },
      {
        path: "",
        loadChildren: () =>
          import("./userpage/user.module").then((m) => m.UserModule),
      },
      {
        path: "",
        loadChildren: () =>
          import("./timeline/timeline.module").then((m) => m.TimelineModule),
      },
    ],
  },
  {
    path: "",
    component: AuthLayoutComponent,
    children: [
      {
        path: "pages",
        loadChildren: () =>
          import("./pages/pages.module").then((m) => m.PagesModule),
      },
    ],
  },
];
