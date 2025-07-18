import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialChipsPageRoutingModule } from './historial-chips-routing.module';

import { HistorialChipsPage } from './historial-chips.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialChipsPageRoutingModule
  ],
  declarations: [HistorialChipsPage]
})
export class HistorialChipsPageModule {}
