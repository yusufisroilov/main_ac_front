
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { NgxBarcodeModule } from 'ngx-barcode';
import { deliveryRoutes } from './delivery.routing';
import { DeliveryComponent } from './delivery.component';
import { MaterialModule } from 'src/app/app.module';
import { AgmCoreModule } from '@agm/core';

@NgModule({
  
  imports: [
    CommonModule,
    RouterModule.forChild(deliveryRoutes),
    FormsModule,
    NgxBarcodeModule,
    MaterialModule,
    ReactiveFormsModule,
    // AgmCoreModule.forRoot({
    //   apiKey: 'AIzaSyDYFO9fgr1rI2ZDWL9fV2zBqS8OREM4I7A'
    // }),
  

  ], declarations: [DeliveryComponent]
})

export class deliveryModule { 
  
}