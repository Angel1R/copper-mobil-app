import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ApiStatusService, EstadoApp } from './services/api-status.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private apiStatus: ApiStatusService
  ) {
    this.initializeApp();
  }

  private async initializeApp() {
    await this.platform.ready();

    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#000000ff' });
      } catch (err) {
        console.warn('StatusBar plugin no disponible', err);
      }
    }

    this.apiStatus.estadoApp$.subscribe((estado: EstadoApp) => {
      switch (estado) {
        case 'dispositivo_offline':
          // console.log('🚫 Sin conexión en tu dispositivo.');
          break;
        case 'api_mantenimiento':
          // console.log('🛠 API en mantenimiento.');
          break;
        case 'api_ok':
        default:
          // console.log('✅ Todo en orden.');
          break;
      }
    });
  }
}
