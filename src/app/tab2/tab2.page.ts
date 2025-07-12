import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import Pusher, { Channel } from 'pusher-js';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app'; // Para capturar deep links

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnInit, OnDestroy {
  planes: any[] = [];
  cargando: boolean = true;
  pusher: Pusher | null = null;
  canal: Channel | null = null;

  async ngOnInit() {
    await this.obtenerPlanes();
    this.iniciarPusher();
    this.configurarDeepLinks();
    // ❌ Eliminar simulación — ya se guarda en login
  }

  configurarDeepLinks() {
    App.addListener('appUrlOpen', async ({ url }) => {
      console.log('🔗 Deep link recibido:', url);

      const parsed = new URL(url);
      const ruta = parsed.pathname;
      const paymentId = parsed.searchParams.get('payment_id');

      if (ruta === '/pago-exitoso' && paymentId) {
        const response = await Http.get({
          url: `${environment.apiUrl}/pago/validar`,
          params: { payment_id: paymentId }
        });

        if (response.data.approved) {
          alert('✅ Recarga confirmada con éxito');
        } else {
          alert('⚠️ El pago no fue aprobado');
        }
      } else if (ruta === '/pago-fallido') {
        alert('❌ El pago fue rechazado');
      } else if (ruta === '/pago-pendiente') {
        alert('⏳ El pago está pendiente');
      }
    });
  }

  async obtenerPlanes() {
    this.cargando = true;
    try {
      const response = await Http.get({
        url: `${environment.apiUrl}/planes`,
        headers: {},
        params: {}
      });
      this.planes = response.data || [];
    } catch (error) {
      console.error('❌ Error al obtener planes:', error);
      this.planes = [];
    } finally {
      this.cargando = false;
    }
  }

  iniciarPusher() {
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster
    });

    this.canal = this.pusher.subscribe('planes-channel') as Channel;

    this.canal.bind('planes_actualizados', () => {
      console.log('[📡] Planes actualizados vía Pusher');
      this.obtenerPlanes();
    });

    this.canal.bind('pusher:subscription_error', (status: any) => {
      console.error('❌ Error al suscribirse a Pusher:', status);
    });
  }

  async iniciarRecarga(plan: any) {
    const userId = localStorage.getItem('user_id');

    if (!userId || userId.length < 10) {
      alert('⚠️ Debes iniciar sesión correctamente para hacer una recarga');
      return;
    }

    const payload = {
      title: plan.name,
      price: plan.price,
      user_id: userId
    };

    console.log('📦 Enviando datos al backend:', payload);

    try {
      const response = await Http.post({
        url: `${environment.apiUrl}/pago/mercadopago`,
        headers: { 'Content-Type': 'application/json' },
        data: payload
      });

      const initPoint = response.data?.init_point;
      console.log('🔍 Resultado completo:', response.data);

      if (initPoint) {
        await Browser.open({ url: initPoint });
      } else {
        alert('No se pudo generar el enlace de pago');
      }

    } catch (error: any) {
      console.error('❌ Error al iniciar pago:', error);
      alert(error?.error?.detail || 'Hubo un problema al contactar con el sistema de pagos');
    }
  }

  ngOnDestroy() {
    this.canal?.unbind_all();
    this.pusher?.disconnect();
  }
}
