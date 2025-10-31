import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployerDeliveryComponent } from './employer-delivery.component';

describe('EmployerDeliveryComponent', () => {
  let component: EmployerDeliveryComponent;
  let fixture: ComponentFixture<EmployerDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployerDeliveryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployerDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
