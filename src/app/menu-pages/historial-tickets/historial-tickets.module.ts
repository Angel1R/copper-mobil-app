import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialTicketsPageRoutingModule } from './historial-tickets-routing.module';

import { HistorialTicketsPage } from './historial-tickets.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialTicketsPageRoutingModule
  ],
  declarations: [HistorialTicketsPage]
})
export class HistorialTicketsPageModule {}
