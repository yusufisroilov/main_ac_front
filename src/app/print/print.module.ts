import { LabelComponent } from './label/label.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintLayoutComponent } from './print-layout/print-layout.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../app.module';
import { PrintRoutes } from './print.routing';
import { RouterModule } from '@angular/router';
import { NgxBarcodeModule } from 'ngx-barcode';



@NgModule({
  declarations: [
    PrintLayoutComponent,
    LabelComponent

  ],
  imports: [
    CommonModule,
    RouterModule.forChild(PrintRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    NgxBarcodeModule

  ]
})
export class PrintModule { }
