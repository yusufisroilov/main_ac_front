import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderBoxesComponent } from './order-boxes.component';
import { orderBoxesRoutes } from './order-boxes.routing';
import { MaterialModule } from 'src/app/app.module';

@NgModule({
  
  imports: [
    CommonModule,
    RouterModule.forChild(orderBoxesRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule
  

  ], declarations: [OrderBoxesComponent]
})

export class OrderBoxesModule { 
  
}
