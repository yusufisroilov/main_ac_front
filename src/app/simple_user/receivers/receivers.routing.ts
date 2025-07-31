import { AddReceiversComponent } from './../add-receivers/add-receivers.component';
import { Routes } from '@angular/router';

import { ReceiversComponent } from './receivers.component';

export const ReceiversRoutes: Routes = [
    {

      path: '',
      children: [ {
        path: '',
        component: ReceiversComponent,
        data: {
          title: 'Qabul qiluvchilar'
      }
    }]
}
];
