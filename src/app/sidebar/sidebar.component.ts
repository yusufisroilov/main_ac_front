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
    path: "/consignment-tracking",
    title: "Reyslar Holati",
    type: "link",
    icontype: "flight",
  },

  {
    path: "/uzm/delivery-requests",
    title: "Yetkazib berish so'rovi",
    type: "link",
    icontype: "local_shipping",
  },
  {
    path: "/customer-tickets",
    title: "Mening Murojaatlarim",
    type: "link",
    icontype: "cases",
  },
  // {
  //   path: "/customer-ticket-detail",
  //   title: "Customer Detail",
  //   type: "link",
  //   icontype: "cases",
  // },
  {
    path: "/create-ticket",
    title: "Yangi Murojaat",
    type: "link",
    icontype: "cases",
  },

  {
    path: "/archive",
    title: "Arxiv",
    type: "link",
    icontype: "archive",
  },
  {
    path: "/uzm/video-lessons",
    title: "Video Darsliklar",
    type: "link",
    icontype: "play_circle_outline",
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
    path: "/uzm/allorders",
    title: "Hamma buyurtmalar 2",
    type: "link",
    icontype: "list",
  },
  {
    path: "/admin/each-client-admin",
    title: "Har bir Mijoz",
    type: "link",
    icontype: "badge",
  },
  {
    path: "/uzs/each-client-admin2",
    title: "Har Bir Mijoz2",
    type: "link",
    icontype: "person_search",
  },

  {
    path: "/uzs/employee-finance",
    title: "Xisob Kitob",
    type: "link",
    icontype: "account_balance_wallet",
  },
  {
    path: "/uzm/warehouse-inventory",
    title: "Officedagi Yuklar",
    type: "link",
    icontype: "inventory_2",
  },
  {
    path: "/uzm/deliveriesEmp",
    title: "Yetkazma Malumotlari",
    type: "link",
    icontype: "local_shipping",
  },
  {
    path: "/uzs/emu-deliveries",
    title: "Bugungi EMU lar",
    type: "link",
    icontype: "airport_shuttle",
  },
  {
    path: "/uzs/yandex-deliveries",
    title: "Bugungi Yandex lar",
    type: "link",
    icontype: "local_taxi",
  },
  {
    path: "/uzs/pickup-deliveries",
    title: "Bugungi Mijoz olib Ketgan",
    type: "link",
    icontype: "how_to_reg",
  },
  {
    path: "/uzs/courier-deliveries",
    title: "Bugungi Kuryer Yetkazmalari",
    type: "link",
    icontype: "delivery_dining",
  },
  {
    path: "/uzm/tickets-list",
    title: "Murojaatlar Ro'yxati",
    type: "link",
    icontype: "credit_card",
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
    path: "/admin/each-client-admin",
    title: "Har bir Mijoz",
    type: "link",
    icontype: "badge",
  },
  {
    path: "/uzs/each-client-admin2",
    title: "Har Bir Mijoz2",
    type: "link",
    icontype: "person_search",
  },

  {
    path: "/uzs/uzparcelslist",
    title: "Hamma buyurtmalar",
    type: "link",
    icontype: "list",
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
    path: "/uzm/tickets-list",
    title: "Murojaatlar Ro'yxati",
    type: "link",
    icontype: "credit_card",
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
  {
    path: "/customer-tickets",
    title: "My Tickets",
    type: "link",
    icontype: "cases",
  },
  // {
  //   path: "/customer-ticket-detail",
  //   title: "Customer Detail",
  //   type: "link",
  //   icontype: "cases",
  // },
  {
    path: "/create-ticket",
    title: "New Ticket",
    type: "link",
    icontype: "cases",
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
    path: "/uzm/financev2",
    title: "Xisob Kitob2",
    type: "link",
    icontype: "account_balance",
  },

  {
    path: "/uzm/infoeachclient",
    title: "Har bir mijoz",
    type: "link",
    icontype: "badge",
  },
  {
    path: "/uzm/infoeachclientv2",
    title: "Har Bir Mijoz2",
    type: "link",
    icontype: "person_search",
  },
  {
    path: "/uzm/warehouse-inventory",
    title: "Officedagi Yuklar",
    type: "link",
    icontype: "inventory_2",
  },
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
  // {
  //   path: "/oa/other-incomes",
  //   title: "Boshqa Daromadlar",
  //   type: "link",
  //   icontype: "attach_money",
  // },

  // {
  //   path: "/uzm/for-debt-management",
  //   title: "Qarzlarni Boshqarish",
  //   type: "link",
  //   icontype: "payments",
  // },

  {
    path: "/uzm/tickets-list",
    title: "Murojaatlar Ro'yxati",
    type: "link",
    icontype: "credit_card",
  },
  {
    path: "/uzm/ticket-dashboard",
    title: "Murojaatlar Oynasi",
    type: "link",
    icontype: "credit_card",
  },
  {
    path: "/uzm/transactions",
    title: "Tranzaksiyalar ",
    type: "link",
    icontype: "credit_card",
  },
  {
    path: "/oa/top-debtors",
    title: "Eng Ko'p Qarzdorlar",
    type: "link",
    icontype: "people",
  },
  {
    path: "/oa",
    title: "Hisoblar&Trans",
    type: "sub-abs",
    icontype: "account_balance",
    collapse: "hisoblar-trans",
    children: [
      { path: "/oa/cash-accounts", title: "Kassa Hisoblar", ab: "KH" },
      { path: "/oa/acc-ledger", title: "Kassa Tarixi", ab: "KT" },
    ],
  },
  {
    path: "/uzm",
    title: "Partiya Huj&Jo'nat",
    type: "sub-abs",
    icontype: "inventory_2",
    collapse: "partiya-huj-jonat",
    children: [
      { path: "/uzm/allboxes", title: "Partiya Jo'natmalari", ab: "PJ" },
      { path: "/uzm/eachboxuz", title: "Partiya Hujjatlari", ab: "PH" },
      { path: "/uzm/customer-services", title: "Mijoz Xizmatlari", ab: "MX" },
    ],
  },
  {
    path: "/uzm/video-lessons",
    title: "Video Darsliklar",
    type: "link",
    icontype: "play_circle_outline",
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

export const auditorROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/audit/pending-payments",
    title: "Kutilayotgan",
    type: "link",
    icontype: "hourglass_empty",
  },
  {
    path: "/audit/approved-payments",
    title: "Tasdiqlangan",
    type: "link",
    icontype: "check_circle",
  },
  {
    path: "/audit/suspicious-payments",
    title: "Shubhali",
    type: "link",
    icontype: "report_problem",
  },
  {
    path: "/audit/rejected-payments",
    title: "Rad Etilgan",
    type: "link",
    icontype: "cancel",
  },
];

