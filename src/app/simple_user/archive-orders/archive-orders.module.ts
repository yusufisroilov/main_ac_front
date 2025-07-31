import { ArchiveOrdersComponent } from './archive-orders.component';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/app.module';
import { MdModule } from 'src/app/md/md.module';
import { archiveRoutes } from './archive-orders.routing';

@NgModule({
  
  imports: [
    CommonModule,
    RouterModule.forChild(archiveRoutes),
    FormsModule,
    MaterialModule,
    ReactiveFormsModule
  

  ], declarations: [ArchiveOrdersComponent]
})

export class ArchiveOrdersModule { 
  
}
