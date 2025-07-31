import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllreceiversComponent } from './allreceivers.component';

describe('AllreceiversComponent', () => {
  let component: AllreceiversComponent;
  let fixture: ComponentFixture<AllreceiversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllreceiversComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllreceiversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
