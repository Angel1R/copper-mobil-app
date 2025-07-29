// historial-tickets
import { Component, OnInit } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-historial-tickets',
  templateUrl: './historial-tickets.page.html',
  styleUrls: ['./historial-tickets.page.scss'],
  standalone: false
})
export class HistorialTicketsPage implements OnInit {
  tickets: any[] = [];
  filtroEstado: string = 'todos';
  ordenTicket:  string = 'recientes';
  busqueda:      string = '';

  constructor(private navCtrl: NavController) {}

  volverAHome() {
    this.navCtrl.navigateBack('/tabs/tab3');
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.blur();
    }, 300);
  }

  ngOnInit() {
    this.obtenerTickets();
  }

  ionViewWillEnter() {
    this.obtenerTickets();
  }

  get ticketsFiltrados(): any[] {
    let filtrados = [...this.tickets];

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(t => t.status === this.filtroEstado);
    }

    // Filtrar por búsqueda en el asunto
    if (this.busqueda.trim().length) {
      const kw = this.busqueda.trim().toLowerCase();
      filtrados = filtrados.filter(t =>
        t.issue.toLowerCase().includes(kw)
      );
    }

    // Ordenar por fecha (recientes o antiguos)
    filtrados.sort((a, b) => {
      const fa = new Date(a.createdAt).getTime();
      const fb = new Date(b.createdAt).getTime();
      return this.ordenTicket === 'recientes' ? fb - fa : fa - fb;
    });

    return filtrados;
  }

  async obtenerTickets() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const res = await Http.get({
        url: `${environment.apiUrl}/soporte/${userId}`,
        headers: {},
        params: {}
      });
      this.tickets = res.data?.tickets || [];
    } catch (error) {
      console.error('❌ Error al obtener historial de tickets:', error);
      this.tickets = [];
    }
  }

  async actualizar(event: any) {
    await this.obtenerTickets();
    event.target.complete();
  }
}
