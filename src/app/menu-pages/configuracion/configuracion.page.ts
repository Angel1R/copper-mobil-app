import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';


@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone:false
})
export class ConfiguracionPage{
  constructor(private navCtrl: NavController) {}

  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab3');
    setTimeout(() => {
      const activo = document.activeElement as HTMLElement;
      activo?.blur();
    }, 300); // evita conflicto con ion-searchbar
  }
}
