import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRequestHandlerComponent } from './admin-request-handler.component';

describe('AdminRequestHandlerComponent', () => {
  let component: AdminRequestHandlerComponent;
  let fixture: ComponentFixture<AdminRequestHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminRequestHandlerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRequestHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
