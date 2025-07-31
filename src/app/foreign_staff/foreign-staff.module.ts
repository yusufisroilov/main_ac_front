import { ParclesListComponent } from './parcels-list/parcles-list.component';
import { DocPrintComponent } from './doc-print/doc-print.component';
import { ConsignmentListComponent } from './consignment-list/consignment-list.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../app.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ForeignStaffRoutes } from './foreign-staff.routing';
import { ManifestComponent } from './manifest/manifest.component';
import { ExpressScanComponent } from './express-scan/express-scan.component';
import { NgxBarcodeModule } from 'ngx-barcode';
import { BigBoxesComponent } from './big-boxes/big-boxes.component';
// import { FlexLayoutModule } from '@angular/flex-layout';



@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ForeignStaffRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    NgxBarcodeModule
  
  ],
  declarations: [
    ConsignmentListComponent,
    DocPrintComponent,
    ParclesListComponent,
    ManifestComponent,
    ExpressScanComponent,
    BigBoxesComponent

  ]
})

export class ForeignStaffModule {}