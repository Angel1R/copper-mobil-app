import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {
  cargando: boolean = true;

  constructor() {}

  async ngOnInit() {
    // Aquí se puede agregar cualquier lógica que necesite cargar al iniciar
    this.cargando = false;
  }
}
