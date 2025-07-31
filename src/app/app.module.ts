import { AdminAuthGuard } from './services/admin-auth-guard.service';
import { AuthGuard } from './services/auth-guard.service';
import { AddReceiversService } from './simple_user/add-receivers/add-receivers.service';
import { ReceiverService } from './simple_user/receivers/receivers.service';
import { AuthService } from './pages/login/auth.service';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { APP_BASE_HREF, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {MatNativeDateModule} from '@angular/material/core';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSliderModule} from '@angular/material/slider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatMenuModule} from '@angular/material/menu';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';

import { AppComponent } from './app.component';

import { SidebarModule } from './sidebar/sidebar.module';
import { FooterModule } from './shared/footer/footer.module';
import { NavbarModule} from './shared/navbar/navbar.module';
import { FixedpluginModule} from './shared/fixedplugin/fixedplugin.module';
import { AdminLayoutComponent } from './layouts/admin/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';

import { AppRoutes } from './app.routing';

import { HttpModule } from '@angular/http';
import { AddOrdersComponent } from './simple_user/add-orders/add-orders.component';
import { ReceiversComponent } from './simple_user/receivers/receivers.component';
import { OrdersComponent } from './simple_user/orders/orders.component';
import { OrderBoxesComponent } from './simple_user/order-boxes/order-boxes.component';
import { ReceiversModule } from './simple_user/receivers/receivers.module';
import { RegService } from './pages/register/reg.service';
import { AddReceiversComponent } from './simple_user/add-receivers/add-receivers.component';
import { DocPrintComponent } from './foreign_staff/doc-print/doc-print.component';
import { ConsignmentListComponent } from './foreign_staff/consignment-list/consignment-list.component';
import { ParclesListComponent } from './foreign_staff/parcels-list/parcles-list.component';
import { ReceiversListComponent } from './uzb_staff/receivers-list/receivers-list.component';
import { ScanParcelUzbComponent } from './uzb_staff/scan-parcel-uzb/scan-parcel-uzb.component';
import { BoxesListComponent } from './uzb_staff/boxes-list/boxes-list.component';
import { UsersListComponent } from './administrator/users-list/users-list.component';
import { PrintLayoutComponent } from './print/print-layout/print-layout.component';
import { LabelComponent } from './print/label/label.component';
import { GlobalVars } from './global-vars';
import { AllreceiversComponent } from './administrator/allreceivers/allreceivers.component';
import { AllordersComponent } from './administrator/allorders/allorders.component';
import { AllconsignmentsComponent } from './administrator/allconsignments/allconsignments.component';
import { AllboxesComponent } from './administrator/allboxes/allboxes.component';
import { ArchiveOrdersComponent } from './simple_user/archive-orders/archive-orders.component';

import { DeliveryService } from './simple_user/delivery/delivery.service';

@NgModule({
  exports: [
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatCheckboxModule,
    MatStepperModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatNativeDateModule
  ],
  declarations: []
})
export class MaterialModule {}

@NgModule({
    imports:      [
        CommonModule,
        BrowserAnimationsModule,
        FormsModule,
        RouterModule.forRoot(AppRoutes,{
    useHash: true
}),
        HttpClientModule,
        HttpModule, 
        MaterialModule,
        SidebarModule,
        NavbarModule,
        FooterModule
        //FixedpluginModule
    ],
    declarations: [
        AppComponent,
        AdminLayoutComponent,
        AuthLayoutComponent
    ],
    providers : [
      MatNativeDateModule,
      AuthService,
      RegService,
      ReceiverService,
      AddReceiversService,
      AuthGuard,
      AdminAuthGuard,
      GlobalVars,
      DeliveryService,
      DatePipe
    ],
    bootstrap:    [ AppComponent ]
})
export class AppModule { }
