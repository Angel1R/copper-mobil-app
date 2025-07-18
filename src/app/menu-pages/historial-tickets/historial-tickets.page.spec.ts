import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialTicketsPage } from './historial-tickets.page';

describe('HistorialTicketsPage', () => {
  let component: HistorialTicketsPage;
  let fixture: ComponentFixture<HistorialTicketsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialTicketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
