import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanParcelUzbComponent } from './scan-parcel-uzb.component';

describe('ScanParcelUzbComponent', () => {
  let component: ScanParcelUzbComponent;
  let fixture: ComponentFixture<ScanParcelUzbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScanParcelUzbComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanParcelUzbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
