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
  chips: any[] = [];
  filtroEstado: string = 'todos';
  ordenChips: string = 'recientes';
  busqueda: string = '';

  constructor(private navCtrl: NavController) {}

  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab2');
    setTimeout(() => {
      const activo = document.activeElement as HTMLElement;
      activo?.blur();
    }, 300);
  }

  async ngOnInit() {
    await this.obtenerChips();
  }

  async ionViewWillEnter() {
    await this.obtenerChips();
  }

  get chipsFiltrados(): any[] {
  let filtrados = [...this.chips];

  if (this.busqueda.trim().length > 0) {
    const kw = this.busqueda.trim().toLowerCase();
    filtrados = filtrados.filter(c =>
      c.nombre.toLowerCase().includes(kw) ||
      c.direccion.toLowerCase().includes(kw)
    );
  }

  return filtrados;
}


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

  async actualizar(event: any) {
    await this.obtenerChips();
    event.target.complete();
  }
}
