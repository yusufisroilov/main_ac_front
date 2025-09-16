import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehourInventoryComponent } from './warehour-inventory.component';

describe('WarehourInventoryComponent', () => {
  let component: WarehourInventoryComponent;
  let fixture: ComponentFixture<WarehourInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WarehourInventoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehourInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
