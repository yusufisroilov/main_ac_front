import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderBoxesComponent } from './order-boxes.component';

describe('OrderBoxesComponent', () => {
  let component: OrderBoxesComponent;
  let fixture: ComponentFixture<OrderBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderBoxesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
