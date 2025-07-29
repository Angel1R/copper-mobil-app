// tab3.page.ts
import { Component } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: false
})
export class Tab3Page {
  // Inyectamos el servicio global de usuario para acceder a nombre, email y balance
  constructor(public userService: UserService) {}
}
