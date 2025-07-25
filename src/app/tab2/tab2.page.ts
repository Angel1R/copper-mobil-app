import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@capacitor-community/http';
import { environment } from 'src/environments/environment';
import Pusher, { Channel } from 'pusher-js';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { ToastService } from '../services/toast.service';
import { AlertController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnInit, OnDestroy {
  
  planes: any[] = [];
  cargando = true;
  errorAlCargarPlanes = false;

  vistaSeleccionada = 'planes';

  // Pusher
  private pusher: Pusher | null = null;
  private canal: Channel | null = null;

  chipForm = {
    tipo: 'nueva',
    nombre: '',
    telefono: '',
    direccion: ''
  };

  enviandoSolicitud: boolean = false;

  constructor(
    private toast: ToastService,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  get telefonoValido(): boolean {
    return /^[0-9]{12}$/.test(this.chipForm.telefono.trim());
  }

  async ngOnInit() {
    await this.obtenerPlanes();
    this.iniciarPusher();
    this.configurarDeepLinks();
  }

  private configurarDeepLinks() {
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
          this.toast.mostrarToast('✅ Recarga confirmada con éxito');
        } else {
          this.toast.mostrarToast('⚠️ El pago no fue aprobado');
        }
      } else if (ruta === '/pago-fallido') {
        this.toast.mostrarToast('❌ El pago fue rechazado');
      } else if (ruta === '/pago-pendiente') {
        this.toast.mostrarToast('⏳ El pago está pendiente');
      }
    });
  }

  private async obtenerPlanes() {
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

  private iniciarPusher() {
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

    if (!userId) {
      this.toast.mostrarToast('⚠️ Inicia sesión correctamente para recargar');
      return;
    }

    // 1) Traer perfil y comprobar email
    let email: string | null = null;
    try {
      const perfil = await Http.get({
        url: `${environment.apiUrl}/auth/profile/${userId}`,
        headers: {},
        params: {}
      });
      email = perfil.data.email;

      if (!email) {
        const alert = await this.alertCtrl.create({
          header: 'Correo requerido',
          message: 'Debes agregar un correo en tu perfil antes de recargar.',
          buttons: [
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Ir a perfil',
              handler: () => this.navCtrl.navigateForward('/perfil')
            }
          ]
        });
        await alert.present();
        return;
      }
    } catch (err) {
      console.error('❌ Error al obtener perfil:', err);
      this.toast.mostrarToast('No se pudo verificar tu perfil', 'danger');
      return;
    }
    // ────────────────────────────────────────────────────────────

    // ── 2) Si llegamos aquí, SIEMPRE hay un email válido ──────
    const payload = {
      user_id: userId,
      plan: {
        name:          plan.name,
        price:         plan.price,
        data_limit:    plan.data_limit,
        validity_days: plan.validity_days,
        benefits:      plan.benefits
      }
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
        this.toast.mostrarToast('No se pudo generar el enlace de pago');
      }

    } catch (error: any) {
      console.error('❌ Error al iniciar pago:', error);
      this.toast.mostrarToast(error?.error?.detail || 'Hubo un problema al procesar el pago',
        'danger');
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
      this.toast.mostrarToast('⚠️ Completa todos los campos correctamente antes de continuar');
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

      this.toast.mostrarToast('📦 Solicitud enviada correctamente');

      const historialChip = JSON.parse(localStorage.getItem('historial_chip') || '[]');
      historialChip.push({ fecha: new Date().toISOString(), ...payload });
      localStorage.setItem('historial_chip', JSON.stringify(historialChip));

      this.chipForm = { tipo: 'nueva', nombre: '', telefono: '', direccion: '' };
    } catch (error) {
      this.toast.mostrarToast('❌ Error al enviar la solicitud de chip');
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
