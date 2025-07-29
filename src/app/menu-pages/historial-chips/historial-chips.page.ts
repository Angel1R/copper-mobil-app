// historial-chips
import { Component, OnInit } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-historial-chips',
  templateUrl: './historial-chips.page.html',
  styleUrls: ['./historial-chips.page.scss'],
  standalone: false
})
export class HistorialChipsPage implements OnInit {
  // Array de objetos solicitud de chip
  chips: any[] = [];

  // Estado de filtros y búsqueda
  filtroEstado: string = 'todos';
  ordenChips:  string = 'recientes';
  busqueda:    string = '';

  constructor(private navCtrl: NavController) {}

  // Navega de vuelta a la pestaña de planes
  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab2');
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.blur();
    }, 300);
  }

  // Carga inicial de datos al crear el componente
  async ngOnInit() {
    await this.obtenerChips();
  }

  // Vuelve a cargar datos cada vez que entra en la vista
  async ionViewWillEnter() {
    await this.obtenerChips();
  }

  // Getter que filtra por búsqueda y por estado (a implementar si se necesita)
  get chipsFiltrados(): any[] {
    let filtrados = [...this.chips];
    // Filtrado por búsqueda en nombre o dirección
    if (this.busqueda.trim().length > 0) {
      const kw = this.busqueda.trim().toLowerCase();
      filtrados = filtrados.filter(c =>
        c.nombre.toLowerCase().includes(kw) ||
        c.direccion.toLowerCase().includes(kw)
      );
    }
    // Retornar array filtrado
    return filtrados;
  }

  // Llama al endpoint GET /chips/{userId}
  async obtenerChips() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const res = await Http.get({
        url: `${environment.apiUrl}/chips/${userId}`,
        headers: {},
        params: {}
      });
      this.chips = res.data?.chips || [];
    } catch (error) {
      console.error('❌ Error al obtener historial de chips:', error);
      this.chips = [];
    }
  }

  // Maneja pull-to-refresh
  async actualizar(event: any) {
    await this.obtenerChips();
    event.target.complete();
  }
}
