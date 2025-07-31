import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllconsignmentsComponent } from './allconsignments.component';

describe('AllconsignmentsComponent', () => {
  let component: AllconsignmentsComponent;
  let fixture: ComponentFixture<AllconsignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllconsignmentsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllconsignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
