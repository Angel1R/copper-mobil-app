import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  form: FormGroup;

  constructor(private fb: FormBuilder, private navCtrl: NavController) {
    this.form = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(5)]],  // puedes ajustar mínimo si usas correo
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async iniciarSesion() {
    if (!this.form.valid) {
      alert('⚠️ Por favor completa todos los campos correctamente');
      return;
    }

    try {
      const response = await Http.post({
        url: `${environment.apiUrl}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        data: this.form.value
      });

      // Verificamos si el backend respondió correctamente
      if (response?.status === 200 && response.data?.user_id) {
        const { user_id, name, email, balance } = response.data;
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_balance', balance.toString());

        alert(`👋 Bienvenido ${name}`);
        this.navCtrl.navigateRoot('/tabs/tab2');
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

      alert(mensaje);
    }
  }
}
