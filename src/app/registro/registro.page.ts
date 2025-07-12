import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false
})
export class RegistroPage {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async registrar() {
    if (!this.form.valid) {
      alert('⚠️ Por favor completa todos los campos correctamente');
      return;
    }

    const data = {
      ...this.form.value,
      balance: 0.0,
      plan: "sin_plan",
      transactions: []
    };

    try {
      const response = await Http.post({
        url: `${environment.apiUrl}/users/`,
        headers: { 'Content-Type': 'application/json' },
        data
      });

      if (response?.status === 200) {
        alert('✅ Usuario creado con éxito');
        this.navCtrl.navigateRoot('/login');
      } else {
        throw response;
      }

    } catch (error: any) {
      const detalle: string = error?.error?.detail || '';

      let mensaje: string;

      if (detalle.includes('teléfono')) {
        mensaje = '📞 El número de teléfono ya está registrado';
      } else if (detalle.includes('correo')) {
        mensaje = '📧 El correo ya está registrado';
      } else if (error.status === 422) {
        mensaje = '⚠️ Verifica que todos los campos cumplan con los requisitos mínimos';
      } else {
        mensaje = detalle || '❌ No se pudo registrar el usuario';
      }

      alert(mensaje);
    }
  }
}
