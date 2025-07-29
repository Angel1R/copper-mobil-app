// src/app/tab5/tab5.page.ts
import { Component, OnInit } from '@angular/core';              // Ciclo de vida OnInit
import { Http } from '@capacitor-community/http';                // Cliente HTTP nativo de Capacitor
import { environment } from 'src/environments/environment';      // URL de la API
import { ToastController } from '@ionic/angular';                // Controlador para mostrar toasts
import { ApiStatusService } from 'src/app/services/api-status.service';  // Servicio para estado del backend

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: false
})
export class Tab5Page implements OnInit {
  
  // ► Listado de FAQs obtenido del backend
  faq: any[] = [];

  // ► Texto ingresado por el usuario para crear un nuevo ticket
  nuevaDuda: string = '';

  // ► Flag que indica si se está enviando la petición de soporte
  enviando: boolean = false;

  // ► True cuando el backend está offline (bloquea acciones)
  apiCaida: boolean = false;

  constructor(
    private toastCtrl: ToastController,
    private apiStatus: ApiStatusService
  ) {
    // Suscribirse a cambios en la disponibilidad del backend
    this.apiStatus.apiEstaDisponible
      .subscribe(disponible => this.apiCaida = !disponible);
  }

  /**
   * Hook de Angular: al inicializar el componente, cargamos las FAQs.
   */
  async ngOnInit() {
    await this.obtenerFaqs();
  }

  /**
   * Llama al endpoint GET /faq para poblar el array de preguntas frecuentes.
   * Cada FAQ recibe la propiedad `abierto: false` para controlar su despliegue en UI.
   */
  async obtenerFaqs() {
    try {
      const response = await Http.get({
        url: `${environment.apiUrl}/faq`,
        headers: {},
        params: {}
      });
      // Mapear cada FAQ y agregar flag de UI
      this.faq = (response.data || []).map((f: any) => ({
        ...f,
        abierto: false
      }));
    } catch (error) {
      console.error('❌ Error al obtener FAQs:', error);
      // En caso de fallo, dejar array vacío
      this.faq = [];
    }
  }

  /**
   * Envía un nuevo ticket de soporte:
   * - Verifica que el backend esté online (reinicia contador de ApiStatusService).
   * - Valida que exista userId y texto de la duda.
   * - Llama a POST /soporte con `{ userId, issue }`.
   * - Muestra toast de éxito o error.
   */
  async enviarTicket() {
    // Forzar actualización del estado del backend (reinicia ping automático)
    this.apiStatus.actualizar(true);

    const userId = localStorage.getItem('user_id');
    // Validar datos mínimos
    if (!userId || !this.nuevaDuda.trim()) {
      const alerta = await this.toastCtrl.create({
        message: '⚠️ Ingresa tu duda antes de enviar',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      return alerta.present();
    }

    // Construir payload
    const ticket = {
      userId,
      issue: this.nuevaDuda.trim()
    };

    this.enviando = true;
    try {
      // Enviar al servidor
      await Http.post({
        url: `${environment.apiUrl}/soporte`,
        headers: { 'Content-Type': 'application/json' },
        data: ticket,
        params: {}
      });

      // Mostrar toast de confirmación
      const toast = await this.toastCtrl.create({
        message: '📩 Tu duda fue enviada correctamente',
        duration: 2000,
        color: 'success',
        position: 'top',
        animated: true,
        cssClass: 'toast-fade-in'
      });
      await toast.present();

      // Resetear campo de texto
      this.nuevaDuda = '';
    } catch (error) {
      console.error('❌ Error al enviar ticket de soporte:', error);
      // Toast de error
      const errToast = await this.toastCtrl.create({
        message: '❌ Error al enviar tu ticket de soporte',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await errToast.present();
    } finally {
      // Levantar la bandera de envío
      this.enviando = false;
    }
  }
}
