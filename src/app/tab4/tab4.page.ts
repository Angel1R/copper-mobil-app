import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: false
})
export class Tab4Page implements OnInit {
  consumoMB = 0;
  limiteMB = 5000; // 5 GB = 5000 MB
  porcentaje = 0;
  advertencia = false;
  agotado = false;

  ngOnInit() {
    this.actualizarEstado();
  }

  consumir() {
    if (this.agotado) return;

    const paso = 500; // Simula 250 MB por clic
    this.consumoMB += paso;

    if (this.consumoMB >= this.limiteMB) {
      this.consumoMB = this.limiteMB;
      this.agotado = true;
    }

    this.actualizarEstado();
  }

  actualizarEstado() {
    const restante = this.limiteMB - this.consumoMB;
    this.porcentaje = (this.consumoMB / this.limiteMB) * 100;
    this.advertencia = restante <= 1024 && !this.agotado; // Si queda 1 GB o menos
  }

  recargarDatos() {
    this.consumoMB = 0;
    this.advertencia = false;
    this.agotado = false;
    this.actualizarEstado();
  }
}
