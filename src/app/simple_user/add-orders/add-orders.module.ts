import { addOrdersRoutes } from './add-orders.routing';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { AddOrdersComponent } from './add-orders.component';

import { NgxBarcodeModule } from 'ngx-barcode';

@NgModule({
  
  imports: [
    CommonModule,
    RouterModule.forChild(addOrdersRoutes),
    FormsModule,
    NgxBarcodeModule
  

  ], declarations: [AddOrdersComponent]
})

export class addOrdersModule { 
  
}