import { AddReceiversComponent } from './../add-receivers/add-receivers.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ReceiversRoutes } from './receivers.routing';
import { FormsModule } from '@angular/forms';
import { ReceiversComponent } from './receivers.component';
import { MaterialModule } from 'src/app/app.module';
import { MdModule } from 'src/app/md/md.module';

@NgModule({
  
  imports: [
    CommonModule,
    RouterModule.forChild(ReceiversRoutes),
    FormsModule
  

  ], declarations: [ReceiversComponent]
})

export class ReceiversModule { 
  
}
