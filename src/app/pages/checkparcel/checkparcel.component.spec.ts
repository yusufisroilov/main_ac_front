import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckparcelComponent } from './checkparcel.component';

describe('CheckparcelComponent', () => {
  let component: CheckparcelComponent;
  let fixture: ComponentFixture<CheckparcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckparcelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckparcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
