// api-status.service
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';                       // Emite cambios de estado a quien se suscriba
import { Http } from '@capacitor-community/http';             // Cliente HTTP nativo para el fallback ping
import { environment } from 'src/environments/environment';   // Clave de Pusher y URL de la API
import Pusher from 'pusher-js';                               // Biblioteca Pusher para eventos en tiempo real

@Injectable({ providedIn: 'root' })
export class ApiStatusService {
  // Sujeto que guarda el estado actual del backend (online/offline)
  private estadoBackend$ = new BehaviorSubject<boolean>(true);

  // Marca de tiempo de la última actualización (evento o ping)
  private ultimaActualizacion = Date.now();

  constructor() {
    // Inicia escucha de eventos en tiempo real vía Pusher
    this.iniciarMonitorPusher();
    // Inicia verificación REST cada cierto tiempo si no hay evento reciente
    this.iniciarMonitorAutomatico();
  }

  // Exponer un observable para que otros componentes puedan reaccionar
  get apiEstaDisponible() {
    return this.estadoBackend$.asObservable();
  }

  /**
   * Actualiza el estado del backend y reinicia el timestamp de respaldo
   * @param valor true = online, false = offline
   */
  actualizar(valor: boolean) {
    this.estadoBackend$.next(valor);
    this.ultimaActualizacion = Date.now();
  }

  /**
   * Configura Pusher para recibir eventos 'online'/'offline' en tiempo real
   */
  private iniciarMonitorPusher() {
    const pusher = new Pusher(environment.pusherKey, {
      cluster: 'mt1',   // Ajusta según tu configuración de Pusher
      forceTLS: true
    });

    const canal = pusher.subscribe('estado-api');

    // Evento cuando la API queda online
    canal.bind('online', () => this.actualizar(true));
    // Evento cuando la API cae offline
    canal.bind('offline', () => this.actualizar(false));
  }

  /**
   * Cada 5s evalúa si han pasado >20s sin evento; de ser así, hace un ping al /ping
   */
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
        } catch {
          this.actualizar(false);
        }
      }
      // Si hubo evento hace menos de 20s, no hacemos ping
    }, 5000);
  }
}
