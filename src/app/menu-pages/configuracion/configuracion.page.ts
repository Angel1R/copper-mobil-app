// configuracion
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
  // ID de usuario almacenado en LocalStorage
  userId = '';

  // Datos actuales del usuario
  nombre = '';
  email = '';

  // Campos editables en el formulario
  newName = '';
  newEmail = '';

  // Flag que indica si los datos aún están cargando
  cargando = true;

  constructor(
    private navCtrl: NavController, // Para navegación
    private toast: ToastService,    // Para mostrar mensajes
    private userService: UserService// Servicio para actualizar datos globales
  ) {}

  /**
   * Hook de Ionic que se ejecuta cada vez que la vista entra en pantalla.
   * - Verifica existencia de userId.
   * - Obtiene datos de perfil desde API.
   * - Maneja estados de carga y errores.
   */
  async ionViewWillEnter() {
    this.userId = localStorage.getItem('user_id') || '';
    if (!this.userId) {
      // Si no hay sesión, redirigir a login
      await this.navCtrl.navigateRoot('/login');
      return;
    }

    try {
      // Petición para obtener perfil
      const res = await Http.get({
        url: `${environment.apiUrl}/auth/profile/${this.userId}`,
        headers: {},
        params: {}
      });
      const data: any = res.data;
      // Asignar datos actuales y valores iniciales de formulario
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

  /**
   * Regresa a la pestaña 3 (home) y desenfoca campos de input.
   */
  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab3');
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.blur();
    }, 300);
  }

  /**
   * Valida el formato de un email usando regex.
   */
  validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Comprueba que los campos no estén vacíos y el email sea válido.
   */
  validateInputs() {
    return this.newName.trim() !== '' && this.validateEmail(this.newEmail);
  }

  /**
   * Guarda cambios de perfil:
   * - Valida inputs.
   * - Construye payload con cambios.
   * - Llama a PATCH /auth/update-profile.
   * - Actualiza servicio y estados locales.
   * - Muestra toasts de éxito o error.
   */
  async guardarCambios() {
    // Validación inicial
    if (!this.validateInputs()) {
      this.toast.mostrarToast('Completa los campos correctamente', 'warning');
      return;
    }

    // Construir sólo propiedades modificadas
    const cambios: Partial<{ name: string; email: string }> = {};
    if (this.newName && this.newName !== this.nombre) {
      cambios.name = this.newName;
    }
    if (this.newEmail && this.newEmail !== this.email) {
      cambios.email = this.newEmail;
    }

    // Si no hay cambios, notificar
    if (Object.keys(cambios).length === 0) {
      this.toast.mostrarToast('No hiciste ningún cambio', 'warning');
      return;
    }

    try {
      // Petición PATCH al endpoint de actualización de perfil
      await Http.patch({
        url: `${environment.apiUrl}/auth/update-profile`,
        headers: { 'Content-Type': 'application/json' },
        data: { user_id: this.userId, ...cambios },
        params: {}
      });

      this.toast.mostrarToast('Perfil actualizado', 'success');

      // Actualizar datos en UserService y variables locales
      this.userService.actualizarDatosParciales(cambios);
      if (cambios.name) {
        this.nombre = cambios.name;
      }
      if (cambios.email) {
        this.email = cambios.email;
      }
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      this.toast.mostrarToast('No se pudo actualizar tu perfil', 'danger');
    }
  }
}
