import { AuthService } from "./../pages/login/auth.service";
import { Component, OnInit } from "@angular/core";
import PerfectScrollbar from "perfect-scrollbar";

declare const $: any;

//Metadata
export interface RouteInfo {
  path: string;
  title: string;
  type: string;
  icontype: string;
  collapse?: string;
  children?: ChildrenItems[];
}

export interface ChildrenItems {
  path: string;
  title: string;
  ab: string;
  type?: string;
}

//Menu Items
export const ROUTES: RouteInfo[] = [
  {
    path: "/customer-dashboard",
    title: "Asosiy sahifa",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/receivers",
    title: "Qabul qilivchilar",
    type: "link",
    icontype: "contacts",
  },
  {
    path: "/orders",
    title: "Buyurtmalar",
    type: "link",
    icontype: "local_mall",
  },
  {
    path: "/orderboxes",
    title: "Jo'natmalar",
    type: "link",
    icontype: "cases",
  },
  {
    path: "/uzm/delivery-requests",
    title: "Yetkazib berish so'rovi",
    type: "link",
    icontype: "local_shipping",
  },

  {
    path: "/archive",
    title: "Arxiv",
    type: "link",
    icontype: "archive",
  },
];

//Menu Items
export const EmployeeROUTE: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Asosiy sahifa",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/uzm/deliveriesEmp",
    title: "Employer Delivery List",
    type: "link",
    icontype: "local_shipping",
  },
  {
    path: "/uzm/warehouse-inventory",
    title: "Officedagi Yuklar",
    type: "link",
    icontype: "inventory_2",
  },
];

export const adminROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/receivers",
    title: "Qabul qilivchilar",
    type: "link",
    icontype: "receipt",
  },
  {
    path: "/fs/allparcelslist",
    title: "All Parcels List",
    type: "link",
    icontype: "list",
  },
  {
    path: "/addorders",
    title: "Build Consignment",
    type: "link",
    icontype: "note_add",
  },
  {
    path: "/fs/docprint",
    title: "Document Print",
    type: "link",
    icontype: "print",
  },
  {
    path: "/fs/consignmentlist",
    title: "Consignment List",
    type: "link",
    icontype: "list",
  },
  {
    path: "/orders",
    title: "Buyurtmalar",
    type: "link",
    icontype: "local_mall",
  },
  {
    path: "/orderboxes",
    title: "Jo'natmalar",
    type: "link",
    icontype: "local_shipping",
  },

  {
    path: "/components",
    title: "Components",
    type: "sub",
    icontype: "apps",
    collapse: "components",
    children: [
      { path: "buttons", title: "Buttons", ab: "B" },
      { path: "grid", title: "Grid System", ab: "GS" },
      { path: "panels", title: "Panels", ab: "P" },
      { path: "sweet-alert", title: "Sweet Alert", ab: "SA" },
      { path: "notifications", title: "Notifications", ab: "N" },
      { path: "icons", title: "Icons", ab: "I" },
      { path: "typography", title: "Typography", ab: "T" },
    ],
  },
  {
    path: "/forms",
    title: "Forms",
    type: "sub",
    icontype: "content_paste",
    collapse: "forms",
    children: [
      { path: "regular", title: "Regular Forms", ab: "RF" },
      { path: "extended", title: "Extended Forms", ab: "EF" },
      { path: "validation", title: "Validation Forms", ab: "VF" },
      { path: "wizard", title: "Wizard", ab: "W" },
    ],
  },
  {
    path: "/tables",
    title: "Tables",
    type: "sub",
    icontype: "grid_on",
    collapse: "tables",
    children: [
      { path: "regular12", title: "Regular Tables", ab: "RT" },
      { path: "extended", title: "Extended Tables", ab: "ET" },
      { path: "datatables.net", title: "Datatables.net", ab: "DT" },
    ],
  },
  {
    path: "/maps",
    title: "Maps",
    type: "sub",
    icontype: "place",
    collapse: "maps",
    children: [
      { path: "google", title: "Google Maps", ab: "GM" },
      { path: "fullscreen", title: "Full Screen Map", ab: "FSM" },
      { path: "vector", title: "Vector Map", ab: "VM" },
    ],
  },
  {
    path: "/widgets",
    title: "Widgets",
    type: "link",
    icontype: "widgets",
  },
  {
    path: "/charts",
    title: "Charts",
    type: "link",
    icontype: "timeline",
  },
  {
    path: "/calendar",
    title: "Calendar",
    type: "link",
    icontype: "date_range",
  },
  {
    path: "/pages",
    title: "Pages",
    type: "sub",
    icontype: "image",
    collapse: "pages",
    children: [
      { path: "pricing", title: "Pricing", ab: "P" },
      { path: "timeline", title: "Timeline Page", ab: "TP" },
      { path: "login", title: "Login Page", ab: "LP" },
      { path: "register", title: "Register Page", ab: "RP" },
      { path: "lock", title: "Lock Screen Page", ab: "LSP" },
      { path: "user", title: "User Page", ab: "UP" },
    ],
  },
];

