import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false
})
export class RegistroPage {
  // Variables para almacenar los datos ingresados por el usuario
  phoneNumber: string = ''; // Número de teléfono (solo números, máximo 10 dígitos)
  password: string = '';    // Contraseña ingresada por el usuario
  verificationCode: string = ''; // Código de verificación (6 dígitos)
  codigoEnviado: boolean = false; // Controla si el código ya fue enviado

  constructor(private navCtrl: NavController) {}

  // Validación del número de teléfono (debe tener exactamente 10 dígitos)
  get isPhoneValid(): boolean {
    return this.phoneNumber.length === 10;
  }

  // Validación del código de verificación (debe tener 6 dígitos)
  get isCodeValid(): boolean {
    return this.verificationCode.length === 6;
  }

  // Función que filtra la entrada del usuario en el campo de teléfono
  validatePhone(event: any) {
    // Reemplaza cualquier carácter que no sea un número (elimina letras y símbolos)
    const inputValue = event.target.value.replace(/[^0-9]/g, '');
    
    // Limita la entrada a un máximo de 10 dígitos
    this.phoneNumber = inputValue.slice(0, 10);
  }

  // Simulación del envío de código de verificación (solo si el número es válido)
  sendCode() {
    if (this.isPhoneValid) {
      console.log('Código enviado a:', this.phoneNumber);
      this.codigoEnviado = true;
    }
  }

  // Simulación de verificación del código ingresado (solo si es válido)
  verifyCode() {
    if (this.isCodeValid) {
      console.log('Verificando código:', this.verificationCode);
      
      // ✅ Redirige al usuario a la pantalla de login tras la verificación
      this.navCtrl.navigateForward('/login');
    }
  }

  // Redirige al usuario al login si ya tiene una cuenta
  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }
}
