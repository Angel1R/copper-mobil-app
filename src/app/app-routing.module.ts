import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./registro/registro.module').then( m => m.RegistroPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./menu-pages/perfil/perfil.module').then( m => m.PerfilPageModule)
  },
  {
    path: 'configuracion',
    loadChildren: () => import('./menu-pages/configuracion/configuracion.module').then( m => m.ConfiguracionPageModule)
  },
  {
    path: 'historial-tickets',
    loadChildren: () => import('./menu-pages/historial-tickets/historial-tickets.module').then( m => m.HistorialTicketsPageModule)
  },  {
    path: 'historial-chips',
    loadChildren: () => import('./menu-pages/historial-chips/historial-chips.module').then( m => m.HistorialChipsPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./menu-pages/perfil/perfil.module').then( m => m.PerfilPageModule)
  },
  {
    path: 'configuracion',
    loadChildren: () => import('./menu-pages/configuracion/configuracion.module').then( m => m.ConfiguracionPageModule)
  }


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
