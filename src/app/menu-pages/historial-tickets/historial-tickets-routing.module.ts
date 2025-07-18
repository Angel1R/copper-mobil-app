import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialTicketsPage } from './historial-tickets.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialTicketsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialTicketsPageRoutingModule {}
