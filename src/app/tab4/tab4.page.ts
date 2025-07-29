// tab4.page.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: false
})
export class Tab4Page implements OnInit {
  // MB consumidos actualmente
  consumoMB = 0;

  // Límite total de datos (5 GB = 5000 MB)
  limiteMB = 5000;

  // Porcentaje de consumo respecto al límite
  porcentaje = 0;

  // Se activa si queda 1 GB o menos y aún no se ha agotado
  advertencia = false;

  // Indica si el consumo llegó al límite
  agotado = false;

  // Lifecycle hook: al iniciar, calculamos el estado inicial
  ngOnInit() {
    this.actualizarEstado();
  }

  /**
   * Simula el consumo de datos en pasos de 500 MB.
   * - Si ya está agotado, no hace nada.
   * - Si supera el límite, lo ajusta y marca como agotado.
   * - Luego actualiza porcentaje y posibles alertas.
   */
  consumir() {
    if (this.agotado) return;

    const paso = 500; 
    this.consumoMB += paso;

    if (this.consumoMB >= this.limiteMB) {
      this.consumoMB = this.limiteMB;
      this.agotado = true;
    }

    this.actualizarEstado();
  }

  /**
   * Recalcula el porcentaje de datos consumidos y la bandera de advertencia.
   * - porcentaje = consumoMB / limiteMB * 100
   * - advertencia = queda ≤1 GB y no está agotado
   */
  actualizarEstado() {
    const restante = this.limiteMB - this.consumoMB;
    this.porcentaje = (this.consumoMB / this.limiteMB) * 100;
    this.advertencia = restante <= 1024 && !this.agotado;
  }

  /**
   * Reinicia el consumo y todos los indicadores a su estado inicial.
   */
  recargarDatos() {
    this.consumoMB = 0;
    this.advertencia = false;
    this.agotado = false;
    this.actualizarEstado();
  }
}
