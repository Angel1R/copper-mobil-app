import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnInit {
  planes: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/planes`).subscribe({
      next: (data) => this.planes = data,
      error: (err) => console.error('Error cargando planes:', err)
    });
  }
}
