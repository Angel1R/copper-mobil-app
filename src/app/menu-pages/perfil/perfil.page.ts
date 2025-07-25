import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage {
  nombre:   string = '';
  email:    string | null = null;
  newEmail: string = '';
  balance:  number = 0;
  cargando: boolean = true;
  private userId: string = '';

  constructor(
    private navCtrl: NavController,
    private toast:   ToastService
  ) {}

  // Cambiamos el return type a Promise<void>
  async ionViewWillEnter(): Promise<void> {
    this.userId = localStorage.getItem('user_id') || '';
    if (!this.userId) {
      await this.navCtrl.navigateRoot('/login');
      return;
    }

    try {
      const res = await Http.get({
        url: `${environment.apiUrl}/auth/profile/${this.userId}`,
        headers:{},
        params:{}
      });
      const data: any = res.data;

      this.nombre = data.name;
      this.email  = data.email;

      // Asegurarte de que balance siempre sea un número
      const balanceNum = typeof data.balance === 'number'
        ? data.balance
        : parseFloat(data.balance) || 0;

      this.balance = balanceNum;

      // Guarda siempre un string válido
      localStorage.setItem('user_name',   this.nombre);
      localStorage.setItem('user_email',  this.email  || '');
      localStorage.setItem('user_balance', balanceNum.toString());

    } catch (e) {
      console.error('No pude cargar perfil:', e);
      this.toast.mostrarToast('Error al cargar tu perfil', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab3');
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.blur();
    }, 300);
  }

  cerrarSesion() {
    localStorage.clear();
    this.navCtrl.navigateRoot('/login');
  }

  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async actualizarEmail() {
    if (!this.validateEmail(this.newEmail)) {
      this.toast.mostrarToast('Ingresa un correo válido', 'warning');
      return;
    }

    try {
      await Http.patch({
        url: `${environment.apiUrl}/auth/update-email`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          user_id: this.userId,
          email:   this.newEmail
        },
        params:{}
      });

      this.toast.mostrarToast('Correo actualizado', 'success');
      localStorage.setItem('user_email', this.newEmail);
      this.email = this.newEmail;
      this.newEmail = '';

    } catch (err) {
      console.error('Error al actualizar correo:', err);
      this.toast.mostrarToast('Error al actualizar correo', 'danger');
    }
  }
}