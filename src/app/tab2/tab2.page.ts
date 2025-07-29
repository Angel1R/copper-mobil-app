import { Component, OnInit, OnDestroy } from '@angular/core';                  // Ciclo de vida de Angular
import { Http } from '@capacitor-community/http';                              // Cliente HTTP nativo de Capacitor
import { environment } from 'src/environments/environment';                    // Variables de entorno (API URL, Pusher key/cluster)
import Pusher, { Channel } from 'pusher-js';                                   // Cliente Pusher para WebSockets
import { Browser } from '@capacitor/browser';                                  // Para abrir enlaces de pago en navegador
import { App } from '@capacitor/app';                                          // Para escuchar deep links de la app
import { ToastService } from '../services/toast.service';                     // Servicio personalizado de toasts
import { AlertController, NavController } from '@ionic/angular';               // Controladores de alertas y navegación

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',                                            // HTML asociado
  styleUrls: ['./tab2.page.scss'],                                            // CSS/SCSS asociado
  standalone: false
})
export class Tab2Page implements OnInit, OnDestroy {

  // Lista de planes traídos del backend
  planes: any[] = [];

  // Banderas de estado de carga y error
  cargando = true;
  errorAlCargarPlanes = false;

  // Control de vista interna (planes o solicitud de chip)
  vistaSeleccionada = 'planes';

  // Instancias de Pusher y canal suscrito
  private pusher: Pusher | null = null;
  private canal: Channel | null = null;

  // Modelo de formulario para solicitud de chip
  chipForm = {
    tipo: 'nueva',       // 'nueva' o 'portabilidad'
    nombre: '',          // Nombre del solicitante
    telefono: '',        // Solo para portabilidad (12 dígitos)
    direccion: ''        // Dirección de envío
  };

  // Bandera para deshabilitar la UI mientras se envía
  enviandoSolicitud: boolean = false;

  constructor(
    private toast: ToastService,             // Mostrar notificaciones
    private alertCtrl: AlertController,      // Crear alertas modales
    private navCtrl: NavController           // Navegación programática
  ) {}

  // Getter para validar que el teléfono tenga 12 dígitos numéricos
  get telefonoValido(): boolean {
    return /^[0-9]{12}$/.test(this.chipForm.telefono.trim());
  }

  // Al iniciarse el componente
  async ngOnInit() {
    await this.obtenerPlanes();     // Cargar lista de planes
    this.iniciarPusher();           // Suscribirse a actualizaciones en tiempo real
    this.configurarDeepLinks();     // Configurar escucha de deep links de pagos
  }

  // Configura listener para deep links (pago-exitoso, pago-fallido, pago-pendiente)
  private configurarDeepLinks() {
    App.addListener('appUrlOpen', async ({ url }) => {
      const parsed = new URL(url);
      const ruta = parsed.pathname;
      const paymentId = parsed.searchParams.get('payment_id');

      if (ruta === '/pago-exitoso' && paymentId) {
        // Validar pago exitoso en backend
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

  // Obtiene la lista de planes desde el API y maneja estados de carga/error
  private async obtenerPlanes() {
    this.cargando = true;
    this.errorAlCargarPlanes = false;

    try {
      const response = await Http.get({
        url: `${environment.apiUrl}/planes`,
        headers: {},
        params: {}
      });
      this.planes = response.data || [];
    } catch (error) {
      console.error('Error al obtener planes:', error);
      this.errorAlCargarPlanes = true;
      this.planes = [];
    } finally {
      this.cargando = false;
    }
  }

  // Inicializa Pusher para recibir eventos de actualización de planes en tiempo real
  private iniciarPusher() {
    this.pusher = new Pusher(environment.pusherKey, {
      cluster: environment.pusherCluster
    });

    this.canal = this.pusher.subscribe('planes-channel') as Channel;

    // Al evento 'planes_actualizados' recargar lista
    this.canal.bind('planes_actualizados', () => {
      this.obtenerPlanes();
    });

    // Manejar errores de suscripción
    this.canal.bind('pusher:subscription_error', (status: any) => {
      console.error('❌ Error al suscribirse a Pusher:', status);
    });
  }

  // Inicia el flujo de recarga: verifica perfil, crea preferencia y abre MercadoPago
  async iniciarRecarga(plan: any) {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      this.toast.mostrarToast('⚠️ Inicia sesión correctamente para recargar');
      return;
    }

    // 1) Validar que el usuario tenga email
    let email: string | null = null;
    try {
      const perfil = await Http.get({
        url: `${environment.apiUrl}/auth/profile/${userId}`,
        headers: {},
        params: {}
      });
      email = perfil.data.email;

      if (!email) {
        // Si no hay email, mostrar alerta para ir a perfil
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

    // 2) Crear payload de preferencia de pago
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
      // POST a MercadoPago para obtener init_point
      const response = await Http.post({
        url: `${environment.apiUrl}/pago/mercadopago`,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
        params: {}
      });

      const initPoint = response.data?.init_point;
      if (initPoint) {
        // Abrir navegador con enlace de pago
        await Browser.open({ url: initPoint });
      } else {
        this.toast.mostrarToast('No se pudo generar el enlace de pago');
      }

    } catch (error: any) {
      console.error('❌ Error al iniciar pago:', error);
      this.toast.mostrarToast(
        error?.error?.detail || 'Hubo un problema al procesar el pago',
        'danger'
      );
    }
  }

  // Envía la solicitud de chip (nueva o portabilidad) y guarda histórico en localStorage
  async enviarSolicitudChip() {
    const userId = localStorage.getItem('user_id');
    const { tipo, nombre, telefono, direccion } = this.chipForm;

    // Validar campos según tipo de solicitud
    const datosValidos =
      tipo === 'nueva'
        ? nombre.trim() !== '' && direccion.trim() !== ''
        : nombre.trim() !== '' && this.telefonoValido && direccion.trim() !== '';

    if (!userId || !datosValidos) {
      this.toast.mostrarToast('⚠️ Completa todos los campos correctamente antes de continuar');
      return;
    }

    // Construir payload
    const payload: any = {
      userId,
      nombre:    nombre.trim(),
      direccion: direccion.trim(),
      tipo
    };
    if (tipo === 'portabilidad') {
      payload.telefono = telefono.trim();
    }

    this.enviandoSolicitud = true;

    try {
      // POST de solicitud de chip
      await Http.post({
        url: `${environment.apiUrl}/chip/solicitud`,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
        params: {}
      });

      this.toast.mostrarToast('📦 Solicitud enviada correctamente');

      // Guardar histórico local
      const historialChip = JSON.parse(localStorage.getItem('historial_chip') || '[]');
      historialChip.push({ fecha: new Date().toISOString(), ...payload });
      localStorage.setItem('historial_chip', JSON.stringify(historialChip));

      // Reset del formulario
      this.chipForm = { tipo: 'nueva', nombre: '', telefono: '', direccion: '' };

    } catch (error) {
      this.toast.mostrarToast('❌ Error al enviar la solicitud de chip');
      console.error(error);
    } finally {
      this.enviandoSolicitud = false;
    }
  }

  // Al destruir el componente, limpiar suscripciones de Pusher
  ngOnDestroy() {
    this.canal?.unbind_all();
    this.pusher?.disconnect();
  }
}
