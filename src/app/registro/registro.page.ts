import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@capacitor-community/http';
import { NavController } from '@ionic/angular';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ToastService } from '../services/toast.service';
import { LADAS } from '../services/contstants';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false
})
export class RegistroPage implements OnInit, OnDestroy {
  formEtapa1: FormGroup;
  formEtapa2: FormGroup;
  step = 1;

  tiempoRestante = 120;
  temporizador: any;

  enviandoOTP = false;
  enviandoValidacion = false;
  enviandoReenvio = false;

  numeroYaRegistrado = false;

  public ladas = LADAS;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private toast: ToastService
  ) {
    this.formEtapa1 = this.fb.group({
      name: ['', Validators.required],
      lada: ['+52', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.email]]
    });

    this.formEtapa2 = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    const phoneCtrl = this.formEtapa1.get('phone')!;
    const ladaCtrl  = this.formEtapa1.get('lada')!;

    // Cuando cambia el lada, actualiza minLength
    ladaCtrl.valueChanges.subscribe((code: string) => {
      const cfg = LADAS.find(l => l.code === code)!;
      phoneCtrl.setValidators([
        Validators.required,
        Validators.minLength(cfg.minDigits),
        Validators.maxLength(cfg.minDigits)
      ]);
      phoneCtrl.updateValueAndValidity();
    });

    // Checar existencia con debounce
    phoneCtrl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(raw => this.checarNumeroRegistrado(raw));
  }


  ngOnDestroy() {
    clearInterval(this.temporizador);
  }

  private async checarNumeroRegistrado(rawPhone: string) {
    this.numeroYaRegistrado = false;
    if (!rawPhone || rawPhone.length < 10) return;

    const lada = this.formEtapa1.get('lada')?.value;
    const phone = `${lada}${rawPhone.trim()}`;

    try {
      const res = await Http.get({
        url: `${environment.apiUrl}/users/existe?phone=${phone}`,
        headers: {},
        params:{}
      });
      this.numeroYaRegistrado = res.data?.registrado;
    } catch {
      this.numeroYaRegistrado = false;
    }
  }

  resetearRegistro() {
    this.step = 1;
    this.tiempoRestante = 120;
    this.formEtapa2.reset();
    clearInterval(this.temporizador);
  }

  public construirNumero(): string {
    const lada = this.formEtapa1.get('lada')?.value.trim();
    const rawPhone = this.formEtapa1.get('phone')?.value.trim();
    return `${lada}${rawPhone}`;
  }

  private iniciarTemporizador() {
    this.temporizador = setInterval(() => {
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        clearInterval(this.temporizador);
      }
    }, 1000);
  }

  async enviarOTP() {
  // Si el formulario no es válido o ya detectamos número duplicado, salimos antes
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
      params:{}
    });

    // Ahora inspeccionamos res.status
    const status = res.status;
    const detail = (res.data as any)?.detail || '';

    if (status === 200) {
      this.toast.mostrarToast('📲 Código enviado por SMS');
      this.step = 2;
      this.tiempoRestante = 120;
      this.iniciarTemporizador();

    } else if (status === 409) {
      this.toast.mostrarToast(
        detail || '❗ Este número ya está registrado',
        'warning'
      );

    } else if (status === 400) {
      this.toast.mostrarToast(
        detail || '❌ Formato de número inválido',
        'warning'
      );

    } else {
      // Cualquier otro código de error
      this.toast.mostrarToast(
        `❌ Error ${status}${detail ? `: ${detail}` : ''}`,
        'danger'
      );
    }

  } catch (err) {
    // Errores de network o plugin
    this.toast.mostrarToast('❌ No se pudo conectar al servidor', 'danger');

  } finally {
    this.enviandoOTP = false;
  }
}


  async verificarOTP() {
    const phone = this.construirNumero();
    const name = this.formEtapa1.get('name')?.value;
    const password = this.formEtapa1.get('password')?.value;
    const otp = this.formEtapa2.get('otp')?.value;
    const emailValue = this.formEtapa1.get('email')?.value || null;

    this.enviandoValidacion = true;

    try {
      const res = await Http.post({
        url: `${environment.apiUrl}/auth/validate-otp`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone, code: otp },
        params:{}
      });

      if (res.status !== 200) {
        this.toast.mostrarToast('❌ Verificación fallida');
        return;
      }

      const crearUsuario = await Http.post({
        url: `${environment.apiUrl}/users/`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          name:         this.formEtapa1.get('name')?.value,
          phone:        this.construirNumero(),
          password:     this.formEtapa1.get('password')?.value,
          email:        emailValue,            // <— aquí
          balance:      0.0,
          plan:         'sin_plan',
          transactions: []
        },
        params:{}
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

  async reenviarCodigo() {
    this.enviandoReenvio = true;
    const phone = this.construirNumero();

    try {
      await Http.post({
        url: `${environment.apiUrl}/auth/send-otp`,
        headers: { 'Content-Type': 'application/json' },
        data: { phone },
        params:{}
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
