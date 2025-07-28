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
  private datosUsuario = new BehaviorSubject<UserData | null>(null);

  public usuario$ = this.datosUsuario.asObservable();

  constructor() {
    // Carga inicial desde localStorage
    const user_id = localStorage.getItem('user_id') || '';
    const name = localStorage.getItem('user_name') || 'Usuario';
    const email = localStorage.getItem('user_email') || '';
    const balance = parseFloat(localStorage.getItem('user_balance') || '0');

    this.datosUsuario.next({ user_id, name, email, balance });
  }

  actualizarDatosParciales(partial: Partial<UserData>) {
    const actual = this.datosUsuario.value;
    const actualizado = { ...actual, ...partial } as UserData;
    this.datosUsuario.next(actualizado);

    // También persistimos en localStorage
    if (partial.name) localStorage.setItem('user_name', partial.name);
    if (partial.email) localStorage.setItem('user_email', partial.email);
    if (partial.balance !== undefined)
      localStorage.setItem('user_balance', String(partial.balance));
  }

  getDatos(): UserData | null {
    return this.datosUsuario.value;
  }
}
