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
  showTabs: boolean = true;

  constructor(private navCtrl: NavController, private menuCtrl: MenuController, private router: Router) {}

  ngOnInit() {
    this.menuCtrl.close();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showTabs = event.url.startsWith('/tabs');
      }
    });
  }

  toggleMenu() {
    this.menuCtrl.toggle();
  }

  goToProfile() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/perfil');
    }, 50);
  }

  goToSettings() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/configuracion');
    }, 50);
  }

  goToHistorial() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/historial-tickets');
    }, 50);
  }

  goToChips() {
    this.showTabs = false;
    this.menuCtrl.close();
    setTimeout(() => {
      this.navCtrl.navigateForward('/historial-chips');
    }, 50);
  }
}
