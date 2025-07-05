import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import Pusher, { Channel } from 'pusher-js';
import { Browser } from '@capacitor/browser';

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
    localStorage.setItem('user_id', '684c3d33b552d9ab86f0250c');
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
  const confirmar = confirm(`¿Confirmar pago por $${plan.price} para el plan ${plan.name}?`);
  if (!confirmar) return;

  try {
    const response = await Http.post({
      url: `${environment.apiUrl}/recargas`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        planId: plan._id,
        monto: plan.price,
        fecha: new Date().toISOString()
      }
    });

    alert('✅ Recarga exitosa');
    console.log('[💾] Recarga registrada:', response.data);
  } catch (error) {
    console.error('❌ Error al registrar recarga:', error);
    alert('Hubo un problema al procesar la recarga.');
  }
}


  ngOnDestroy() {
    this.canal?.unbind_all();
    this.pusher?.disconnect();
  }

  
}
