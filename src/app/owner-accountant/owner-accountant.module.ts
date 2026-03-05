import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MaterialModule } from "../app.module";
import { PaginationModule } from "../shared/pagination/pagination.module";
import { OwnerAccountantRoutes } from "./owner-accountant.routing";
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

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(OwnerAccountantRoutes),
    FormsModule,
    MaterialModule,
    PaginationModule,
  ],
  declarations: [
    ExpenseCategoriesComponent,
    OaExpensesComponent,
    OaOtherIncomesComponent,
    OaOwnerDrawsComponent,
    OaInternalTransfersComponent,
    OwnerDashboardComponent,
    WeeklyCollectionsComponent,
    TopDebtorsComponent,
    ConsignmentSummaryComponent,
    OaCashAccountsComponent,
    OaSettingsComponent,
  ],
})
export class OwnerAccountantModule {}
