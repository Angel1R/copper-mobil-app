import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false
})
export class ConfiguracionPage {
  userId: string = '';
  nombre: string = '';
  email: string = '';
  newName: string = '';
  newEmail: string = '';
  cargando: boolean = true;

  constructor(
    private navCtrl: NavController,
    private toast: ToastService
  ) {}

  async ionViewWillEnter() {
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
      this.nombre = data.name || '';
      this.email = data.email || '';
      this.newName = data.name || '';
      this.newEmail = data.email || '';
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      this.toast.mostrarToast('No se pudo cargar la configuración', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab3');
    setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 300);
  }

  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validateInputs(): boolean {
    return this.newName.trim() !== '' && this.validateEmail(this.newEmail);
  }

  async guardarCambios() {
    if (!this.validateInputs()) {
      this.toast.mostrarToast('Completa los campos correctamente', 'warning');
      return;
    }

    try {
      await Http.patch({
        url: `${environment.apiUrl}/auth/update-email`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          user_id: this.userId,
          email: this.newEmail
        },
        params: {}
      });

      await Http.patch({
        url: `${environment.apiUrl}/auth/update-name`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          user_id: this.userId,
          name: this.newName
        },
        params: {}
      });

      this.toast.mostrarToast('Perfil actualizado', 'success');
      this.email = this.newEmail;
      this.nombre = this.newName;

      localStorage.setItem('user_email', this.newEmail);
      localStorage.setItem('user_name', this.newName);
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      this.toast.mostrarToast('No se pudo actualizar tu perfil', 'danger');
    }
  }
}
