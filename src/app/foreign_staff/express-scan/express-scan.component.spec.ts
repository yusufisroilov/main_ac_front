import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressScanComponent } from './express-scan.component';

describe('ExpressScanComponent', () => {
  let component: ExpressScanComponent;
  let fixture: ComponentFixture<ExpressScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpressScanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpressScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
