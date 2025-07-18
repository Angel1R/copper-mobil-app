import { Component } from '@angular/core';
import { ApiStatusService } from './services/api-status.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private apiStatus: ApiStatusService) {
    // El servicio empieza a monitorear automáticamente
  }
}