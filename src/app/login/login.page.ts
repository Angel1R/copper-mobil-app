// src/app/login/login.page.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { NavController } from '@ionic/angular';
import { ApiStatusService, EstadoApp } from '../services/api-status.service';
import { ToastService } from '../services/toast.service';
import { LADAS } from '../services/contstants';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  form: FormGroup;
  loginError = '';
  mostrarPassword = false;
  EstadoApp = EstadoApp;
  estadoApp!: EstadoApp;
  ladas = LADAS;

  // Getter que expone al template si estamos en caída (offline o mantenimiento)
  get apiCaida(): boolean {
    return this.estadoApp !== EstadoApp.ApiOk;
  }

  constructor(
    private fb: FormBuilder,
    private apiStatus: ApiStatusService,
    private toast: ToastService,
    private navCtrl: NavController
  ) {
    // 1) Inicializar formulario
    this.form = this.fb.group({
      lada:     [this.ladas[0].code],
      phone:    ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // 2) Suscribirse al estado combinado de red/API
    this.apiStatus.estadoApp$.subscribe(estado => {
      this.estadoApp = estado;
    });

    // 3) Limpiar loginError al input
    this.form.valueChanges.subscribe(() => (this.loginError = ''));

    // 4) Validación dinámica de length según LADA
    this.form.controls['lada'].valueChanges.subscribe(code => {
      const cfg = this.ladas.find(l => l.code === code)!;
      const phoneCtrl = this.form.controls['phone'];
      phoneCtrl.setValidators([
        Validators.required,
        Validators.minLength(cfg.minDigits),
        Validators.maxLength(cfg.minDigits)
      ]);
      phoneCtrl.updateValueAndValidity();
    });
  }

  get tipoPassword(): string {
    return this.mostrarPassword ? 'text' : 'password';
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  private normalizarTelefono(phone: string, lada: string): string {
    const digitos = phone.trim().replace(/\D+/g, '');
    return digitos.startsWith(lada) ? digitos : `${lada}${digitos}`;
  }

  getMinDigitsSeleccionados(): number {
    const code = this.form.get('lada')?.value;
    return this.ladas.find(l => l.code === code)?.minDigits || 0;
  }

  async iniciarSesion(): Promise<void> {
    // 1) Pre–check con el estado desde ApiStatusService
    if (this.estadoApp === EstadoApp.DispositivoOffline) {
      this.toast.mostrarToast(
        '📴 Sin conexión en tu dispositivo. Revisa Wi-Fi o datos.',
        'warning'
      );
      return;
    }

    if (this.estadoApp === EstadoApp.ApiMantenimiento) {
      this.toast.mostrarToast(
        '🛠 Servidor en mantenimiento. Intenta más tarde.',
        'warning'
      );
      return;
    }

    // 2) Validación de formulario
    if (!this.form.valid) {
      this.toast.mostrarToast(
        '⚠️ Completa todos los campos correctamente',
        'warning'
      );
      return;
    }

    // 3) Preparar payload
    const { lada, phone, password } = this.form.value;
    const telefono = this.normalizarTelefono(phone, lada);

    try {
      // 4) Llamada al login
      const response = await Http.post({
        url:    `${environment.apiUrl}/auth/login`,
        headers:{ 'Content-Type': 'application/json' },
        data:   { phone: telefono, password },
        params: {}
      });

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
      // 5) Manejo de errores HTTP
      if (err.status === 404) {
        this.loginError = '❗ Esta cuenta no existe';
      } else if (err.status === 401 || err.error?.detail?.includes('Credenciales inválidas')) {
        this.loginError = '🔐 Teléfono o contraseña incorrectos';
      } else if (err.status === 422) {
        this.loginError = '⚠️ Formato de datos inválido';
      } else {
        this.loginError = '❌ No se pudo iniciar sesión';
      }

      this.toast.mostrarToast(
        this.loginError,
        err.status === 422 ? 'warning' : 'danger'
      );
    }
  }
}
