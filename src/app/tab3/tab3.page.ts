import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {
  cargando: boolean = true;
  nombre: string = 'Usuario'; // Default por si no hay nombre en storage

  constructor() {}

  async ngOnInit() {
    const userName = localStorage.getItem('user_name');
    if (userName) {
      this.nombre = userName;
    }
    this.cargando = false;
  }
}
