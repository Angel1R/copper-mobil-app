import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { ApiStatusService } from 'src/app/services/api-status.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  form: FormGroup;
  apiCaida: boolean = false;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private apiStatus: ApiStatusService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Suscribimos al estado del backend para mostrar u ocultar el banner
    this.apiStatus.apiEstaDisponible.subscribe(disponible => {
      this.apiCaida = !disponible;
    });
  }

  async iniciarSesion() {
    // Marca actividad del usuario para reiniciar el conteo automático del servicio
    this.apiStatus.actualizar(true);

    if (this.apiCaida) {
      this.toast.mostrarToast(' El servidor no está disponible en este momento. Intenta más tarde.');
      return;
    }

    if (!this.form.valid) {
      this.toast.mostrarToast(' Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    try {
      const response = await Http.post({
        url: `${environment.apiUrl}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        data: this.form.value,
        params: {}
      });

      if (response?.status === 200 && response.data?.user_id) {
        const { user_id, name, email, balance } = response.data;
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_balance', balance.toString());

        this.toast.mostrarToast(`👋 Bienvenido ${name}`);
        this.navCtrl.navigateRoot('/tabs/tab3');
      } else {
        throw response;
      }

    } catch (error: any) {
      const detalle = error?.error?.detail || '';
      let mensaje: string;

      if (detalle.includes('Credenciales inválidas')) {
        mensaje = '🔐 Usuario o contraseña incorrecta';
      } else if (error.status === 422) {
        mensaje = '⚠️ Verifica el formato de los datos ingresados';
      } else {
        mensaje = detalle || '❌ No se pudo iniciar sesión';
      }

      this.toast.mostrarToast(mensaje, 'danger');
    }
  }

}
