import { AddReceiversComponent } from './add-receivers.component';
import { Routes } from '@angular/router';



export const AddReceiversRoutes: Routes = [
    {

      path: '',
      children: [ {
        path: '',
        component: AddReceiversComponent,
        data: {
          title: 'Qabul qiluvchi yaratish'
      }
    }]
}
];
