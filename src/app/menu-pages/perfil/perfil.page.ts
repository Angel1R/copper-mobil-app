import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone:false
})
export class PerfilPage {
  constructor(private navCtrl: NavController) {}

  goBack() {
    this.navCtrl.navigateBack('/tabs/tab3'); // Regresar a la pestaña principal
  }
}
