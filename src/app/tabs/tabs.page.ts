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
  // Estado que indica si las tabs deben mostrarse o no
  showTabs: boolean = true;

  constructor(private navCtrl: NavController, private menuCtrl: MenuController, private router: Router) {}

  ngOnInit() {
    // Cierra el menú lateral si estaba abierto al iniciar la pantalla
    this.menuCtrl.close();

    // Detecta cuando la navegación cambia de página
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Si la URL comienza con '/tabs', muestra las tabs; si no, las oculta
        this.showTabs = event.url.startsWith('/tabs');
      }
    });
  }

  // Abre o cierra el menú lateral dependiendo de su estado actual
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  // Navega a la pantalla de perfil y oculta las tabs antes del cambio
  goToProfile() {
    this.showTabs = false; // Oculta las tabs antes de cambiar de pantalla
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/perfil'); // Redirige a perfil tras un breve delay
    }, 50);
  }

  // Navega a la pantalla de configuración y oculta las tabs antes del cambio
  goToSettings() {
    this.showTabs = false; // Oculta las tabs antes de cambiar de pantalla
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/configuracion'); // Redirige a configuración tras un breve delay
    }, 50);
  }

  // Regresa a la pantalla principal (tab3) y automáticamente muestra las tabs nuevamente
  goBackToTabs() {
    this.navCtrl.navigateBack('/tabs/tab3'); 
  }
}