export const chinaStaffROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/fs/expressscan",
    title: "Local Express Scan",
    type: "link",
    icontype: "delivery_dining",
  },
  {
    path: "/fs/allparcelslist",
    title: "All Parcels List",
    type: "link",
    icontype: "list",
  },

  {
    path: "/addorders",
    title: "Build Consignment",
    type: "link",
    icontype: "note_add",
  },
  {
    path: "/fs/bigboxes",
    title: "Big Boxes Work",
    type: "link",
    icontype: "inventory_2",
  },
  {
    path: "/fs/consignmentlist",
    title: "Consignment List",
    type: "link",
    icontype: "flight_takeoff",
  },
];

export const managerROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/uzm/allusers",
    title: "Hamma Mijozlar",
    type: "link",
    icontype: "people_alt",
  },

  {
    path: "/uzm/allreceivers",
    title: "Hamma Qabul qilivchilar",
    type: "link",
    icontype: "contacts",
  },
  {
    path: "/uzs/uzparcelslist",
    title: "Hamma buyurtmalar",
    type: "link",
    icontype: "list",
  },
  {
    path: "/uzm/allorders",
    title: "Hamma buyurtmalar 2",
    type: "link",
    icontype: "list",
  },
  {
    path: "/uzm/allboxes",
    title: "Partiya Jo'natmalari",
    type: "link",
    icontype: "cases",
  },
  {
    path: "/uzm/eachboxuz",
    title: "*Partiya Hujjatlari",
    type: "link",
    icontype: "file_present",
  },
  {
    path: "/fs/consignmentlist",
    title: "Reyslar ro'yhati",
    type: "link",
    icontype: "flight_takeoff",
  },
  {
    path: "/uzm/finance",
    title: "Xisob Kitob",
    type: "link",
    icontype: "account_balance_wallet",
  },
  {
    path: "/uzm/infoeachclient",
    title: "Har bir mijoz",
    type: "link",
    icontype: "badge",
  },
  {
    path: "/uzm/warehouse-inventory",
    title: "Officedagi Yuklar",
    type: "link",
    icontype: "inventory_2",
  },
  // {
  //   path: "/uzs/deliveries",
  //   title: "Yetkazmalar",
  //   type: "link",
  //   icontype: "local_shipping",
  // },
  {
    path: "/uzm/deliveries-list",
    title: "Yetkazmalar",
    type: "link",
    icontype: "local_shipping",
  },
  {
    path: "/uzm/admin-del-requests",
    title: "Yetkazish So'rovlari",
    type: "link",
    icontype: "assignment",
  },
  {
    path: "/uzm/transactions",
    title: "Tranzaksiyalar ",
    type: "link",
    icontype: "credit_card",
  },
];

export const uzbStaffROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/uzm/allreceivers",
    title: "Hamma Qabul qilivchilar",
    type: "link",
    icontype: "contacts",
  },
  {
    path: "/uzs/uzparcelslist",
    title: "Hamma buyurtmalar",
    type: "link",
    icontype: "list",
  },
  {
    path: "/fs/consignmentlist",
    title: "Reyslar ro'yhati",
    type: "link",
    icontype: "flight_takeoff",
  },
];

@Component({
  selector: "app-sidebar-cmp",
  templateUrl: "sidebar.component.html",
})
export class SidebarComponent implements OnInit {
  userRole = localStorage.getItem("role");
  constructor(public authService: AuthService) {}

  firstname = localStorage.getItem("first_name");
  lastname = localStorage.getItem("last_name");

  public menuItems: any[];

  ps: any;
  isMobileMenu() {
    if ($(window).width() > 991) {
      return false;
    }
    return true;
  }

  ngOnInit() {
    if (this.userRole == "ADMIN") {
      this.menuItems = adminROUTES.filter((menuItem) => menuItem);
    } else if (this.userRole == "CHINASTAFF") {
      this.menuItems = chinaStaffROUTES.filter((menuItem) => menuItem);
    } else if (this.userRole == "MANAGER") {
      this.menuItems = managerROUTES.filter((menuItem) => menuItem);
    } else if (this.userRole == "UZBSTAFF") {
      this.menuItems = uzbStaffROUTES.filter((menuItem) => menuItem);
    } else if (this.userRole == "YUKCHI") {
      this.menuItems = EmployeeROUTE.filter((menuItem) => menuItem);
    } else {
      this.menuItems = ROUTES.filter((menuItem) => menuItem);
    }

    if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
      const elemSidebar = <HTMLElement>(
        document.querySelector(".sidebar .sidebar-wrapper")
      );
      this.ps = new PerfectScrollbar(elemSidebar);
    }
  }
  updatePS(): void {
    if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
      this.ps.update();
    }
  }
  isMac(): boolean {
    let bool = false;
    if (
      navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
      navigator.platform.toUpperCase().indexOf("IPAD") >= 0
    ) {
      bool = true;
    }
    return bool;
  }
}
