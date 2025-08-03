import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ApiStatusService } from './services/api-status.service';

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

    // Solo ejecutamos en plataforma nativa
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Asegura que el contenido no se extienda bajo la status bar
      await StatusBar.setOverlaysWebView({ overlay: false });

      // Define el estilo claro u oscuro según el diseño de tu app
      await StatusBar.setStyle({ style: Style.Dark });

      // Puedes definir un color si lo deseas
      await StatusBar.setBackgroundColor({ color: '#000000ff' });
    } catch (err) {
      console.warn('StatusBar plugin no disponible', err);
    }
  }
}
