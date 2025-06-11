import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  // Variables para almacenar los datos ingresados por el usuario
  phoneNumber: string = ''; // Número de teléfono ingresado
  password: string = '';    // Contraseña ingresada

  constructor(private navCtrl: NavController) {}

  // Validación del número de teléfono y contraseña
  get isValidLogin(): boolean {
    return this.phoneNumber.replace(/\D/g, '').length === 10 && this.password.length > 0;  
    // Verifica que el número tenga 10 dígitos y que la contraseña no esté vacía
  }

  // Función para iniciar sesión
  login() {
    // Elimina cualquier carácter que no sea numérico del número de teléfono
    this.phoneNumber = this.phoneNumber.replace(/\D/g, '');

    if (this.isValidLogin) {
      console.log('Inicio de sesión exitoso.');
      this.navCtrl.navigateForward('/tabs'); // Redirige al usuario a las pestañas principales
    } else {
      console.log('Datos inválidos.');
    }
  }

  // Función para redirigir al usuario al registro si no tiene cuenta
  goToRegister() {
    this.navCtrl.navigateForward('/registro');
  }
}
