import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import Pusher from 'pusher-js';

@Injectable({ providedIn: 'root' })
export class ApiStatusService {
  private estadoBackend$ = new BehaviorSubject<boolean>(true);
  private ultimaActualizacion = Date.now();

  constructor() {
    this.iniciarMonitorPusher();         // eventos en tiempo real
    this.iniciarMonitorAutomatico();     // respaldo cada 20s si no hay evento reciente
  }

  get apiEstaDisponible() {
    return this.estadoBackend$.asObservable();
  }

  actualizar(valor: boolean) {
    this.estadoBackend$.next(valor);
    this.ultimaActualizacion = Date.now(); // reinicia el conteo de respaldo
  }

  // 📡 Eventos en tiempo real
  private iniciarMonitorPusher() {
    const pusher = new Pusher(environment.pusherKey, {
      cluster: 'mt1',         // ajusta según tu .env
      forceTLS: true
    });

    const canal = pusher.subscribe('estado-api');

    canal.bind('online', () => this.actualizar(true));
    canal.bind('offline', () => this.actualizar(false));
  }

  // 🔄 Verificación automática solo si no hay evento reciente
  private iniciarMonitorAutomatico() {
    setInterval(async () => {
      const segundosPasados = (Date.now() - this.ultimaActualizacion) / 1000;

      if (segundosPasados > 20) {
        try {
          const res = await Http.get({ 
            url: `${environment.apiUrl}/ping`,
            headers: {},
            params: {}
          });
          this.actualizar(res.status === 200);
        } catch (_) {
          this.actualizar(false);
        }
      }
      // Si hubo evento hace menos de 20s, no hace ping
    }, 5000); // evalúa cada 5s si necesita verificar
  }
}
