// tabs.page.ts
import { Component, OnInit } from '@angular/core';
import { NavController, MenuController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  // Flag que controla la visibilidad de la barra de pestañas
  showTabs: boolean = true;

  constructor(
    private navCtrl: NavController,   // Para navegación programática
    private menuCtrl: MenuController, // Para controlar el menú lateral
    private router: Router            // Para escuchar eventos de ruta
  ) {}

  /**
   * Hook de Angular que se ejecuta tras la creación del componente.
   * - Cierra el menú lateral al iniciar.
   * - Se suscribe a eventos de navegación para mostrar/ocultar tabs.
   */
  ngOnInit() {
    // Asegurar el menú cerrado al entrar en la página de tabs
    this.menuCtrl.close();

    // Escuchar eventos de navegación para saber si estamos dentro de /tabs
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Mostrar tabs sólo si la ruta actual empieza con /tabs
        this.showTabs = event.url.startsWith('/tabs');
      }
    });
  }

  /**
   * Abre o cierra el menú lateral.
   */
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  /**
   * Navega al perfil de usuario.
   * Cierra las tabs, cierra el menú y avanza a /perfil.
   */
  goToProfile() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/perfil');
    }, 50);
  }

  /**
   * Navega a la configuración.
   */
  goToSettings() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/configuracion');
    }, 50);
  }

  /**
   * Navega al historial de tickets.
   */
  goToHistorial() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/historial-tickets');
    }, 50);
  }

  /**
   * Navega al historial de chips.
   */
  goToChips() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/historial-chips');
    }, 50);
  }
}
