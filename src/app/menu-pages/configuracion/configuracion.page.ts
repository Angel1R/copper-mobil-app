import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/services/toast.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false
})
export class ConfiguracionPage {
  userId = '';
  nombre = '';
  email = '';
  newName = '';
  newEmail = '';
  cargando = true;

  constructor(
    private navCtrl: NavController,
    private toast: ToastService,
    private userService: UserService
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

  validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validateInputs() {
    return this.newName.trim() !== '' && this.validateEmail(this.newEmail);
  }

  async guardarCambios() {
    if (!this.validateInputs()) {
      this.toast.mostrarToast('Completa los campos correctamente', 'warning');
      return;
    }

    // 1) Construir cambios sólo con propiedades definidas
    const cambios: Partial<{ name: string; email: string }> = {};
    if (this.newName && this.newName !== this.nombre) {
      cambios.name = this.newName;
    }
    if (this.newEmail && this.newEmail !== this.email) {
      cambios.email = this.newEmail;
    }

    // 2) Validar que haya al menos 1 cambio
    if (Object.keys(cambios).length === 0) {
      this.toast.mostrarToast('No hiciste ningún cambio', 'warning');
      return;
    }

    // 3) Llamar al endpoint unificado
    try {
      await Http.patch({
        url: `${environment.apiUrl}/auth/update-profile`,
        headers: { 'Content-Type': 'application/json' },
        data: { user_id: this.userId, ...cambios },
        params: {}
      });

      this.toast.mostrarToast('Perfil actualizado', 'success');

      // 4) Actualizar UserService y props locales
      this.userService.actualizarDatosParciales(cambios);

      if (cambios.name)  this.nombre = cambios.name;
      if (cambios.email) this.email  = cambios.email;

    } catch (err) {
      console.error('Error actualizando perfil:', err);
      this.toast.mostrarToast('No se pudo actualizar tu perfil', 'danger');
    }
  }
}
