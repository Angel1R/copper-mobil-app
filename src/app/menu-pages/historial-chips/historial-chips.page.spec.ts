import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialChipsPage } from './historial-chips.page';

describe('HistorialChipsPage', () => {
  let component: HistorialChipsPage;
  let fixture: ComponentFixture<HistorialChipsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialChipsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
