import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone:false
})
export class PerfilPage {
  nombre: string | null = '';
  email: string | null = '';
  balance: number = 0;

  constructor(private navCtrl: NavController) {}

  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab3');
    setTimeout(() => {
      const activo = document.activeElement as HTMLElement;
      activo?.blur();
    }, 300); // evita conflicto con ion-searchbar
  }

  ionViewWillEnter() {
    this.nombre = localStorage.getItem('user_name');
    this.email = localStorage.getItem('user_email');
    const storedBalance = localStorage.getItem('user_balance');
    this.balance = storedBalance ? parseFloat(storedBalance) : 0;
  }

  cerrarSesion() {
    localStorage.clear();
    this.navCtrl.navigateRoot('/login');
  }
}