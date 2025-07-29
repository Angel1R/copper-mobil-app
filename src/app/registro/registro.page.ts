// registro.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';           // Ciclo de vida del componente
import { FormBuilder, FormGroup, Validators } from '@angular/forms';     // Formularios reactivos y validación
import { Http } from '@capacitor-community/http';                         // Cliente HTTP nativo
import { NavController } from '@ionic/angular';                           // Navegación entre páginas
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';      // Para el chequeo con debounce
import { environment } from 'src/environments/environment';               // Configuración de entorno (API URL)
import { ToastService } from '../services/toast.service';                 // Servicio de notificaciones
import { LADAS } from '../services/contstants';                           // Listado de prefijos telefónicos

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false
})
export class RegistroPage implements OnInit, OnDestroy {
  // Formularios para dos etapas: datos básicos y validación de OTP
  formEtapa1: FormGroup;
  formEtapa2: FormGroup;

  // Control de la etapa actual (1 = datos, 2 = OTP)
  step = 1;

  // Temporizador para expiración de código (en segundos)
  tiempoRestante = 120;
  temporizador: any;

  // Flags para indicar estado de llamadas HTTP y validaciones
  enviandoOTP = false;
  enviandoValidacion = false;
  enviandoReenvio = false;

  // Indica si el número ya está registrado
  numeroYaRegistrado = false;