export const accountantROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/oa/cash-accounts",
    title: "Hisoblar",
    type: "link",
    icontype: "account_balance",
  },
  {
    path: "/oa/expenses",
    title: "Xarajatlar",
    type: "link",
    icontype: "receipt_long",
  },
  {
    path: "/oa/other-incomes",
    title: "Boshqa Daromadlar",
    type: "link",
    icontype: "attach_money",
  },
  {
    path: "/oa/internal-transfers",
    title: "Ichki Transferlar",
    type: "link",
    icontype: "swap_horiz",
  },
  {
    path: "/oa/owner-draws",
    title: "Owner Draws",
    type: "link",
    icontype: "account_circle",
  },

  {
    path: "/oa/top-debtors",
    title: "Eng Ko'p Qarzdorlar",
    type: "link",
    icontype: "people",
  },
];

export const ownerROUTES: RouteInfo[] = [
  {
    path: "/oa/dashboard",
    title: "Dashboard",
    type: "link",
    icontype: "dashboard",
  },
  {
    path: "/oa/cash-accounts",
    title: "Hisoblar",
    type: "link",
    icontype: "account_balance",
  },
  {
    path: "/oa/acc-ledger",
    title: "Acc Transaksiyalar",
    type: "link",
    icontype: "receipt_long",
  },
  {
    path: "/oa/weekly-collections",
    title: "Haftalik Yig'imlar",
    type: "link",
    icontype: "bar_chart",
  },
  {
    path: "/oa/expenses",
    title: "Xarajatlar",
    type: "link",
    icontype: "receipt_long",
  },
  {
    path: "/oa/other-incomes",
    title: "Boshqa Daromadlar",
    type: "link",
    icontype: "attach_money",
  },
  {
    path: "/oa/owner-draws",
    title: "Owner Draws",
    type: "link",
    icontype: "account_circle",
  },

  {
    path: "/oa/internal-transfers",
    title: "Ichki Transferlar",
    type: "link",
    icontype: "swap_horiz",
  },
  {
    path: "/uzm/transactions",
    title: "Tranzaksiyalar",
    type: "link",
    icontype: "credit_card",
  },
  {
    path: "/oa/top-debtors",
    title: "Eng Ko'p Qarzdorlar",
    type: "link",
    icontype: "people",
  },

  {
    path: "/uzm",
    title: "Xisob-Kitob",
    type: "sub-abs",
    icontype: "account_balance_wallet",
    collapse: "xisob-kitob",
    children: [
      { path: "/uzm/finance", title: "Xisob Kitob", ab: "XK" },
      { path: "/uzm/financev2", title: "Xisob Kitob2", ab: "XK2" },
      { path: "/uzm/infoeachclient", title: "Har bir mijoz", ab: "HM" },
      { path: "/uzm/infoeachclientv2", title: "Har Bir Mijoz2", ab: "HM2" },
    ],
  },
  {
    path: "/uzm",
    title: "Mijozlar",
    type: "sub-abs",
    icontype: "people_alt",
    collapse: "mijozlar",
    children: [
      { path: "/uzm/allusers", title: "Hamma Mijozlar", ab: "HM" },
      { path: "/uzm/allreceivers", title: "Hamma Qabul qilivchilar", ab: "HQ" },
    ],
  },
  {
    path: "/uzm",
    title: "Partiya & Yuklar",
    type: "sub-abs",
    icontype: "inventory_2",
    collapse: "partiya-yuklar",
    children: [
      {
        path: "/uzm/warehouse-inventory",
        title: "Officedagi Yuklar",
        ab: "OY",
      },
      { path: "/fs/consignmentlist", title: "Reyslar ro'yhati", ab: "RR" },
    ],
  },
  {
    path: "/uzm",
    title: "Murojaatlar",
    type: "sub-abs",
    icontype: "confirmation_number",
    collapse: "murojaatlar",
    children: [
      { path: "/uzm/tickets-list", title: "Murojaatlar Ro'yxati", ab: "MR" },
      { path: "/uzm/ticket-dashboard", title: "Murojaatlar Oynasi", ab: "MO" },
    ],
  },
  {
    path: "/uzm/video-lessons",
    title: "Video Darsliklar",
    type: "link",
    icontype: "play_circle_outline",
  },
  {
    path: "/oa/settings",
    title: "Sozlamalar",
    type: "link",
    icontype: "settings",
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
    } else if (this.userRole == "AUDITOR") {
      this.menuItems = auditorROUTES.filter((menuItem) => menuItem);
    } else if (this.userRole == "OWNER") {
      this.menuItems = ownerROUTES.filter((menuItem) => menuItem);
    } else if (this.userRole == "ACCOUNTANT") {
      this.menuItems = accountantROUTES.filter((menuItem) => menuItem);
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
