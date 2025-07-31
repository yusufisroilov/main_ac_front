import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllordersComponent } from './allorders.component';

describe('AllordersComponent', () => {
  let component: AllordersComponent;
  let fixture: ComponentFixture<AllordersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllordersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllordersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
