import { Routes } from "@angular/router";
import { OwnerAuthGuardService } from "../services/owner-auth-guard.service";
import { ExpenseCategoriesComponent } from "./expense-categories/expense-categories.component";
import { OaExpensesComponent } from "./expenses/expenses.component";
import { OaOtherIncomesComponent } from "./other-incomes/other-incomes.component";
import { OaOwnerDrawsComponent } from "./owner-draws/owner-draws.component";
import { OaInternalTransfersComponent } from "./internal-transfers/internal-transfers.component";
import { OwnerDashboardComponent } from "./owner-dashboard/owner-dashboard.component";
import { WeeklyCollectionsComponent } from "./weekly-collections/weekly-collections.component";
import { TopDebtorsComponent } from "./top-debtors/top-debtors.component";
import { ConsignmentSummaryComponent } from "./consignment-summary/consignment-summary.component";
import { OaCashAccountsComponent } from "./oa-cash-accounts/oa-cash-accounts.component";
import { OaSettingsComponent } from "./settings/settings.component";
import { AccLedgerListComponent } from "./acc-ledger-list/acc-ledger-list.component";

export const OwnerAccountantRoutes: Routes = [
  {
    path: "",
    children: [
      {
        path: "dashboard",
        canActivate: [OwnerAuthGuardService],
        component: OwnerDashboardComponent,
        data: { title: "Owner Dashboard" },
      },
      {
        path: "cash-accounts",
        canActivate: [OwnerAuthGuardService],
        component: OaCashAccountsComponent,
        data: { title: "Hisoblar" },
      },
      {
        path: "expense-categories",
        canActivate: [OwnerAuthGuardService],
        component: ExpenseCategoriesComponent,
        data: { title: "Xarajat Kategoriyalari" },
      },
      {
        path: "settings",
        canActivate: [OwnerAuthGuardService],
        component: OaSettingsComponent,
        data: { title: "Sozlamalar" },
      },
      {
        path: "expenses",
        canActivate: [OwnerAuthGuardService],
        component: OaExpensesComponent,
        data: { title: "Xarajatlar" },
      },
      {
        path: "other-incomes",
        canActivate: [OwnerAuthGuardService],
        component: OaOtherIncomesComponent,
        data: { title: "Boshqa Daromadlar" },
      },
      {
        path: "owner-draws",
        canActivate: [OwnerAuthGuardService],
        component: OaOwnerDrawsComponent,
        data: { title: "Owner Draws" },
      },
      {
        path: "internal-transfers",
        canActivate: [OwnerAuthGuardService],
        component: OaInternalTransfersComponent,
        data: { title: "Ichki Transferlar" },
      },
      {
        path: "weekly-collections",
        canActivate: [OwnerAuthGuardService],
        component: WeeklyCollectionsComponent,
        data: { title: "Haftalik Yig'imlar" },
      },
      {
        path: "top-debtors",
        canActivate: [OwnerAuthGuardService],
        component: TopDebtorsComponent,
        data: { title: "Eng Ko'p Qarzdorlar" },
      },
      {
        path: "consignment-summary",
        canActivate: [OwnerAuthGuardService],
        component: ConsignmentSummaryComponent,
        data: { title: "Partiya Xulosasi" },
      },
      {
        path: "acc-ledger",
        canActivate: [OwnerAuthGuardService],
        component: AccLedgerListComponent,
        data: { title: "Acc Transaksiyalar" },
      },
    ],
  },
];
