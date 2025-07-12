import { Component, OnInit } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: false
})
export class Tab5Page implements OnInit {
  faq: any[] = [];
  nuevaDuda: string = '';
  tickets: any[] = [];
  filtroEstado: string = 'todos';
  ordenTicket: string = 'recientes';

  private _mostrarHistorial: boolean = false;

  get mostrarHistorial(): boolean {
    return this._mostrarHistorial;
  }
  set mostrarHistorial(valor: boolean) {
    this._mostrarHistorial = valor;
    if (valor) {
      this.obtenerTickets(); // recargar al abrir historial
    }
  }

  async ngOnInit() {
    await this.obtenerFaqs();
    await this.obtenerTickets();
  }

  get ticketsFiltrados(): any[] {
    let filtrados = [...this.tickets];

    if (this.filtroEstado !== 'todos') {
      filtrados = filtrados.filter(t => t.status === this.filtroEstado);
    }

    filtrados.sort((a, b) => {
      const fa = new Date(a.createdAt).getTime();
      const fb = new Date(b.createdAt).getTime();
      return this.ordenTicket === 'recientes' ? fb - fa : fa - fb;
    });

    return filtrados;
  }

  async obtenerFaqs() {
    try {
      const response = await Http.get({
        url: `${environment.apiUrl}/faq`,
        headers: {}
      });
      this.faq = (response.data || []).map((f: any) => ({ ...f, abierto: false }));
    } catch (error) {
      console.error('❌ Error al obtener FAQs:', error);
      this.faq = [];
    }
  }

  async obtenerTickets() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      const res = await Http.get({
        url: `${environment.apiUrl}/soporte/${userId}`,
        headers: {}
      });
      this.tickets = res.data?.tickets || [];
    } catch (error) {
      console.error('❌ Error al obtener historial de tickets:', error);
      this.tickets = [];
    }
  }

  async enviarTicket() {
    const userId = localStorage.getItem('user_id');
    if (!userId || !this.nuevaDuda.trim()) {
      alert('⚠️ Ingresa tu duda antes de enviar');
      return;
    }

    const ticket = { userId, issue: this.nuevaDuda.trim() };

    try {
      const res = await Http.post({
        url: `${environment.apiUrl}/soporte`,
        headers: { 'Content-Type': 'application/json' },
        data: ticket
      });

      alert('📩 Tu duda fue enviada correctamente');
      this.nuevaDuda = '';
      await this.obtenerTickets(); // Recargar historial
      this.mostrarHistorial = true;
    } catch (error) {
      alert('❌ Error al enviar tu ticket de soporte');
      console.error(error);
    }
  }
}
