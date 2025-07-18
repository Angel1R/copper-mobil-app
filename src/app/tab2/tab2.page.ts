import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import Pusher, { Channel } from 'pusher-js';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnInit, OnDestroy {
  planes: any[] = [];
  cargando: boolean = true;
  pusher: Pusher | null = null;
  canal: Channel | null = null;
  errorAlCargarPlanes: boolean = false;

  vistaSeleccionada: string = 'planes';

  chipForm = {
    tipo: 'nueva',
    nombre: '',
    telefono: '',
    direccion: ''
  };

  enviandoSolicitud: boolean = false;

  get telefonoValido(): boolean {
    return /^[0-9]{10}$/.test(this.chipForm.telefono.trim());
  }

  async ngOnInit() {
    await this.obtenerPlanes();
    this.iniciarPusher();
    this.configurarDeepLinks();
  }

  configurarDeepLinks() {
    App.addListener('appUrlOpen', async ({ url }) => {
      const parsed = new URL(url);
      const ruta = parsed.pathname;
      const paymentId = parsed.searchParams.get('payment_id');

      if (ruta === '/pago-exitoso' && paymentId) {
        const response = await Http.get({
          url: `${environment.apiUrl}/pago/validar`,
          headers: {},
          params: { payment_id: paymentId }
        });

        if (response.data.approved) {
          alert('✅ Recarga confirmada con éxito');
        } else {
          alert('⚠️ El pago no fue aprobado');
        }
      } else if (ruta === '/pago-fallido') {
        alert('❌ El pago fue rechazado');
      } else if (ruta === '/pago-pendiente') {
        alert('⏳ El pago está pendiente');
      }
    });
  }

  async obtenerPlanes() {
  this.cargando = true;
  this.errorAlCargarPlanes = false; // Reinicia error

  try {
    const response = await Http.get({
      url: `${environment.apiUrl}/planes`,
      headers: {},
      params: {}
    });
    this.planes = response.data || [];
  } catch (error) {
    console.error(' Error al obtener planes:', error);
    this.errorAlCargarPlanes = true; // Marca el error específico
    this.planes = [];
  } finally {
    this.cargando = false;
  }
}


  iniciarPusher() {
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster
    });

    this.canal = this.pusher.subscribe('planes-channel') as Channel;

    this.canal.bind('planes_actualizados', () => {
      this.obtenerPlanes();
    });

    this.canal.bind('pusher:subscription_error', (status: any) => {
      console.error('❌ Error al suscribirse a Pusher:', status);
    });
  }

  async iniciarRecarga(plan: any) {
    const userId = localStorage.getItem('user_id');

    if (!userId || userId.length < 10) {
      alert('⚠️ Debes iniciar sesión correctamente para hacer una recarga');
      return;
    }

    const payload = {
      title: plan.name,
      price: plan.price,
      user_id: userId
    };

    try {
      const response = await Http.post({
        url: `${environment.apiUrl}/pago/mercadopago`,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
        params: {}
      });

      const initPoint = response.data?.init_point;
      if (initPoint) {
        await Browser.open({ url: initPoint });
      } else {
        alert('No se pudo generar el enlace de pago');
      }

    } catch (error: any) {
      console.error('❌ Error al iniciar pago:', error);
      alert(error?.error?.detail || 'Hubo un problema al contactar con el sistema de pagos');
    }
  }

  async enviarSolicitudChip() {
    const userId = localStorage.getItem('user_id');
    const { tipo, nombre, telefono, direccion } = this.chipForm;

    const datosValidos =
      tipo === 'nueva'
        ? nombre.trim() !== '' && direccion.trim() !== ''
        : nombre.trim() !== '' && this.telefonoValido && direccion.trim() !== '';

    if (!userId || !datosValidos) {
      alert('⚠️ Completa todos los campos correctamente antes de continuar');
      return;
    }

    const payload: any = {
      userId,
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      tipo
    };

    if (tipo === 'portabilidad') {
      payload.telefono = telefono.trim();
    }

    this.enviandoSolicitud = true;

    try {
      const res = await Http.post({
        url: `${environment.apiUrl}/chip/solicitud`,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
        params: {}
      });

      alert('📦 Solicitud enviada correctamente');

      const historialChip = JSON.parse(localStorage.getItem('historial_chip') || '[]');
      historialChip.push({ fecha: new Date().toISOString(), ...payload });
      localStorage.setItem('historial_chip', JSON.stringify(historialChip));

      this.chipForm = { tipo: 'nueva', nombre: '', telefono: '', direccion: '' };
    } catch (error) {
      alert('❌ Error al enviar la solicitud de chip');
      console.error(error);
    } finally {
      this.enviandoSolicitud = false;
    }
  }

  ngOnDestroy() {
    this.canal?.unbind_all();
    this.pusher?.disconnect();
  }
}
