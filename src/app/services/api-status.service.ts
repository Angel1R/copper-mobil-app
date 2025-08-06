// src/app/services/api-status.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { environment } from 'src/environments/environment';
import Pusher from 'pusher-js';

// 1. Definimos el enum en lugar de union de strings
export enum EstadoApp {
  DispositivoOffline = 'dispositivo_offline',
  ApiOk            = 'api_ok',
  ApiMantenimiento = 'api_mantenimiento'
}

@Injectable({ providedIn: 'root' })
export class ApiStatusService {
  private estadoBackend$    = new BehaviorSubject<boolean>(true);
  private estadoDispositivo$= new BehaviorSubject<boolean>(true);

  private estadoAppSubject  = new BehaviorSubject<EstadoApp>(EstadoApp.ApiOk);
  readonly estadoApp$       = this.estadoAppSubject.asObservable();

  private apiDisponibleSubject = new BehaviorSubject<boolean>(true);
  readonly apiEstaDisponible   = this.apiDisponibleSubject.asObservable();

  private ultimaActualizacion = Date.now();

  constructor() {
    this.iniciarMonitorRed();
    this.iniciarMonitorPusher();
    this.iniciarMonitorAutomatico();
    this.clasificarEstadoApp();
  }

  // Método público para “resetear” desde el login
  actualizar(valor: boolean) {
    this.actualizarEstadoBackend(valor);
  }

  private clasificarEstadoApp() {
    const backend    = this.estadoBackend$.getValue();
    const dispositivo= this.estadoDispositivo$.getValue();

    let nuevoEstado: EstadoApp;
    if (!dispositivo) {
      nuevoEstado = EstadoApp.DispositivoOffline;
    } else if (backend) {
      nuevoEstado = EstadoApp.ApiOk;
    } else {
      nuevoEstado = EstadoApp.ApiMantenimiento;
    }

    this.estadoAppSubject.next(nuevoEstado);
    this.apiDisponibleSubject.next(nuevoEstado === EstadoApp.ApiOk);
  }

  private actualizarEstadoBackend(valor: boolean) {
    this.estadoBackend$.next(valor);
    this.ultimaActualizacion = Date.now();
    this.clasificarEstadoApp();
  }

  private actualizarEstadoDispositivo(conectado: boolean) {
    this.estadoDispositivo$.next(conectado);
    this.clasificarEstadoApp();
  }

  private iniciarMonitorPusher() {
    const pusher = new Pusher(environment.pusherKey, {
      cluster: 'mt1',
      forceTLS: true,
    });
    const canal = pusher.subscribe('estado-api');
    canal.bind('online',  () => this.actualizarEstadoBackend(true));
    canal.bind('offline', () => this.actualizarEstadoBackend(false));
  }

  private iniciarMonitorAutomatico() {
    setInterval(async () => {
      if (!this.estadoDispositivo$.value) return;

      const segs = (Date.now() - this.ultimaActualizacion) / 1000;
      if (segs <= 20) return;

      try {
        const res = await Http.get({ url: `${environment.apiUrl}/ping` });
        this.actualizarEstadoBackend(res.status === 200);
      } catch {
        this.actualizarEstadoBackend(false);
      }
    }, 5000);
  }

  private async iniciarMonitorRed() {
    const status = await Network.getStatus();
    this.actualizarEstadoDispositivo(status.connected);
    Network.addListener('networkStatusChange', s =>
      this.actualizarEstadoDispositivo(s.connected)
    );
  }
}
