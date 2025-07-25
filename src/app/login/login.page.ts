import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { ApiStatusService } from '../services/api-status.service';
import { ToastService } from '../services/toast.service';
import { LADAS } from '../services/contstants';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  form: FormGroup;
  apiCaida = false;
  loginError = '';
  ladas = LADAS;
  mostrarPassword = false;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private apiStatus: ApiStatusService,
    private toast: ToastService
  ) {
    // Inicializa el formulario con lada seleccionada por defecto
    this.form = this.fb.group({
      lada: [this.ladas[0].code], // por defecto México 🇲🇽
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Suscripción al estado del servidor
    this.apiStatus.apiEstaDisponible.subscribe(
      disponible => this.apiCaida = !disponible
    );

    // Limpia error al modificar
    this.form.valueChanges.subscribe(() => this.loginError = '');

    // Ajusta validadores del teléfono según lada elegida
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

  get tipoPassword() {
    return this.mostrarPassword ? 'text' : 'password';
  }

  alternarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  private normalizarTelefono(phone: string, lada: string): string {
    const digitos = phone.trim().replace(/\D+/g, '');
    if (digitos.startsWith(lada)) return digitos;
    return `${lada}${digitos}`;
  }

  getMinDigitsSeleccionados(): number {
    const code = this.form.get('lada')?.value;
    const ladaObj = this.ladas.find(l => l.code === code);
    return ladaObj?.minDigits || 0;
  }

  async iniciarSesion() {
    this.apiStatus.actualizar(true);

    if (this.apiCaida) {
      this.toast.mostrarToast('⚠️ Servidor no disponible. Intenta más tarde.', 'warning');
      return;
    }

    if (!this.form.valid) {
      this.toast.mostrarToast('⚠️ Completa todos los campos correctamente', 'warning');
      return;
    }

    const { lada, phone, password } = this.form.value;
    const telefonoNormalizado = this.normalizarTelefono(phone, lada);

    try {
      const response = await Http.post({
        url: `${environment.apiUrl}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone: telefonoNormalizado, password },
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