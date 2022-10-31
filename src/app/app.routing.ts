import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SchedulerLbeComponent } from './modules/scheduler/scheduler-lbe.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'scheduler-spa',
        pathMatch: 'full',
    },
    {
        path: 'scheduler-spa',
        component: SchedulerLbeComponent,
    },
    {
        path: 'scheduler-spa/:user_id/:date',
        component: SchedulerLbeComponent,
    },
    {
        path: 'scheduler-main-view',
        component: SchedulerLbeComponent,
    }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
    relativeLinkResolution: 'legacy'
}),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
