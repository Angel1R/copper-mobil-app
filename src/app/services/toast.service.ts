// toast.service
import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';  // Controlador de toasts de Ionic

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private toastCtrl: ToastController) {}

  /**
   * Muestra un toast con mensaje, color y duración predefinidos
   * @param mensaje Texto a mostrar
   * @param color success | warning | danger (por defecto 'success')
   */
  async mostrarToast(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,         // Duración en ms
      color,                  // Color de fondo
      position: 'top',        // Ubicación en pantalla
      animated: true,         // Animación de entrada/salida
      cssClass: 'toast-fade-in'
    });
    await toast.present();
  }
}
