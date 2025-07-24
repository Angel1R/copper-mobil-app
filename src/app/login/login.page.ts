import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { ApiStatusService } from '../services/api-status.service';
import { ToastService } from '../services/toast.service';

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

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private apiStatus: ApiStatusService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      phone: ['', [Validators.required, Validators.minLength(12)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.apiStatus.apiEstaDisponible.subscribe(
      disponible => this.apiCaida = !disponible
    );

    // Limpia el mensaje de error al modificar campos
    this.form.valueChanges.subscribe(() => this.loginError = '');
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

    const { phone, password } = this.form.value;

    try {
      const response = await Http.post({
        url: `${environment.apiUrl}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone, password }
      });

      if (response.status === 200 && response.data?.user_id) {
        const { user_id, name, balance } = response.data;
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_balance', balance.toString());

        this.toast.mostrarToast(`👋 Bienvenido ${name}`);
        this.navCtrl.navigateRoot('/tabs/tab3');
      } else {
        // cualquier otro status lo capturamos abajo
        throw { status: response.status, error: response.data };
      }

    } catch (err: any) {
      if (err.status === 404) {
        // cuenta no encontrada
        this.loginError = '❗ Esta cuenta no existe';
        this.toast.mostrarToast(this.loginError, 'warning');

      } else if (err.status === 401 || err.error?.detail?.includes('Credenciales inválidas')) {
        // usuario existe pero password mal
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
