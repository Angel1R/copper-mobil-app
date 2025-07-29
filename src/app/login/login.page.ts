// login.page.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';               // Formularios reactivos
import { Http } from '@capacitor-community/http';                                   // Cliente HTTP nativo
import { NavController } from '@ionic/angular';                                     // Navegación entre páginas
import { environment } from 'src/environments/environment';                         // URL de la API
import { ApiStatusService } from '../services/api-status.service';                  // Estado del backend
import { ToastService } from '../services/toast.service';                           // Notificaciones tipo toast
import { LADAS } from '../services/contstants';                                     // Listado de prefijos telefónicos

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  // Formulario con campos: lada, phone y password
  form: FormGroup;
  apiCaida = false;            // True si el backend responde offline
  loginError = '';             // Mensaje de error a mostrar en UI
  ladas = LADAS;               // Prefijos disponibles
  mostrarPassword = false;     // Control para alternar visibilidad

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private apiStatus: ApiStatusService,
    private toast: ToastService
  ) {
    // 1) Inicializamos el formulario
    this.form = this.fb.group({
      lada: [this.ladas[0].code],              // Prefijo por defecto
      phone: ['', Validators.required],         // Número (sin lada)
      password: ['', [Validators.required, Validators.minLength(6)]]  // Contraseña mínima de 6 caracteres
    });

    // 2) Monitor del estado del backend (Pusher + ping automático)
    this.apiStatus.apiEstaDisponible
      .subscribe(disponible => this.apiCaida = !disponible);

    // 3) Limpiar mensaje de error al modificar campos
    this.form.valueChanges.subscribe(() => this.loginError = '');

    // 4) Validadores dinámicos: ajusta la longitud de phone según la lada
    const ladaCtrl = this.form.controls['lada'];
    const phoneCtrl = this.form.controls['phone'];

    ladaCtrl.valueChanges.subscribe((code: string) => {
      const cfg = this.ladas.find(l => l.code === code)!;
      phoneCtrl.setValidators([
        Validators.required,
        Validators.minLength(cfg.minDigits),
        Validators.maxLength(cfg.minDigits)
      ]);
      phoneCtrl.updateValueAndValidity();
    });
  }

  // Getter para alternar el tipo de input: 'password' o 'text'
  get tipoPassword() {
    return this.mostrarPassword ? 'text' : 'password';
  }

  // Método para cambiar la visibilidad de la contraseña
  alternarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // Normaliza el número: quita no dígitos y antepone la lada si falta
  private normalizarTelefono(phone: string, lada: string): string {
    const digitos = phone.trim().replace(/\D+/g, '');
    return digitos.startsWith(lada) ? digitos : `${lada}${digitos}`;
  }

  // Retorna la longitud mínima seleccionada (para validaciones en template)
  getMinDigitsSeleccionados(): number {
    const code = this.form.get('lada')?.value;
    return this.ladas.find(l => l.code === code)?.minDigits || 0;
  }

  // Método principal: procesa el inicio de sesión
  async iniciarSesion() {
    // Reset del monitor automático (ping)
    this.apiStatus.actualizar(true);

    // 1) Bloquear si backend está offline
    if (this.apiCaida) {
      this.toast.mostrarToast('⚠️ Servidor no disponible. Intenta más tarde.', 'warning');
      return;
    }

    // 2) Validar formulario
    if (!this.form.valid) {
      this.toast.mostrarToast('⚠️ Completa todos los campos correctamente', 'warning');
      return;
    }

    // 3) Preparar payload
    const { lada, phone, password } = this.form.value;
    const telefono = this.normalizarTelefono(phone, lada);

    try {
      // 4) Llamada al endpoint de login
      const response = await Http.post({
        url: `${environment.apiUrl}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone: telefono, password },
        params: {}
      });

      // 5) Éxito: guardar datos en localStorage y navegar
      if (response.status === 200 && response.data?.user_id) {
        const { user_id, name, balance } = response.data;
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_balance', balance.toString());
        this.toast.mostrarToast(`👋 Bienvenido ${name}`);
        this.navCtrl.navigateRoot('/tabs/tab3');
      } else {
        throw { status: response.status, error: response.data };
      }

    } catch (err: any) {
      // 6) Manejo de errores según status
      if (err.status === 404) {
        this.loginError = '❗ Esta cuenta no existe';
        this.toast.mostrarToast(this.loginError, 'warning');
      } else if (err.status === 401 || err.error?.detail?.includes('Credenciales inválidas')) {
        this.loginError = '🔐 Teléfono o contraseña incorrectos';
        this.toast.mostrarToast(this.loginError, 'warning');
      } else if (err.status === 422) {
        this.loginError = '⚠️ Formato de datos inválido';
        this.toast.mostrarToast(this.loginError, 'warning');
      } else {
        this.loginError = '❌ No se pudo iniciar sesión';
        this.toast.mostrarToast(this.loginError, 'danger');
      }
    }
  }
}
