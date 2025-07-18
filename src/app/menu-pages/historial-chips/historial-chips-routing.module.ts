import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialChipsPage } from './historial-chips.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialChipsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialChipsPageRoutingModule {}
