// user.service
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface UserData {
  user_id: string;
  name: string;
  email: string;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  // Sujeto que guarda el objeto de datos de usuario o null
  private datosUsuario = new BehaviorSubject<UserData | null>(null);

  // Observable público para suscribirse a cambios en los datos de usuario
  public usuario$ = this.datosUsuario.asObservable();

  constructor() {
    // Al arrancar, cargamos la información guardada en localStorage
    const user_id = localStorage.getItem('user_id') || '';
    const name    = localStorage.getItem('user_name') || 'Usuario';
    const email   = localStorage.getItem('user_email') || '';
    const balance = parseFloat(localStorage.getItem('user_balance') || '0');

    this.datosUsuario.next({ user_id, name, email, balance });
  }

  /**
   * Actualiza campos parciales del usuario y persiste en localStorage
   * @param partial Objeto con uno o varios campos de UserData
   */
  actualizarDatosParciales(partial: Partial<UserData>) {
    const actual    = this.datosUsuario.value;
    const actualizado = { ...actual, ...partial } as UserData;
    this.datosUsuario.next(actualizado);

    // Persistir en localStorage solo los campos cambiados
    if (partial.name)    localStorage.setItem('user_name', partial.name);
    if (partial.email)   localStorage.setItem('user_email', partial.email);
    if (partial.balance !== undefined)
      localStorage.setItem('user_balance', String(partial.balance));
  }

  /**
   * Retorna la última versión de los datos de usuario o null
   */
  getDatos(): UserData | null {
    return this.datosUsuario.value;
  }
}
