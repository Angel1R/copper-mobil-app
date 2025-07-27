import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/services/toast.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage {
  nombre = '';
  email: string | null = null;
  newEmail = '';
  balance = 0;
  cargando = true;
  private userId = '';

  constructor(
    private navCtrl: NavController,
    private toast:   ToastService,
    private userService: UserService
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.userId = localStorage.getItem('user_id') || '';
    if (!this.userId) {
      await this.navCtrl.navigateRoot('/login');
      return;
    }

    try {
      const res = await Http.get({
        url: `${environment.apiUrl}/auth/profile/${this.userId}`,
        headers: {},
        params: {}
      });
      const data: any = res.data;

      this.nombre = data.name;
      this.email  = data.email;
      this.balance = typeof data.balance === 'number'
        ? data.balance
        : parseFloat(data.balance) || 0;

      // Guardo en UserService y en localStorage
      this.userService.actualizarDatosParciales({
        name: data.name,
        email: data.email,
        balance: this.balance
      });

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
      // Llamada unificada pasando solo el email
      await Http.patch({
        url: `${environment.apiUrl}/auth/update-profile`,
        headers: { 'Content-Type': 'application/json' },
        data: { user_id: this.userId, email: this.newEmail },
        params: {}
      });

      this.toast.mostrarToast('Correo actualizado', 'success');
      this.userService.actualizarDatosParciales({ email: this.newEmail });
      this.email = this.newEmail;
      this.newEmail = '';

    } catch (err) {
      console.error('Error al actualizar correo:', err);
      this.toast.mostrarToast('Error al actualizar correo', 'danger');
    }
  }
}
