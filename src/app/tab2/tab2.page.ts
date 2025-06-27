import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import Pusher, { Channel } from 'pusher-js';

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

  ngOnDestroy() {
    this.canal?.unbind_all();
    this.pusher?.disconnect();
  }
}
