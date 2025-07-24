import { Component, OnInit } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { ToastController } from '@ionic/angular';
import { ApiStatusService } from 'src/app/services/api-status.service';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: false
})
export class Tab5Page implements OnInit {
  faq: any[] = [];
  nuevaDuda: string = '';
  enviando: boolean = false;
    apiCaida: boolean = false;

  constructor(
    private toastCtrl: ToastController,
    private apiStatus: ApiStatusService
  ) 
  {
    this.apiStatus.apiEstaDisponible.subscribe(disponible => {
      this.apiCaida = !disponible;
    });
  }

  async ngOnInit() {
    await this.obtenerFaqs();
  }

  async obtenerFaqs() {
    try {
      const response = await Http.get({
        url: `${environment.apiUrl}/faq`,
        headers: {},
        params: {}
      });
      this.faq = (response.data || []).map((f: any) => ({ ...f, abierto: false }));
    } catch (error) {
      console.error('❌ Error al obtener FAQs:', error);
      this.faq = [];
    }
  }

  async enviarTicket() {
    // 🧭 Marca actividad manual para reiniciar temporizador del servicio
    this.apiStatus.actualizar(true);

    const userId = localStorage.getItem('user_id');
    if (!userId || !this.nuevaDuda.trim()) {
      const alerta = await this.toastCtrl.create({
        message: '⚠️ Ingresa tu duda antes de enviar',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      return alerta.present();
    }

    const ticket = { userId, issue: this.nuevaDuda.trim() };
    this.enviando = true;

    try {
      const res = await Http.post({
        url: `${environment.apiUrl}/soporte`,
        headers: { 'Content-Type': 'application/json' },
        data: ticket,
        params: {}
      });

      const toast = await this.toastCtrl.create({
        message: '📩 Tu duda fue enviada correctamente',
        duration: 2000,
        color: 'success',
        position: 'top',
        animated: true,
        cssClass: 'toast-fade-in'
      });
      await toast.present();

      this.nuevaDuda = '';
    } catch (error) {
      const err = await this.toastCtrl.create({
        message: '❌ Error al enviar tu ticket de soporte',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await err.present();
      console.error(error);
    } finally {
      this.enviando = false;
    }
  }

}