  // Lista de prefijos telefónicos disponible en el template
  public ladas = LADAS;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private toast: ToastService
  ) {
    // Inicializamos el primer formulario con validadores básicos
    this.formEtapa1 = this.fb.group({
      name: ['', Validators.required],
      lada: ['+52', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]]
    });

    // Segundo formulario, solo para el código OTP
    this.formEtapa2 = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    const phoneCtrl = this.formEtapa1.get('phone')!;
    const ladaCtrl  = this.formEtapa1.get('lada')!;

    // 1) Ajustar validadores del campo phone según la lada seleccionada
    ladaCtrl.valueChanges.subscribe((code: string) => {
      const cfg = LADAS.find(l => l.code === code)!;
      phoneCtrl.setValidators([
        Validators.required,
        Validators.minLength(cfg.minDigits),
        Validators.maxLength(cfg.minDigits)
      ]);
      phoneCtrl.updateValueAndValidity();
    });

    // 2) Checar existencia de número con debounce para no saturar la API
    phoneCtrl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(raw => this.checarNumeroRegistrado(raw));
  }

  ngOnDestroy() {
    // Limpiar cualquier intervalo activo al destruir el componente
    clearInterval(this.temporizador);
  }

  /**
   * Verifica en el backend si un número ya está registrado.
   * @param rawPhone Número sin prefijo
   */
  private async checarNumeroRegistrado(rawPhone: string) {
    this.numeroYaRegistrado = false;

    // No ejecutamos la consulta si aún no hay suficientes dígitos
    if (!rawPhone || rawPhone.length < 10) return;

    const lada = this.formEtapa1.get('lada')?.value;
    const phone = `${lada}${rawPhone.trim()}`;

    try {
      const res = await Http.get({
        url: `${environment.apiUrl}/users/existe?phone=${phone}`,
        headers: {},
        params: {}
      });
      this.numeroYaRegistrado = res.data?.registrado;
    } catch {
      // En caso de error, asumimos que no está registrado
      this.numeroYaRegistrado = false;
    }
  }

  /**
   * Reinicia el proceso de registro a la etapa 1
   */
  resetearRegistro() {
    this.step = 1;
    this.tiempoRestante = 120;
    this.formEtapa2.reset();
    clearInterval(this.temporizador);
  }

  /**
   * Construye el número completo (lada + teléfono) para enviar al backend
   */
  public construirNumero(): string {
    const lada     = this.formEtapa1.get('lada')?.value.trim();
    const rawPhone = this.formEtapa1.get('phone')?.value.trim();
    return `${lada}${rawPhone}`;
  }

  /**
   * Inicia el temporizador que decrementa tiempoRestante cada segundo
   */
  private iniciarTemporizador() {
    this.temporizador = setInterval(() => {
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        clearInterval(this.temporizador);
      }
    }, 1000);
  }

  /**
   * Envía la solicitud de OTP al backend y avanza a la etapa 2 al exitoso
   */
  async enviarOTP() {
    // Prevenir solicitud si el formulario no es válido o el número ya existe
    if (!this.formEtapa1.valid || this.numeroYaRegistrado) {
      if (this.numeroYaRegistrado) {
        this.toast.mostrarToast('❗ Este número ya está registrado', 'warning');
      }
      return;
    }

    this.enviandoOTP = true;
    const phone = this.construirNumero();

    try {
      const res = await Http.post({
        url: `${environment.apiUrl}/auth/send-otp`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone },
        params: {}
      });

      const { status, data } = res;
      const detail = (data as any)?.detail || '';

      if (status === 200) {
        this.toast.mostrarToast('📲 Código enviado por SMS');
        this.step = 2;
        this.tiempoRestante = 120;
        this.iniciarTemporizador();

      } else if (status === 409) {
        this.toast.mostrarToast(detail || '❗ Este número ya está registrado', 'warning');

      } else if (status === 400) {
        this.toast.mostrarToast(detail || '❌ Formato de número inválido', 'warning');

      } else {
        this.toast.mostrarToast(
          `❌ Error ${status}${detail ? `: ${detail}` : ''}`,
          'danger'
        );
      }

    } catch {
      this.toast.mostrarToast('❌ No se pudo conectar al servidor', 'danger');
    } finally {
      this.enviandoOTP = false;
    }
  }

  /**
   * Verifica el OTP y, de ser correcto, crea el usuario en el backend
   */
  async verificarOTP() {
    const phone    = this.construirNumero();
    const name     = this.formEtapa1.get('name')?.value;
    const password = this.formEtapa1.get('password')?.value;
    const otp      = this.formEtapa2.get('otp')?.value;
    const email    = this.formEtapa1.get('email')?.value || null;

    this.enviandoValidacion = true;

    try {
      // 1) Validar el código OTP
      const res = await Http.post({
        url: `${environment.apiUrl}/auth/validate-otp`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone, code: otp },
        params: {}
      });

      if (res.status !== 200) {
        this.toast.mostrarToast('❌ Verificación fallida');
        return;
      }

      // 2) Crear el usuario con los datos del formulario
      const crearUsuario = await Http.post({
        url: `${environment.apiUrl}/users/`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          name,
          phone,
          password,
          email,
          balance: 0.0,
          plan: 'sin_plan',
          transactions: []
        },
        params: {}
      });

      if (crearUsuario.status !== 200 || !crearUsuario.data.user_id) {
        this.toast.mostrarToast('❌ No se pudo crear el usuario');
        return;
      }

      this.toast.mostrarToast('✅ Registro exitoso');
      this.navCtrl.navigateRoot('/login');

    } catch (err: any) {
      const errorMsg = err?.error?.detail || '❌ Código inválido o expirado';
      this.toast.mostrarToast(errorMsg, 'warning');
    } finally {
      this.enviandoValidacion = false;
    }
  }

  /**
   * Reenvía un nuevo código OTP y reinicia el temporizador
   */
  async reenviarCodigo() {
    this.enviandoReenvio = true;
    const phone = this.construirNumero();

    try {
      await Http.post({
        url: `${environment.apiUrl}/auth/send-otp`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone },
        params: {}
      });
      this.toast.mostrarToast('📲 Nuevo código enviado');
      this.tiempoRestante = 120;
      this.iniciarTemporizador();

    } catch {
      this.toast.mostrarToast('❌ No se pudo reenviar el código');
    } finally {
      this.enviandoReenvio = false;
    }
  }
}
