import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone:false
})
export class ConfiguracionPage {
  constructor(private navCtrl: NavController) {}

  goBack() {
    this.navCtrl.navigateBack('/tabs/tab3'); // Regresar a la pestaña principal
  }
}
