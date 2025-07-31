import { ArchiveOrdersComponent } from './archive-orders.component';
import { Routes } from '@angular/router';
import { AdminAuthGuard } from 'src/app/services/admin-auth-guard.service';



export const archiveRoutes: Routes = [
    {

      path: '',
      children: [ {
        path: '',
        component: ArchiveOrdersComponent,
        data: {
          title: 'Arxiv'
      }
    }]
}
];
